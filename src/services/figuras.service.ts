import { PrismaClient } from "@prisma/client";
import { gcsKey } from "../lib/gcs";

const prisma = new PrismaClient();

export const figurasService = {
  async getAll() {
    const figuras = await prisma.productos.findMany();
    return figuras.map((f: any) => ({
      ...f,
      producto_id: Number(f.producto_id),
    }));
  },

  async getById(id: number) {
    const figura = await prisma.productos.findUnique({
      where: { producto_id: id },
    });
    return figura ? { ...figura, producto_id: Number(figura.producto_id) } : null;
  },

  async create(data: {
    nombre: string;
    precio: number;
    imagenUrl?: string;
    modelo3dUrl?: string;
    vistaArUrl?: string;
    categorias?: string[];
  }) {
    const nombreArchivo = data.imagenUrl
      ? decodeURIComponent(data.imagenUrl.split("/").pop()!.split("?")[0])
      : "default.png";

    const imagen_path = gcsKey("images/productos", nombreArchivo);

    if (imagen_path.length > 255) {
      throw new Error(
        `Ruta de imagen demasiado larga (${imagen_path.length} caracteres).`
      );
    }

    const modelo_3d_path = data.modelo3dUrl
      ? gcsKey("models/productos", decodeURIComponent(data.modelo3dUrl.split("/").pop()!.split("?")[0]))
      : null;

    const vista_ar_path = data.vistaArUrl
      ? gcsKey("models/productos", decodeURIComponent(data.vistaArUrl.split("/").pop()!.split("?")[0]))
      : null;

    const nuevaFigura = await prisma.productos.create({
      data: {
        nombre: data.nombre,
        precio_base: data.precio,
        imagen_path,
        modelo_3d_path,
        vista_ar_path,
        categoria: data.categorias?.[0] || "General",
        stock: 10,
        estado: "activo",
      },
    });

    return { ...nuevaFigura, producto_id: Number(nuevaFigura.producto_id) };
  },

  async update(
    id: number,
    data: { nombre?: string; precio?: number; imagenUrl?: string; modelo3dUrl?: string; vistaArUrl?: string; categorias?: string[] }
  ) {
    const figuraExistente = await prisma.productos.findUnique({
      where: { producto_id: id },
    });
    if (!figuraExistente) return null;

    const nombreArchivo = data.imagenUrl
      ? decodeURIComponent(data.imagenUrl.split("/").pop()!.split("?")[0])
      : figuraExistente.imagen_path?.split("/").pop() || "default.png";

    const imagen_path = gcsKey("images/productos", nombreArchivo);

    if (imagen_path.length > 255) {
      throw new Error(
        `Ruta de imagen demasiado larga (${imagen_path.length} caracteres).`
      );
    }

    const modelo_3d_path = data.modelo3dUrl
      ? gcsKey("models/productos", decodeURIComponent(data.modelo3dUrl.split("/").pop()!.split("?")[0]))
      : figuraExistente.modelo_3d_path;

    const vista_ar_path = data.vistaArUrl
      ? gcsKey("models/productos", decodeURIComponent(data.vistaArUrl.split("/").pop()!.split("?")[0]))
      : figuraExistente.vista_ar_path;

    const figuraActualizada = await prisma.productos.update({
      where: { producto_id: id },
      data: {
        nombre: data.nombre || figuraExistente.nombre,
        precio_base: data.precio ?? figuraExistente.precio_base,
        imagen_path,
        modelo_3d_path,
        vista_ar_path,
        categoria: data.categorias?.[0] || figuraExistente.categoria,
      },
    });

    return { ...figuraActualizada, producto_id: Number(figuraActualizada.producto_id) };
  },

  async delete(id: number) {
    const figura = await prisma.productos.findUnique({ where: { producto_id: id } });
    if (!figura) return null;

    await prisma.productos.delete({ where: { producto_id: id } });
    return figura;
  },
};
