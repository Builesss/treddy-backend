import { Request, Response } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const preference = new Preference(client);

export const createPreference = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        currency_id: item.currency_id,
        unit_price: item.unit_price,
      })),
      back_urls: {
        success: `${process.env.NGROK_URL}/success`,
        failure: `${process.env.NGROK_URL}/failure`,
        pending: `${process.env.NGROK_URL}/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NGROK_URL}/api/payment/webhook`,
    };

    const response = await preference.create({ body: preferenceData });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error: any) {
    console.error("Error creando preferencia:", error.response || error);
    res.status(500).json({ error: error.message || "Error creando la preferencia" });
  }
};
