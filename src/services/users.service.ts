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
      fechaRegistro: user.created_at.toISOString().split("T")[0],
    };
  },

  async updateProfile(
    userId: number,
    data: { nombre?: string; apellido?: string; telefono?: string }
  ) {
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
      fechaRegistro: updated.created_at.toISOString().split("T")[0],
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
      orderBy: { fecha_pedido: "desc" },
    });

    return pedidos.map((pedido) => ({
      id: Number(pedido.pedido_id),
      producto:
        pedido.detallepedido.length > 0
          ? pedido.detallepedido[0].productos.nombre
          : "Pedido múltiple",
      fecha: pedido.fecha_pedido.toISOString().split("T")[0],
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

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: user.email,
      subject: "Recupera tu contraseña",
      html: getResetPasswordEmailTemplate(user.nombre || "Usuario", resetUrl),
    });

    return { message: "Correo enviado para recuperar contraseña" };
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
      };

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

function getResetPasswordEmailTemplate(name: string, url: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Arial', sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; border: 1px solid #e4e4e7; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <tr>
            <td style="background-color: #000000; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">TREDDY</h1>
            </td>
          </tr>
          

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #18181b; margin-top: 0; margin-bottom: 20px; font-size: 24px; font-weight: 600;">Recuperación de Contraseña</h2>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hola <strong>${name}</strong>,
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Treddy. Si no has sido tú, puedes ignorar este correo tranquilamente.
              </p>
              

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${url}" style="background-color: #00E6F6; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                O copia y pega el siguiente enlace en tu navegador:
              </p>
              
              <p style="margin-bottom: 0;">
                <a href="${url}" style="color: #00E6F6; text-decoration: underline; word-break: break-all; font-size: 14px;">
                  ${url}
                </a>
              </p>
            </td>
          </tr>
          

          <tr>
            <td style="background-color: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Treddy. Todos los derechos reservados.
              </p>
              <p style="color: #a1a1aa; font-size: 12px; margin: 5px 0 0 0;">
                Este enlace expirará en 15 minutos por seguridad.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
