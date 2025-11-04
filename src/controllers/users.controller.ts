import { Request, Response } from "express";
import { usersService } from "../services/users.service";

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "El correo es obligatorio" });
      return;
    }

    const result = await usersService.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    console.error("Error en requestPasswordReset:", error);
    const status = error.message === "Usuario no encontrado" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token y nueva contraseña son obligatorios" });
      return;
    }

    const result = await usersService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error: any) {
    console.error("Error en resetPassword:", error);
    res.status(400).json({ message: error.message });
  }
};
