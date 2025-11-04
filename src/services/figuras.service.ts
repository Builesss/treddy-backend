import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const figurasService = {
  async getAll() {
    const figuras = await prisma.productos.findMany();
    return figuras.map((f) => ({
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
    categorias?: string[];
  }) {
    const imagen = data.imagenUrl?.split("/").pop() || "default.png";
    const nuevaFigura = await prisma.productos.create({
      data: {
        nombre: data.nombre,
        precio_base: data.precio,
        imagen,
        categoria: data.categorias?.[0] || "General",
        stock: 10,
        estado: "activo",
      },
    });
    return { ...nuevaFigura, producto_id: Number(nuevaFigura.producto_id) };
  },

  async update(
    id: number,
    data: { nombre?: string; precio?: number; imagenUrl?: string; categorias?: string[] }
  ) {
    const figuraExistente = await prisma.productos.findUnique({
      where: { producto_id: id },
    });
    if (!figuraExistente) return null;

    const imagen = data.imagenUrl?.split("/").pop() || figuraExistente.imagen;

    const figuraActualizada = await prisma.productos.update({
      where: { producto_id: id },
      data: {
        nombre: data.nombre || figuraExistente.nombre,
        precio_base: data.precio ?? figuraExistente.precio_base,
        imagen,
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
