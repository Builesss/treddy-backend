import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../services/email.service";

const prisma = new PrismaClient();

const ESTADOS_CANCELABLES = ["pendiente", "en_producción"];

const MOTIVOS_CANCELACION = [
  "Error en dirección",
  "Producto equivocado",
  "Cambié de opinión",
  "Demora excesiva",
  "Otro",
];

export const orderController = {
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      if (!user || !user.usuario_id) {
        res.status(401).json({ error: "No autorizado" });
        return;
      }

      const pedidoId = BigInt(req.params.id);
      const { motivo } = req.body;

      if (!motivo || !MOTIVOS_CANCELACION.includes(motivo)) {
        res.status(400).json({
          error: "Debes seleccionar un motivo de cancelación válido",
          motivos: MOTIVOS_CANCELACION,
        });
        return;
      }

      const userId =
        typeof user.usuario_id === "bigint"
          ? user.usuario_id
          : BigInt(user.usuario_id);

      // 1. Obtener el pedido con sus detalles
      const pedido = await prisma.pedidos.findUnique({
        where: { pedido_id: pedidoId },
        include: {
          detallepedido: {
            include: { productos: true },
          },
          usuarios: true,
        },
      });

      if (!pedido) {
        res.status(404).json({ error: "Pedido no encontrado" });
        return;
      }

      // 2. Verificar que el pedido pertenece al usuario
      if (pedido.usuario_id !== userId) {
        res.status(403).json({ error: "No tienes permiso para cancelar este pedido" });
        return;
      }

      // 3. Verificar que el estado permite cancelación
      if (!ESTADOS_CANCELABLES.includes(pedido.estado || "")) {
        res.status(400).json({
          error: `No se puede cancelar un pedido en estado "${pedido.estado}". Solo se permite cancelar pedidos en estado "pendiente" o "en_producción".`,
        });
        return;
      }

      // 4. Restricción 3D: Si está en producción y tiene personalización, denegar
      if (pedido.estado === "en_producción") {
        const tienePersonalizacion = pedido.detallepedido.some(
          (d) => d.personalizacion_id !== null
        );
        if (tienePersonalizacion) {
          res.status(400).json({
            error: "No se puede cancelar: uno o más productos personalizados ya están en proceso de impresión/corte.",
          });
          return;
        }
      }

      // 5. Ejecutar cancelación en transacción
      await prisma.$transaction(async (tx) => {
        // 5a. Actualizar estado del pedido a "cancelado"
        await tx.pedidos.update({
          where: { pedido_id: pedidoId },
          data: {
            estado: "cancelado",
            updated_at: new Date(),
          },
        });

        // 5b. Restaurar stock de cada producto
        for (const detalle of pedido.detallepedido) {
          await tx.productos.update({
            where: { producto_id: detalle.producto_id },
            data: {
              stock: { increment: detalle.cantidad },
            },
          });
        }

        // 5c. Registrar en historialpedidos
        await tx.historialpedidos.create({
          data: {
            pedido_id: pedidoId,
            estado: "cancelado",
            medio_pago: pedido.medio_pago,
            total: pedido.total,
            accion: "cancelación",
            usuario_id: userId,
          },
        });

        // 5d. Registrar en auditoría
        await tx.auditoria.create({
          data: {
            usuario_id: userId,
            tabla_afectada: "pedidos",
            registro_id: pedidoId,
            accion: "cancelación",
            datos_antes: { estado: pedido.estado },
            datos_despues: { estado: "cancelado", motivo },
            descripcion_cambio: `Pedido cancelado por el cliente. Motivo: ${motivo}`,
          },
        });
      });

      // 6. Enviar emails (fuera de la transacción para no bloquearla)
      const clienteEmail = pedido.usuarios.email;
      const clienteNombre = pedido.usuarios.nombre;
      const salesEmail = process.env.SALES_EMAIL || "admintreddy@gmail.com";

      // Detalles de productos para el email
      const productosHtml = pedido.detallepedido
        .map(
          (d) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.productos.nombre}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${d.cantidad}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(d.subtotal).toLocaleString("es-CO")}</td>
            </tr>`
        )
        .join("");

      const cancelacionHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h1 style="color: #EF4444; text-align: center;">Pedido Cancelado</h1>
          <p>Hola <strong>${clienteNombre}</strong>,</p>
          <p>Tu pedido <strong>${pedido.codigo_pedido || `#${Number(pedidoId)}`}</strong> ha sido cancelado correctamente.</p>
          <p><strong>Motivo:</strong> ${motivo}</p>
          <p><strong>Fecha de cancelación:</strong> ${new Date().toLocaleString("es-CO")}</p>
          
          <h2 style="border-bottom: 2px solid #EF4444; padding-bottom: 5px;">Productos del pedido:</h2>
          <table border="0" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="text-align: left;">Producto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${productosHtml}</tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; font-size: 1.2em;">
            <strong>Total: $${Number(pedido.total).toLocaleString("es-CO")}</strong>
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #666; text-align: center;">
            Si tienes alguna duda, contáctanos a <a href="mailto:${salesEmail}">${salesEmail}</a>
          </p>
        </div>
      `;

      // Email al cliente
      try {
        await sendEmail(clienteEmail, "❌ Tu pedido en Treddy ha sido cancelado", cancelacionHtml);
      } catch (err) {
        console.error(`❌ Error enviando email de cancelación al cliente:`, err);
      }

      // Si estaba en producción, alerta al taller/admin
      if (pedido.estado === "en_producción") {
        const alertaHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h1 style="color: #F59E0B; text-align: center;">⚠️ Alerta: Pedido en Producción Cancelado</h1>
            <p>El pedido <strong>${pedido.codigo_pedido || `#${Number(pedidoId)}`}</strong> del cliente <strong>${clienteNombre}</strong> ha sido cancelado mientras estaba en producción.</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            <p><strong>Acción requerida:</strong> Detener labores de fabricación para este pedido.</p>
            <h3>Productos afectados:</h3>
            <ul>
              ${pedido.detallepedido.map((d) => `<li>${d.productos.nombre} (x${d.cantidad})</li>`).join("")}
            </ul>
          </div>
        `;

        try {
          await sendEmail(salesEmail, "⚠️ Alerta: Pedido en producción cancelado - Treddy", alertaHtml);
        } catch (err) {
          console.error(`❌ Error enviando alerta de fabricación:`, err);
        }
      }

      res.json({
        message: "Pedido cancelado exitosamente",
        pedido_id: Number(pedidoId),
        nuevo_estado: "cancelado",
        motivo,
      });
    } catch (error: any) {
      console.error("Error cancelando pedido:", error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  },
};
