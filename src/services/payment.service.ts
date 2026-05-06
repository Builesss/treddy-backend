import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const preference = new Preference(client);

export const paymentService = {
  async createPreference(items: any[]) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("La lista de items es obligatoria");
    }

    const preferenceData = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        currency_id: item.currency_id,
        unit_price: item.unit_price,
      })),
      back_urls: {
        success: `${process.env.BACKEND_URL}/success`,
        failure: `${process.env.BACKEND_URL}/failure`,
        pending: `${process.env.BACKEND_URL}/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
    };

    const response = await preference.create({ body: preferenceData });

    return {
      id: response.id,
      init_point: response.init_point,
    };
  },
};
