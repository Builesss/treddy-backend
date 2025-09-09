// src/controllers/webhook.controller.ts
import { Request, Response } from "express";

export const webhookController = async (req: Request, res: Response) => {
  try {
    if (req.body.type === "payment" && req.body.data?.id) {
      const paymentId = req.body.data.id;
      console.log(`Procesando pago con ID: ${paymentId}`);
    }

    res.sendStatus(200); 
  } catch (error) {
    console.error("Error en webhook:", error);
    res.status(500).json({ error: "Error interno en webhook" });
  }
};
