import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { paymentService } from "../services/payment.service";

const prisma = new PrismaClient();

export const checkoutController = {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      // Retorna información para el resumen (impuestos, envío, etc.)
      res.json({ message: "Resumen" });
    } catch (error) {
      res.status(500).json({ error: "Error en getSummary" });
    }
  },

  async createTemporaryOrder(req: Request, res: Response): Promise<void> {
    try {
      const { items, userId, sessionId, direccionId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "Debes enviar una lista de items" });
        return;
      }

      // Calcular totales
      const subtotal = items.reduce((acc: number, item: any) => acc + Number(item.unit_price) * Number(item.quantity), 0);
      const impuestos = subtotal * 0.19;
      const costo_envio = 10000; 
      const total = subtotal + impuestos + costo_envio;

      const year = new Date().getFullYear();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const codigo_pedido = `#ORD-${year}-${randomStr}`;

      let nuevoPedido: any = null;
      
      if (userId) {
        // Crear pedido temporal
        nuevoPedido = await prisma.pedidos.create({
          data: {
            usuario_id: BigInt(userId),
            direccion_id: direccionId ? BigInt(direccionId) : null,
            codigo_pedido,
            subtotal,
            impuestos,
            costo_envio,
            total,
            medio_pago: "tarjeta",
            estado: "pendiente",
          }
        });

        // Crear detalles
        await prisma.detallepedido.createMany({
          data: items.map((item: any) => ({
            pedido_id: nuevoPedido.pedido_id,
            producto_id: BigInt(item.id),
            cantidad: Number(item.quantity),
            subtotal: Number(item.unit_price) * Number(item.quantity),
          }))
        });
      }

      // Llamar a MercadoPago para crear preferencia
      const preference = await paymentService.createPreference(
        items,
        userId,
        sessionId,
        codigo_pedido // Pasar el código temporal
      );

      res.status(201).json({
        message: "Pedido temporal y preferencia creados",
        codigo_pedido,
        preferenceId: preference.id,
        init_point: preference.init_point
      });

    } catch (error: any) {
      console.error("Error creando pedido temporal:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  }
};
