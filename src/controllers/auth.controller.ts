import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { registerUser, loginUser, verifyEmail } from "../services/auth.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { nombre, apellido, email, telefono, contrasena } = req.body;

  try {
    const usuario = await registerUser({ nombre, apellido, email, telefono, contrasena });
    res.status(201).json({
      message: "Usuario registrado con éxito",
      usuario,
    });
  } catch (error: any) {
    if (error.message === "El correo ya está registrado") {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, contrasena, recordar } = req.body;

  try {
    const { token, expiracion } = await loginUser(email, contrasena, recordar);
    res.json({
      message: "Login exitoso",
      token,
      recordar,
      expiracion,
    });
  } catch (error: any) {
    if (
      error.message === "Usuario no encontrado" ||
      error.message === "Contraseña incorrecta"
    ) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    res.status(200).json({
      message: "Perfil obtenido correctamente",
      user: req.user,
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({ message: "Error al obtener el perfil", error });
  }
};

export const verifyEmailAccount = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    res.status(400).json({ message: "Token inválido o ausente" });
    return;
  }

  try {
    const result = await verifyEmail(token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
