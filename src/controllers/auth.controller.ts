import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<any> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, apellido, email, telefono, contrasena } = req.body;

  try {
    const existingUser = await prisma.usuarios.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const newUser = await prisma.usuarios.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        contrasena: hashedPassword,
        tipo_usuario: "cliente",
      },
    });

    res.status(201).json({
      message: "Usuario registrado con éxito",
      usuario: {
        ...newUser,
        usuario_id: Number(newUser.usuario_id),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, contrasena, recordar } = req.body;

  try {
    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }
    const expiresIn = recordar ? "7d" : "2h";

    const token = jwt.sign(
      {
        id: Number(user.usuario_id),
        email: user.email,
        role: user.tipo_usuario,
      },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    res.json({
      message: "Login exitoso",
      token,
      recordar,
      expiracion: expiresIn,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor", error });
  }
};
