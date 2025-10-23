import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const getFiguras = async (req: Request, res: Response) => {
  try {
    const figuras = await prisma.productos.findMany();

    const figurasConUrl = figuras.map((figura) => ({
      ...figura,
      producto_id: Number(figura.producto_id),
      imagenUrl: `${req.protocol}://${req.get("host")}/images/${figura.imagen}`,
      cantidad: 1,
    }));

    res.json(figurasConUrl);
  } catch (error) {
    console.error("Error al obtener las figuras:", error);
    res.status(500).json({ error: "Error al obtener las figuras" });
  }
};

export const getFiguraById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const figura = await prisma.productos.findUnique({
      where: { producto_id: Number(id) },
    });

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const figuraConUrl = {
      ...figura,
      producto_id: Number(figura.producto_id),
      imagenUrl: `${req.protocol}://${req.get("host")}/images/${figura.imagen}`,
    };

    res.json(figuraConUrl);
  } catch (error) {
    console.error("Error al obtener figura:", error);
    res.status(500).json({ error: "Error al obtener la figura" });
  }
};

export const createFigura = async (req: Request, res: Response) => {
  try {
    const { nombre, precio, imagenUrl, categorias } = req.body;

    if (!nombre || !precio) {
      res.status(400).json({ error: "El nombre y precio son obligatorios" });
      return;
    }

    const imagen = imagenUrl?.split("/").pop() || "default.png";

    const nuevaFigura = await prisma.productos.create({
      data: {
        nombre,
        precio_base: parseFloat(precio),
        imagen,
        categoria: categorias?.[0] || "General",
        stock: 10,
        estado: "activo",
      },
    });

    const figuraConUrl = {
      ...nuevaFigura,
      producto_id: Number(nuevaFigura.producto_id),
      imagenUrl: `${req.protocol}://${req.get("host")}/images/${nuevaFigura.imagen}`,
    };

    res.status(201).json(figuraConUrl);
  } catch (error) {
    console.error("Error al crear figura:", error);
    res.status(500).json({ error: "Error al crear la figura" });
  }
};

export const updateFigura = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, precio, imagenUrl, categorias } = req.body;

  try {
    const figuraExistente = await prisma.productos.findUnique({
      where: { producto_id: Number(id) },
    });

    if (!figuraExistente) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const imagen = imagenUrl?.split("/").pop() || figuraExistente.imagen;

    const figuraActualizada = await prisma.productos.update({
      where: { producto_id: Number(id) },
      data: {
        nombre: nombre || figuraExistente.nombre,
        precio_base: precio ? parseFloat(precio) : figuraExistente.precio_base,
        imagen,
        categoria: categorias?.[0] || figuraExistente.categoria,
      },
    });

    const figuraConUrl = {
      ...figuraActualizada,
      producto_id: Number(figuraActualizada.producto_id),
      imagenUrl: `${req.protocol}://${req.get("host")}/images/${figuraActualizada.imagen}`,
    };

    res.json(figuraConUrl);
  } catch (error) {
    console.error("Error al actualizar figura:", error);
    res.status(500).json({ error: "Error al actualizar la figura" });
  }
};

export const deleteFigura = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const figura = await prisma.productos.findUnique({
      where: { producto_id: Number(id) },
    });

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    await prisma.productos.delete({
      where: { producto_id: Number(id) },
    });

    res.json({ message: "Figura eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar figura:", error);
    res.status(500).json({ error: "Error al eliminar la figura" });
  }
};
