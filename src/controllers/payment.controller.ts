import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";

export const createPreference = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Debes enviar una lista de items" });
      return;
    }

    const preference = await paymentService.createPreference(items, userId);

    res.json({
      message: "Preferencia creada correctamente",
      ...preference,
    });
  } catch (error: any) {
    console.error("Error creando preferencia:", error.response || error);
    res.status(500).json({
      error: error.message || "Error creando la preferencia",
    });
  }
};
