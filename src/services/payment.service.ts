import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const preference = new Preference(client);

export const paymentService = {
  async createPreference(items: any[], userId?: string, sessionId?: string, codigo_pedido?: string, impuestos: number = 0, costo_envio: number = 0) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("La lista de items es obligatoria");
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://treddy-frontend.vercel.app";
    const backendUrl = process.env.BACKEND_URL || "https://treddy-backend.onrender.com";

    // Mapear items de productos
    const mpItems = items.map((item) => ({
      id: String(item.id),
      title: item.title,
      quantity: Number(item.quantity),
      currency_id: "COP",
      unit_price: Number(item.unit_price),
    }));

    // Agregar Impuestos como un item
    if (impuestos > 0) {
      mpItems.push({
        id: "TAX",
        title: "Impuestos (IVA 19%)",
        quantity: 1,
        currency_id: "COP",
        unit_price: Number(impuestos),
      });
    }

    // Agregar Envío como un item
    if (costo_envio > 0) {
      mpItems.push({
        id: "SHIPPING",
        title: "Costo de Envío",
        quantity: 1,
        currency_id: "COP",
        unit_price: Number(costo_envio),
      });
    }

    const preferenceData = {
      items: mpItems,
      payer: {
        email: items[0]?.payer_email, 
      },
      back_urls: {
        success: `${frontendUrl}/success`,
        failure: `${frontendUrl}/success?status=failure`,
        pending: `${frontendUrl}/success?status=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${backendUrl}/api/payment/webhook`,
      statement_descriptor: "TREDDY",
      external_reference: codigo_pedido || (userId ? String(userId) : sessionId),
      metadata: {
        user_id: userId,
        session_id: sessionId,
        codigo_pedido: codigo_pedido
      },
    };

    const response = await preference.create({ body: preferenceData });

    return {
      id: response.id,
      init_point: response.init_point,
    };
  },
};
