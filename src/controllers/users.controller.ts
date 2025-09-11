import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ message: "Usuario no encontrado" });
  }

  const token = jwt.sign(
    { userId: Number(user?.usuario_id) },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );

  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: String(user?.email),
    subject: "Recupera tu contraseña",
    html: `<p>Haz clic en el enlace para cambiar tu contraseña:</p>
           <a href="${resetUrl}">${resetUrl}</a>`,
  });

  res.json({ message: "Correo enviado para recuperar contraseña" });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { usuario_id: Number(decoded.userId) },
      data: { contrasena: hashedPassword },
    });

    res.json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado" });
  }
};
