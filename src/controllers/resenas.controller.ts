import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

// GET /api/resenas/:productoId
export const getResenasByProducto = async (req: Request, res: Response): Promise<void> => {
  const productoId = BigInt(req.params.productoId);

  try {
    const resenas = await prisma.resenas.findMany({
      where: { producto_id: productoId },
      orderBy: { created_at: "desc" },
      include: {
        usuarios: {
          select: { nombre: true, apellido: true },
        },
      },
    });

    const result = resenas.map((r) => ({
      resena_id: r.resena_id.toString(),
      rating: r.rating,
      comentario: r.comentario,
      fecha: r.created_at.toISOString().split("T")[0],
      autor: `${r.usuarios.nombre} ${r.usuarios.apellido.charAt(0)}.`,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({ message: "Error al obtener reseñas" });
  }
};

// POST /api/resenas/:productoId  (requiere JWT)
export const createResena = async (req: Request, res: Response): Promise<void> => {
  const user = req.user as any;
  if (!user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const productoId = BigInt(req.params.productoId);
  const { rating, comentario } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ message: "El rating debe ser entre 1 y 5" });
    return;
  }
  if (!comentario || comentario.trim().length < 3) {
    res.status(400).json({ message: "El comentario es requerido" });
    return;
  }

  try {
    const producto = await prisma.productos.findUnique({ where: { producto_id: productoId } });
    if (!producto) {
      res.status(404).json({ message: "Producto no encontrado" });
      return;
    }

    const resena = await prisma.resenas.create({
      data: {
        producto_id: productoId,
        usuario_id: BigInt(user.usuario_id),
        rating: Number(rating),
        comentario: comentario.trim(),
      },
      include: {
        usuarios: { select: { nombre: true, apellido: true } },
      },
    });

    res.status(201).json({
      resena_id: resena.resena_id.toString(),
      rating: resena.rating,
      comentario: resena.comentario,
      fecha: resena.created_at.toISOString().split("T")[0],
      autor: `${resena.usuarios.nombre} ${resena.usuarios.apellido.charAt(0)}.`,
    });
  } catch (error) {
    console.error("Error al crear reseña:", error);
    res.status(500).json({ message: "Error al guardar la reseña" });
  }
};
