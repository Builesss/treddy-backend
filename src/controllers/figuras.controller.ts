import { Request, Response } from "express";
import { figurasService } from "../services/figuras.service";
import { gcsKey, getPublicUrl } from "../lib/gcs";
import { registrarAuditoria } from "../services/auditoria.service";

const mapFiguraConUrls = (f: any) => {
  const key = f.imagen_path || gcsKey("images/productos", "default.png");
  const imagenUrl = getPublicUrl(key);
  const modelo3dUrl = f.modelo_3d_path ? getPublicUrl(f.modelo_3d_path) : undefined;
  const vistaArUrl = f.vista_ar_path ? getPublicUrl(f.vista_ar_path) : undefined;
  
  return { 
    ...f, 
    imagenUrl, 
    modelo3dUrl, 
    vistaArUrl,
    // Also override paths with full URLs for frontend convenience if they are just paths
    modelo_3d_path: modelo3dUrl || f.modelo_3d_path,
    vista_ar_path: vistaArUrl || f.vista_ar_path,
    cantidad: 1 
  };
};

export const getFiguras = async (req: Request, res: Response): Promise<void> => {
  try {
    // Endpoint público: solo productos activos
    const figuras = await figurasService.getAll(true);
    const figurasConUrl = figuras.map(mapFiguraConUrls);
    res.json(figurasConUrl);
  } catch (error) {
    console.error("Error al obtener las figuras:", error);
    res.status(500).json({ error: "Error al obtener las figuras" });
  }
};

export const getFigurasAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    // Endpoint admin: todos los productos (activos e inactivos)
    const figuras = await figurasService.getAll(false);
    const figurasConUrl = figuras.map(mapFiguraConUrls);
    res.json(figurasConUrl);
  } catch (error) {
    console.error("Error al obtener las figuras (admin):", error);
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

    res.json(mapFiguraConUrls(figura));
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

    const user = req.user as any;
    const userId = user?.usuario_id || user?.id || 0;

    await registrarAuditoria(
      Number(userId),
      "productos",
      Number(nueva.producto_id),
      "crear",
      null,
      nueva
    );

    res.status(201).json(mapFiguraConUrls(nueva));
  } catch (error) {
    console.error("Error al crear figura:", error);
    res.status(500).json({ error: "Error al crear la figura" });
  }
};

export const updateFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, precio, imagenUrl, modelo3dUrl, vistaArUrl, categorias } = req.body;

    const figuraAntes = await figurasService.getById(Number(id));
    if (!figuraAntes) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const figura = await figurasService.update(Number(id), {
      nombre,
      precio: precio ? parseFloat(precio) : undefined,
      imagenUrl,
      modelo3dUrl,
      vistaArUrl,
      categorias,
    });

    if (!figura) {
      res.status(404).json({ error: "Figura no encontrada tras actualizar" });
      return;
    }

    const user = req.user as any;
    const userId = user?.usuario_id || user?.id || 0;

    await registrarAuditoria(
      Number(userId),
      "productos",
      Number(figura.producto_id),
      "modificar",
      figuraAntes,
      figura
    );

    res.json(mapFiguraConUrls(figura));
  } catch (error) {
    console.error("Error al actualizar figura:", error);
    res.status(500).json({ error: "Error al actualizar la figura" });
  }
};

export const deleteFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const figuraAntes = await figurasService.getById(Number(id));
    if (!figuraAntes) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const figura = await figurasService.delete(Number(id));

    const user = req.user as any;
    const userId = user?.usuario_id || user?.id || 0;

    await registrarAuditoria(
      Number(userId),
      "productos",
      Number(figuraAntes.producto_id),
      "eliminar",
      figuraAntes,
      null
    );

    res.json({ message: "Figura eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar figura:", error);
    res.status(500).json({ error: "Error al eliminar la figura" });
  }
};

export const toggleEstadoFigura = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const figuraAntes = await figurasService.getById(Number(id));
    if (!figuraAntes) {
      res.status(404).json({ error: "Figura no encontrada" });
      return;
    }

    const figuraActualizada = await figurasService.toggleEstado(Number(id));
    if (!figuraActualizada) {
      res.status(404).json({ error: "No se pudo actualizar" });
      return;
    }

    const user = req.user as any;
    const userId = user?.usuario_id || user?.id || 0;
    const accion = figuraActualizada.estado === "activo" ? "Producto activado" : "Producto desactivado";

    await registrarAuditoria(
      Number(userId),
      "productos",
      Number(figuraActualizada.producto_id),
      "modificar",
      figuraAntes,
      figuraActualizada,
      accion
    );

    res.json(mapFiguraConUrls(figuraActualizada));
  } catch (error) {
    console.error("Error al cambiar estado de figura:", error);
    res.status(500).json({ error: "Error al cambiar el estado del producto" });
  }
};
