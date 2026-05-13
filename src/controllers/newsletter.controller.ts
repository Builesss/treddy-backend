import { Request, Response } from "express";

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email es requerido" });
    return;
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

  if (!BREVO_API_KEY || !BREVO_LIST_ID) {
    console.error("Faltan variables de entorno para Brevo");
    res.status(500).json({ message: "Error en la configuración del servidor" });
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ message: "Suscripción exitosa" });
    } else {
      // Brevo returns 400 if contact already exists but we have updateEnabled: true
      // so it should just update them. If it still fails, handle it.
      if (data.code === "contact_already_exists") {
        res.status(200).json({ message: "Ya estás suscrito" });
      } else {
        console.error("Error de Brevo:", data);
        res.status(400).json({ message: data.message || "Error al suscribirse" });
      }
    }
  } catch (error: any) {
    console.error("Error en subscribe newsletter:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};
