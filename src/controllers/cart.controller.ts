import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

function getIdentity(req: Request) {
  const userId =
    (req.headers["x-user-id"] as string) ??
    (req.query.userId as string) ??
    (req.body?.userId as string);

  const sessionId =
    (req.headers["x-session-id"] as string) ??
    (req.query.sessionId as string) ??
    (req.body?.sessionId as string);

  return {
    userId: userId ? Number(userId) : undefined,
    sessionId: sessionId || undefined,
  };
}

async function getOrCreateCart(userId?: number, sessionId?: string) {
  if (!userId && !sessionId) throw new Error("Debes enviar userId o sessionId");

  if (userId) {
    const existing = await prisma.carrito.findUnique({ where: { user_id: userId } });
    if (existing) return existing;

    if (sessionId) {
      const sessionCart = await prisma.carrito.findUnique({
        where: { session_id: sessionId },
        include: { carrito_item: true },
      });

      if (sessionCart) {
        const merged = await prisma.$transaction(async (tx) => {
          const userCart = await tx.carrito.create({ data: { user_id: userId } });

          for (const it of sessionCart.carrito_item) {
            await tx.carrito_item.upsert({
              where: {
                carrito_id_producto_id: {
                  carrito_id: userCart.id,
                  producto_id: it.producto_id,
                },
              },
              create: {
                carrito_id: userCart.id,
                producto_id: it.producto_id,
                cantidad: it.cantidad ?? 1,
                precio_unitario: it.precio_unitario,
              },
              update: { cantidad: { increment: it.cantidad ?? 1 } },
            });
          }

          await tx.carrito.delete({ where: { id: sessionCart.id } });
          return userCart;
        });

        return merged;
      }
    }

    return prisma.carrito.create({ data: { user_id: userId } });
  }

  const existingBySession = await prisma.carrito.findUnique({ where: { session_id: sessionId! } });
  if (existingBySession) return existingBySession;

  return prisma.carrito.create({ data: { session_id: sessionId! } });
}

function normalizeCartResponse(cart: any, req: Request) {
  if (!cart) return cart;
  return {
    ...cart,
    id: Number(cart.id),
    user_id: cart.user_id != null ? Number(cart.user_id) : null,
    carrito_item: (cart.carrito_item || []).map((it: any) => ({
      ...it,
      id: Number(it.id),
      carrito_id: Number(it.carrito_id),
      producto_id: Number(it.producto_id),
      cantidad: it.cantidad ?? 1,
      precio_unitario: it.precio_unitario,
      productos: it.productos
        ? {
            ...it.productos,
            producto_id: Number(it.productos.producto_id),
            imagenUrl: it.productos.imagen
              ? `${req.protocol}://${req.get("host")}/images/${it.productos.imagen}`
              : null,
          }
        : null,
    })),
  };
}

async function touchCarritoUpdatedAt(carritoId: number) {
  await prisma.carrito.update({
    where: { id: carritoId },
    data: { updated_at: new Date() },
  });
}

export const getCart = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const base = await getOrCreateCart(userId, sessionId);

    const cart = await prisma.carrito.findUnique({
      where: { id: base.id },
      include: {
        carrito_item: {
          include: {
            productos: {
              select: {
                producto_id: true,
                nombre: true,
                descripcion: true,
                precio_base: true,
                imagen: true,
                categoria: true,
                stock: true,
                estado: true,
              },
            },
          },
        },
      },
    });

    const normalized = normalizeCartResponse(cart, req);

    const total = (normalized?.carrito_item || []).reduce((acc: Decimal, it: any) => {
      const p = new Decimal(it.precio_unitario.toString());
      const c = new Decimal((it.cantidad ?? 1).toString());
      return acc.plus(p.mul(c));
    }, new Decimal(0));

    res.json({ ...normalized, total: total.toFixed(2) });
  } catch (error: any) {
    console.error("Error getCart:", error);
    res.status(400).json({ error: error.message || "Error al obtener el carrito" });
  }
};

export const addItem = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const { productoId, cantidad } = req.body as { productoId: number; cantidad?: number };

    if (!productoId) {
      res.status(400).json({ error: "productoId es obligatorio" });
      return;
    }

    const qty = cantidad && cantidad > 0 ? Number(cantidad) : 1;
    const cart = await getOrCreateCart(userId, sessionId);

    const prod = await prisma.productos.findUnique({
      where: { producto_id: Number(productoId) },
      select: { precio_base: true, estado: true, stock: true },
    });

    if (!prod) {
      res.status(404).json({ error: "Producto no existe" });
      return;
    }
    if (prod.estado && prod.estado !== "activo") {
      res.status(400).json({ error: "Producto no disponible" });
      return;
    }
    if (prod.stock != null && prod.stock <= 0) {
      res.status(400).json({ error: "Sin stock disponible" });
      return;
    }

    const item = await prisma.carrito_item.upsert({
      where: {
        carrito_id_producto_id: {
          carrito_id: Number(cart.id),
          producto_id: Number(productoId),
        },
      },
      create: {
        carrito_id: Number(cart.id),
        producto_id: Number(productoId),
        cantidad: qty,
        precio_unitario: prod.precio_base, 
      },
      update: {
        cantidad: { increment: qty },
      },
    });

    await touchCarritoUpdatedAt(Number(cart.id));

    res.status(201).json({
      ...item,
      id: Number(item.id),
      carrito_id: Number(item.carrito_id),
      producto_id: Number(item.producto_id),
    });
  } catch (error: any) {
    console.error("Error addItem:", error);
    res.status(400).json({ error: error.message || "Error al agregar item" });
  }
};

export const updateItemQuantity = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const productoId = Number(req.params.productoId);
    const { cantidad } = req.body as { cantidad: number };

    if (!productoId) {
      res.status(400).json({ error: "productoId inválido" });
      return;
    }

    if (!cantidad || cantidad <= 0) {
      await removeItem(req, res);
      return;
    }

    const cart = await getOrCreateCart(userId, sessionId);

    const updated = await prisma.carrito_item.update({
      where: {
        carrito_id_producto_id: {
          carrito_id: Number(cart.id),
          producto_id: Number(productoId),
        },
      },
      data: { cantidad: Number(cantidad) },
    });

    await touchCarritoUpdatedAt(Number(cart.id));

    res.json({
      ...updated,
      id: Number(updated.id),
      carrito_id: Number(updated.carrito_id),
      producto_id: Number(updated.producto_id),
    });
  } catch (error: any) {
    console.error("Error updateItemQuantity:", error);
    res.status(400).json({ error: error.message || "Error al actualizar cantidad" });
  }
};

export const removeItem = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const productoId = Number(req.params.productoId) || Number(req.body?.productoId);
    if (!productoId) {
      res.status(400).json({ error: "productoId inválido" });
      return;
    }

    const cart = await getOrCreateCart(userId, sessionId);

    await prisma.carrito_item.delete({
      where: {
        carrito_id_producto_id: {
          carrito_id: Number(cart.id),
          producto_id: Number(productoId),
        },
      },
    });

    await touchCarritoUpdatedAt(Number(cart.id));
    res.json({ ok: true });
  } catch (error: any) {
    console.error("Error removeItem:", error);
    res.status(400).json({ error: error.message || "Error al eliminar item" });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const cart = await getOrCreateCart(userId, sessionId);

    await prisma.carrito_item.deleteMany({ where: { carrito_id: Number(cart.id) } });
    await touchCarritoUpdatedAt(Number(cart.id));

    res.json({ ok: true });
  } catch (error: any) {
    console.error("Error clearCart:", error);
    res.status(400).json({ error: error.message || "Error al vaciar carrito" });
  }
};

export const mergeSessionCart = async (req: Request, res: Response) => {
  try {
    const { sessionId, userId } = req.body as { sessionId: string; userId: number };
    if (!sessionId || !userId) {
      res.status(400).json({ error: "sessionId y userId son obligatorios" });
      return;
    }

    const out = await prisma.$transaction(async (tx) => {
      let userCart = await tx.carrito.findUnique({ where: { user_id: Number(userId) } });
      if (!userCart) userCart = await tx.carrito.create({ data: { user_id: Number(userId) } });

      const sessionCart = await tx.carrito.findUnique({
        where: { session_id: sessionId },
        include: { carrito_item: true },
      });

      if (!sessionCart) return { merged: false, carrito: userCart };

      for (const it of sessionCart.carrito_item) {
        await tx.carrito_item.upsert({
          where: {
            carrito_id_producto_id: {
              carrito_id: Number(userCart.id),
              producto_id: Number(it.producto_id),
            },
          },
          create: {
            carrito_id: Number(userCart.id),
            producto_id: Number(it.producto_id),
            cantidad: it.cantidad ?? 1,
            precio_unitario: it.precio_unitario,
          },
          update: { cantidad: { increment: it.cantidad ?? 1 } },
        });
      }

      await tx.carrito.delete({ where: { id: Number(sessionCart.id) } });
      await tx.carrito.update({ where: { id: Number(userCart.id) }, data: { updated_at: new Date() } });

      return { merged: true, carrito: userCart };
    });

    res.json({
      ...out,
      carrito: out.carrito ? { ...out.carrito, id: Number(out.carrito.id) } : null,
    });
  } catch (error: any) {
    console.error("Error mergeSessionCart:", error);
    res.status(400).json({ error: error.message || "Error al unir carritos" });
  }
};
