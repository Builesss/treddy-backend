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

    const frontendUrl = process.env.FRONTEND_URL || "https://treddy-frontend.vercel.app";
    const backendUrl = process.env.BACKEND_URL || "https://treddy-backend.onrender.com";

    const preferenceData: any = {
      items: items.map((item) => ({
        id: String(item.id),
        title: item.title,
        quantity: Number(item.quantity),
        currency_id: item.currency_id || "COP",
        unit_price: Number(item.unit_price),
      })),
      back_urls: {
        success: `${frontendUrl}/success`,
        failure: `${frontendUrl}/success?status=failure`,
        pending: `${frontendUrl}/success?status=pending`,
      },
      auto_return: "approved" as const,
      statement_descriptor: "TREDDY",
    };

    // Solo agregar notification_url si el backend es accesible públicamente
    if (backendUrl && !backendUrl.includes("localhost")) {
      preferenceData.notification_url = `${backendUrl}/api/payment/webhook`;
    }

    console.log("📦 Creating MP preference with items:", JSON.stringify(preferenceData.items));

    const response = await preference.create({ body: preferenceData });

    console.log("✅ MP preference created:", response.id, "| init_point:", response.init_point);

    return {
      id: response.id,
      init_point: response.init_point,
    };
  },
};
