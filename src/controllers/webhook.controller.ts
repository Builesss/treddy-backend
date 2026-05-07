import { Request, Response } from "express";
import { webhookService } from "../services/webhook.service";

export const webhookController = async (req: Request, res: Response): Promise<void> => {
  console.log("🔔 Webhook recibido de Mercado Pago:", JSON.stringify(req.body, null, 2));
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      await webhookService.handlePaymentEvent(data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
};
