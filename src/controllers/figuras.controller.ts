import { Request, Response } from "express";
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export const getFiguras = async (req: Request, res: Response) => {
  try {
    const figuras = await prisma.productos.findMany();

    const figurasConUrl = figuras.map((figura) => ({
      ...figura,
      producto_id: Number(figura.producto_id),
      imagenUrl: `${req.protocol}://${req.get("host")}/images/${figura.imagen}`,
    }));

    res.json(figurasConUrl);
  } catch (error) {
    console.error("Error al obtener las figuras:", error);
    res.status(500).json({ error: "Error al obtener las figuras" });
  }
};