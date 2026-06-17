import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";
import { getSignedUrl, gcsKey } from "../lib/gcs";

const prisma = new PrismaClient();

async function getOrCreateCart(userId?: number, sessionId?: string) {
  if ((!userId || isNaN(userId)) && !sessionId) {
    throw new Error("Debes enviar userId o sessionId");
  }

  // Si tenemos userId, intentamos asegurar que el carrito esté vinculado
  if (userId) {
    const userCart = await prisma.carrito.findUnique({
      where: { user_id: userId },
    });

    if (sessionId) {
      const sessionCart = await prisma.carrito.findUnique({
        where: { session_id: sessionId },
        include: { carrito_item: true },
      });

      if (sessionCart) {
        // Caso A: Existe un carrito de usuario y uno de sesión -> Fusionar
        if (userCart) {
          if (userCart.id !== sessionCart.id) {
            await prisma.$transaction(async (tx: any) => {
              for (const it of sessionCart.carrito_item) {
                await tx.carrito_item.upsert({
                  where: {
                    carrito_id_producto_id_precio_unitario: {
                      carrito_id: userCart.id,
                      producto_id: it.producto_id,
                      precio_unitario: it.precio_unitario,
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
            });
          }
          return userCart;
        }

        // Caso B: No existe carrito de usuario pero sí de sesión -> Vincular sesión al usuario
        return prisma.carrito.update({
          where: { id: sessionCart.id },
          data: { user_id: userId, session_id: null }, // Limpiamos session_id al vincular
        });
      }
    }

    // Caso C: Solo tenemos userId (o no había sesión que vincular)
    if (userCart) return userCart;
    return prisma.carrito.create({ data: { user_id: userId } });
  }

  // Si solo tenemos sessionId
  const existingBySession = await prisma.carrito.findUnique({
    where: { session_id: sessionId! },
  });
  if (existingBySession) return existingBySession;

  return prisma.carrito.create({ data: { session_id: sessionId! } });
}

async function touchCartUpdatedAt(carritoId: number) {
  await prisma.carrito.update({
    where: { id: carritoId },
    data: { updated_at: new Date() },
  });
}

export const cartService = {
  async getCart(userId?: number, sessionId?: string) {
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
                imagen_path: true,
                categoria: true,
                stock: true,
                estado: true,
                modelo_3d_path: true,
                vista_ar_path: true,
              },
            },
          },
        },
      },
    });

    if (!cart) return null;

    const itemsConUrl = await Promise.all(
      cart.carrito_item.map(async (it: any) => {
        const key =
          it.productos.imagen_path || gcsKey("images/productos", "default.png");
        const imagenUrl = await getSignedUrl(key);

        const modelo3dUrl = it.productos.modelo_3d_path
          ? await getSignedUrl(it.productos.modelo_3d_path).catch(() => undefined)
          : undefined;

        const vistaArUrl = it.productos.vista_ar_path
          ? await getSignedUrl(it.productos.vista_ar_path).catch(() => undefined)
          : undefined;

        return {
          ...it,
          precio_unitario: Number(
            it.precio_unitario ?? it.productos?.precio_base ?? new Decimal(0)
          ),
          productos: {
            ...it.productos,
            imagenUrl,
            modelo3dUrl,
            vistaArUrl,
            modelo_3d_path: modelo3dUrl || it.productos.modelo_3d_path,
            vista_ar_path: vistaArUrl || it.productos.vista_ar_path,
          },
        };
      })
    );

    const total = itemsConUrl.reduce((acc: Decimal, it: any) => {
      const p = new Decimal(it.precio_unitario.toString());
      const c = new Decimal((it.cantidad ?? 1).toString());
      return acc.plus(p.mul(c));
    }, new Decimal(0));

    return { ...cart, carrito_item: itemsConUrl, total: total.toFixed(2) };
  },

  async addItem(
    userId?: number,
    sessionId?: string,
    productoId?: number,
    cantidad = 1,
    precioPersonalizado?: number
  ) {
    if (!productoId) throw new Error("productoId es obligatorio");

    const cart = await getOrCreateCart(userId, sessionId);
    const prod = await prisma.productos.findUnique({
      where: { producto_id: productoId },
      select: { precio_base: true, estado: true, stock: true },
    });

    if (!prod) throw new Error("Producto no existe");
    if (prod.estado && prod.estado !== "activo")
      throw new Error("Producto no disponible");
    if (prod.stock != null && prod.stock <= 0)
      throw new Error("Sin stock disponible");

    // Usar precio personalizado si se provee, de lo contrario usar el precio base
    const precioFinal = precioPersonalizado !== undefined
      ? new Decimal(precioPersonalizado.toString())
      : prod.precio_base;

    const item = await prisma.carrito_item.upsert({
      where: {
        carrito_id_producto_id_precio_unitario: {
          carrito_id: Number(cart.id),
          producto_id: productoId,
          precio_unitario: precioFinal,
        },
      },
      create: {
        carrito_id: Number(cart.id),
        producto_id: productoId,
        cantidad,
        precio_unitario: precioFinal,
      },
      update: {
        cantidad: { increment: cantidad },
        precio_unitario: precioFinal,
      },
    });

    await touchCartUpdatedAt(Number(cart.id));
    return item;
  },

  async updateItemQuantity(
    userId?: number,
    sessionId?: string,
    productoId?: number,
    cantidad?: number
  ) {
    if (!productoId) throw new Error("productoId inválido");
    const cart = await getOrCreateCart(userId, sessionId);

    if (!cantidad || cantidad <= 0) {
      await this.removeItem(userId, sessionId, productoId);
      return null;
    }

    const updated = await prisma.carrito_item.update({
      where: {
        id: Number(productoId),
      },
      data: { cantidad: Number(cantidad) },
    });

    await touchCartUpdatedAt(Number(cart.id));
    return updated;
  },

  async removeItem(userId?: number, sessionId?: string, productoId?: number) {
    if (!productoId) throw new Error("productoId inválido");
    const cart = await getOrCreateCart(userId, sessionId);

    await prisma.carrito_item.delete({
      where: {
        id: Number(productoId),
      },
    });

    await touchCartUpdatedAt(Number(cart.id));
    return { ok: true };
  },

  async clearCart(userId?: number, sessionId?: string) {
    const cart = await getOrCreateCart(userId, sessionId);
    await prisma.carrito_item.deleteMany({
      where: { carrito_id: Number(cart.id) },
    });
    await touchCartUpdatedAt(Number(cart.id));
    return { ok: true };
  },

  async mergeSessionCart(sessionId: string, userId: number) {
    const out = await prisma.$transaction(async (tx: any) => {
      let userCart = await tx.carrito.findUnique({
        where: { user_id: Number(userId) },
      });
      if (!userCart)
        userCart = await tx.carrito.create({
          data: { user_id: Number(userId) },
        });

      const sessionCart = await tx.carrito.findUnique({
        where: { session_id: sessionId },
        include: { carrito_item: true },
      });

      if (!sessionCart) return { merged: false, carrito: userCart };

      for (const it of sessionCart.carrito_item) {
        await tx.carrito_item.upsert({
          where: {
            carrito_id_producto_id_precio_unitario: {
              carrito_id: Number(userCart.id),
              producto_id: Number(it.producto_id),
              precio_unitario: it.precio_unitario,
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
      await tx.carrito.update({
        where: { id: Number(userCart.id) },
        data: { updated_at: new Date() },
      });

      return { merged: true, carrito: userCart };
    });

    return out;
  },
};
