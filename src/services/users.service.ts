import { PrismaClient } from "../generated/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const usersService = {
  async getProfile(userId: number) {
    const user = await prisma.usuarios.findUnique({
      where: { usuario_id: BigInt(userId) },
      select: {
        usuario_id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        tipo_usuario: true,
        created_at: true,
      },
    });

    if (!user) throw new Error("Usuario no encontrado");

    return {
      usuario_id: Number(user.usuario_id),
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      rol: user.tipo_usuario,
      fechaRegistro: user.created_at.toISOString().split('T')[0],
    };
  },

  async updateProfile(userId: number, data: { nombre?: string; apellido?: string; telefono?: string }) {
    const user = await prisma.usuarios.findUnique({
      where: { usuario_id: BigInt(userId) },
    });

    if (!user) throw new Error("Usuario no encontrado");

    const updated = await prisma.usuarios.update({
      where: { usuario_id: BigInt(userId) },
      data: {
        nombre: data.nombre || user.nombre,
        apellido: data.apellido || user.apellido,
        telefono: data.telefono || user.telefono,
        updated_at: new Date(),
      },
      select: {
        usuario_id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        tipo_usuario: true,
        created_at: true,
      },
    });

    return {
      usuario_id: Number(updated.usuario_id),
      nombre: updated.nombre,
      apellido: updated.apellido,
      email: updated.email,
      telefono: updated.telefono,
      rol: updated.tipo_usuario,
      fechaRegistro: updated.created_at.toISOString().split('T')[0],
    };
  },

  async getUserOrders(userId: number) {
    const pedidos = await prisma.pedidos.findMany({
      where: { usuario_id: BigInt(userId) },
      include: {
        detallepedido: {
          include: {
            productos: true,
          },
        },
      },
      orderBy: { fecha_pedido: 'desc' },
    });

    return pedidos.map((pedido) => ({
      id: Number(pedido.pedido_id),
      producto: pedido.detallepedido.length > 0 
        ? pedido.detallepedido[0].productos.nombre
        : "Pedido múltiple",
      fecha: pedido.fecha_pedido.toISOString().split('T')[0],
      estado: pedido.estado || "pendiente",
      total: Number(pedido.total),
      items: pedido.detallepedido.map((detalle) => ({
        nombre: detalle.productos.nombre,
        cantidad: detalle.cantidad,
        subtotal: Number(detalle.subtotal),
      })),
    }));
  },

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
