import { Request, Response } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});
const paymentClient = new Payment(mpClient);
const resend = new Resend(process.env.RESEND_API_KEY);

export const webhookController = async (req: Request, res: Response) => {
  try {
    const { type, action, data } = req.body;

    if (type === "payment" && data?.id) {
      const payment = await paymentClient.get({ id: data.id.toString() });

      if (payment.status === "approved") {
        const payerEmail = payment.payer?.email || "soporte@tu-dominio.com";
        const items = payment.additional_info?.items || [];

        const total = items.reduce(
          (acc: number, item: any) =>
            acc + Number(item.unit_price) * Number(item.quantity),
          0
        );

        await resend.emails.send({
          from: "onboarding@resend.dev", 
          to: "sebasbuiles12@hotmail.com", 
          subject: "🎉 Pago confirmado",
          html: `
            <h1>Gracias por tu compra</h1>
            <p>Tu pago de <strong>${payment.transaction_amount} ${payment.currency_id}</strong> fue aprobado.</p>
            <h2>Detalles de tu pedido:</h2>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item: any) => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.quantity}</td>
                    <td>$${Number(item.unit_price).toLocaleString("es-CO")}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="text-align:right;"><strong>Total:</strong></td>
                  <td><strong>$${total.toLocaleString("es-CO")}</strong></td>
                </tr>
              </tfoot>
            </table>
          `,
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};
