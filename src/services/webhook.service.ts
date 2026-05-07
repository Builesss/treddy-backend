import { MercadoPagoConfig, Payment } from "mercadopago";
import { sendEmail } from "./email.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const paymentClient = new Payment(mpClient);

export const webhookService = {
  async handlePaymentEvent(data: any) {
    if (!data?.id) throw new Error("ID de pago no proporcionado");

    const payment = await paymentClient.get({ id: data.id.toString() });
    
    console.log(`💳 Pago ${data.id} - Estado: ${payment.status} - Detalle: ${payment.status_detail}`);

    if (payment.status !== "approved") {
      console.log(`ℹ️ El pago ${data.id} no se procesará porque su estado es ${payment.status}`);
      return null;
    }

    const items = payment.additional_info?.items || [];
    const total = items.reduce(
      (acc: number, item: any) => acc + Number(item.unit_price) * Number(item.quantity),
      0
    );

    // Persistencia en base de datos
    const userId = payment.metadata?.user_id;
    const sessionId = payment.metadata?.session_id;
    const codigoPedido = payment.metadata?.codigo_pedido || payment.external_reference;
    let dbUser: any = null;
    
    const isNewFlow = codigoPedido && typeof codigoPedido === 'string' && codigoPedido.startsWith("ORD-");

    if (isNewFlow) {
      console.log(`📝 Actualizando pedido temporal: ${codigoPedido}`);
      try {
        await prisma.$transaction(async (tx) => {
          const pedidoTemporal = await tx.pedidos.findUnique({
            where: { codigo_pedido: codigoPedido }
          });

          if (pedidoTemporal) {
            await tx.pedidos.update({
              where: { pedido_id: pedidoTemporal.pedido_id },
              data: { 
                estado: "pagado", 
                pago_aprobado: true,
                medio_pago: "tarjeta",
                updated_at: new Date()
              }
            });

            dbUser = await tx.usuarios.findUnique({
              where: { usuario_id: pedidoTemporal.usuario_id }
            });

            // Limpiar el carrito
            let carrito = await tx.carrito.findUnique({
              where: { user_id: pedidoTemporal.usuario_id }
            });

            if (!carrito && sessionId) {
              carrito = await tx.carrito.findUnique({
                where: { session_id: sessionId }
              });
            }

            if (carrito) {
              await tx.carrito_item.deleteMany({
                where: { carrito_id: carrito.id }
              });
              console.log(`✅ Pedido ${pedidoTemporal.pedido_id} actualizado y carrito ${carrito.id} limpiado.`);
            }
          }
        });
      } catch (dbError) {
        console.error("❌ Error al actualizar el pedido temporal en la base de datos:", dbError);
      }
    } else if (userId || payment.external_reference) {
      const fallbackUserId = userId || payment.external_reference;
      console.log(`📝 Procesando pedido (Flujo antiguo) para el usuario ID: ${fallbackUserId}`);
      try {
        await prisma.$transaction(async (tx) => {
          // 0. Obtener el usuario de la DB
          dbUser = await tx.usuarios.findUnique({
            where: { usuario_id: BigInt(fallbackUserId) }
          });

          // 1. Crear el pedido
          const nuevoPedido = await tx.pedidos.create({
            data: {
              usuario_id: BigInt(fallbackUserId),
              total: payment.transaction_amount || total,
              medio_pago: "tarjeta", 
              estado: "pagado",
              pago_aprobado: true
            },
          });

          // 2. Crear los detalles del pedido
          if (items.length > 0) {
            await tx.detallepedido.createMany({
              data: items.map((item: any) => ({
                pedido_id: nuevoPedido.pedido_id,
                producto_id: BigInt(item.id),
                cantidad: Number(item.quantity),
                subtotal: Number(item.unit_price) * Number(item.quantity),
              })),
            });
          }

          // 3. Limpiar el carrito
          let carrito = await tx.carrito.findUnique({
            where: { user_id: BigInt(fallbackUserId) }
          });

          if (!carrito && sessionId) {
            carrito = await tx.carrito.findUnique({
              where: { session_id: sessionId }
            });
          }

          if (carrito) {
            await tx.carrito_item.deleteMany({
              where: { carrito_id: carrito.id }
            });
            console.log(`✅ Pedido ${nuevoPedido.pedido_id} creado y carrito ${carrito.id} limpiado.`);
          }
        });
      } catch (dbError) {
        console.error("❌ Error al persistir el pedido en la base de datos:", dbError);
      }
    }

    const customerEmail = dbUser?.email || payment.payer?.email;
    const salesEmail = process.env.SALES_EMAIL || "admintreddy@gmail.com";
    
    if (customerEmail) {
      console.log(`📧 Enviando confirmación al cliente: ${customerEmail}`);
    }

    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h1 style="color: #00E6F6; text-align: center;">¡Gracias por tu compra!</h1>
          <p>Hola, tu pago ha sido <strong>aprobado</strong> correctamente.</p>
          <p><strong>ID de Pago:</strong> ${payment.id}</p>
          <p><strong>Monto Total:</strong> $${Number(payment.transaction_amount).toLocaleString("es-CO")} ${payment.currency_id}</p>
          
          <h2 style="border-bottom: 2px solid #00E6F6; padding-bottom: 5px;">Detalles del pedido:</h2>
          <table border="0" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="text-align: left;">Producto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: any) => `
                <tr>
                  <td style="border-bottom: 1px solid #eee;">${item.title}</td>
                  <td style="text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                  <td style="text-align: right; border-bottom: 1px solid #eee;">$${Number(item.unit_price).toLocaleString("es-CO")}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; font-size: 1.2em;">
            <strong>Total pagado: $${Number(payment.transaction_amount).toLocaleString("es-CO")}</strong>
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #666; text-align: center;">
            Si tienes alguna duda, contáctanos a <a href="mailto:${salesEmail}">${salesEmail}</a>
          </p>
        </div>
      `;

    // Enviar a cliente
    if (customerEmail) {
      console.log(`📧 Enviando confirmación al cliente: ${customerEmail}`);
      try {
        await sendEmail(customerEmail, "🎉 Tu compra en Treddy ha sido confirmada", emailHtml);
      } catch (err) {
        console.error(`❌ Error enviando email al cliente (${customerEmail}):`, err);
      }
    }

    // Enviar a ventas
    console.log(`📧 Enviando notificación de venta a: ${salesEmail}`);
    try {
      await sendEmail(salesEmail, "🚀 Nueva venta recibida - Treddy", emailHtml);
    } catch (err) {
      console.error(`❌ Error enviando email de ventas (${salesEmail}):`, err);
    }

    return {
      status: "approved",
      id: payment.id,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      total,
      items,
    };
  },
};
