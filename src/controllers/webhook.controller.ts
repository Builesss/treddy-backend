import { Request, Response } from "express";
import { webhookService } from "../services/webhook.service";

export const webhookController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      await webhookService.handlePaymentEvent(data);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
};
