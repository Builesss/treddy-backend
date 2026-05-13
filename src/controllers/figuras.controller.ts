import { Request, Response } from "express";
import { figurasService } from "../services/figuras.service";
import { gcsKey, getPublicUrl } from "../lib/gcs";

export const getFiguras = async (req: Request, res: Response): Promise<void> => {
  try {
    const figuras = await figurasService.getAll();

    const figurasConUrl = figuras.map((f) => {
      const key = f.imagen_path || gcsKey("images/productos", "default.png");
      const imagenUrl = getPublicUrl(key);
      const modelo3dUrl = f.modelo_3d_path ? getPublicUrl(f.modelo_3d_path) : undefined;
      const vistaArUrl = f.vista_ar_path ? getPublicUrl(f.vista_ar_path) : undefined;
      return { ...f, imagenUrl, modelo3dUrl, vistaArUrl, cantidad: 1 };
    });

    res.json(figurasConUrl);
  } catch (error) {
    console.error("Error al obtener las figuras:", error);
    res.status(500).json({ error: "Error al obtener las figuras" });
  }
};

export const getFiguraById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const figura = await figurasService.getById(Number(id));

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const key = figura.imagen_path || gcsKey("images/productos", "default.png");
    const imagenUrl = getPublicUrl(key);
    const modelo3dUrl = figura.modelo_3d_path ? getPublicUrl(figura.modelo_3d_path) : undefined;
    const vistaArUrl = figura.vista_ar_path ? getPublicUrl(figura.vista_ar_path) : undefined;

    res.json({
      ...figura,
      imagenUrl,
      modelo3dUrl,
      vistaArUrl,
    });
  } catch (error) {
    console.error("Error al obtener figura:", error);
    res.status(500).json({ error: "Error al obtener la figura" });
  }
};

export const createFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, precio, imagenUrl, modelo3dUrl, vistaArUrl, categorias } = req.body;

    if (!nombre || !precio) {
      res.status(400).json({ error: "El nombre y precio son obligatorios" });
      return;
    }

    const nueva = await figurasService.create({
      nombre,
      precio: parseFloat(precio),
      imagenUrl,
      modelo3dUrl,
      vistaArUrl,
      categorias,
    });

    const key = nueva.imagen_path || gcsKey("images/productos", "default.png");
    const url = getPublicUrl(key);

    res.status(201).json({
      ...nueva,
      imagenUrl: url,
    });
  } catch (error) {
    console.error("Error al crear figura:", error);
    res.status(500).json({ error: "Error al crear la figura" });
  }
};

export const updateFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, precio, imagenUrl, modelo3dUrl, vistaArUrl, categorias } = req.body;

    const figura = await figurasService.update(Number(id), {
      nombre,
      precio: precio ? parseFloat(precio) : undefined,
      imagenUrl,
      modelo3dUrl,
      vistaArUrl,
      categorias,
    });

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const key = figura.imagen_path || gcsKey("images/productos", "default.png");
    const url = getPublicUrl(key);

    res.json({
      ...figura,
      imagenUrl: url,
    });
  } catch (error) {
    console.error("Error al actualizar figura:", error);
    res.status(500).json({ error: "Error al actualizar la figura" });
  }
};

export const deleteFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const figura = await figurasService.delete(Number(id));

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    res.json({ message: "Figura eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar figura:", error);
    res.status(500).json({ error: "Error al eliminar la figura" });
  }
};
