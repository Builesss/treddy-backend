import { PrismaClient } from "../generated/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const usersService = {
  async requestPasswordReset(email: string) {
    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user) throw new Error("Usuario no encontrado");

    const token = jwt.sign(
      { userId: Number(user.usuario_id) },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: user.email,
      subject: "Recupera tu contraseña",
      html: `
        <h2>Recupera tu contraseña</h2>
        <p>Hola ${user.nombre || ""},</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}" style="color:#00E6F6;text-decoration:none;">${resetUrl}</a>
        <p>Este enlace expirará en 15 minutos.</p>
      `,
    });

    return { message: "Correo enviado para recuperar contraseña" };
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.usuarios.update({
        where: { usuario_id: Number(decoded.userId) },
        data: { contrasena: hashedPassword },
      });

      return { message: "Contraseña actualizada con éxito" };
    } catch {
      throw new Error("Token inválido o expirado");
    }
  },
};
