import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addressController = {
  async getAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "userId es requerido" });
        return;
      }

      const direcciones = await prisma.direcciones.findMany({
        where: { usuario_id: BigInt(userId) },
        orderBy: [
          { principal: "desc" },
          { created_at: "desc" }
        ],
      });

      // Convertir BigInt a string para JSON
      const serialized = direcciones.map(d => ({
        ...d,
        id: d.id.toString(),
        usuario_id: d.usuario_id.toString(),
      }));

      res.json(serialized);
    } catch (error) {
      console.error("Error obteniendo direcciones:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id, alias, calle, numero, ciudad, departamento, codigo_postal, principal, latitud, longitud } = req.body;

      if (!usuario_id || !calle || !numero || !ciudad || !departamento || !codigo_postal) {
        res.status(400).json({ error: "Faltan campos requeridos para la dirección" });
        return;
      }

      // Si se marca como principal, desmarcar las demás
      if (principal) {
        await prisma.direcciones.updateMany({
          where: { usuario_id: BigInt(usuario_id) },
          data: { principal: false },
        });
      }

      const nuevaDireccion = await prisma.direcciones.create({
        data: {
          usuario_id: BigInt(usuario_id),
          alias: alias || null,
          calle,
          numero,
          ciudad,
          departamento,
          codigo_postal,
          latitud: latitud ? Number(latitud) : null,
          longitud: longitud ? Number(longitud) : null,
          principal: principal || false,
        },
      });

      res.status(201).json({
        ...nuevaDireccion,
        id: nuevaDireccion.id.toString(),
        usuario_id: nuevaDireccion.usuario_id.toString(),
      });
    } catch (error) {
      console.error("Error creando dirección:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async setPrincipal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { usuario_id } = req.body;

      if (!id || !usuario_id) {
        res.status(400).json({ error: "id y usuario_id son requeridos" });
        return;
      }

      // Desmarcar todas las del usuario
      await prisma.direcciones.updateMany({
        where: { usuario_id: BigInt(usuario_id) },
        data: { principal: false },
      });

      // Marcar la nueva como principal
      const actualizada = await prisma.direcciones.update({
        where: { id: BigInt(id) },
        data: { principal: true },
      });

      res.json({
        ...actualizada,
        id: actualizada.id.toString(),
        usuario_id: actualizada.usuario_id.toString(),
      });
    } catch (error) {
      console.error("Error estableciendo dirección principal:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { alias, calle, numero, ciudad, departamento, codigo_postal, principal, latitud, longitud, usuario_id } = req.body;

      if (principal && usuario_id) {
        await prisma.direcciones.updateMany({
          where: { usuario_id: BigInt(usuario_id) },
          data: { principal: false },
        });
      }

      const actualizada = await prisma.direcciones.update({
        where: { id: BigInt(id) },
        data: {
          alias,
          calle,
          numero,
          ciudad,
          departamento,
          codigo_postal,
          principal,
          latitud: latitud ? Number(latitud) : undefined,
          longitud: longitud ? Number(longitud) : undefined,
        },
      });

      res.json({
        ...actualizada,
        id: actualizada.id.toString(),
        usuario_id: actualizada.usuario_id.toString(),
      });
    } catch (error) {
      console.error("Error actualizando dirección:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.direcciones.delete({
        where: { id: BigInt(id) },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error eliminando dirección:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};
