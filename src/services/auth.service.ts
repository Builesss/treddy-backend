import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma";
import { emailService } from "./email.service";

const prisma = new PrismaClient();

export const registerUser = async (data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  contrasena: string;
}) => {
  const existingUser = await prisma.usuarios.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("El correo ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(data.contrasena, 10);

  const newUser = await prisma.usuarios.create({
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono,
      contrasena: hashedPassword,
      tipo_usuario: "cliente",
      estado: "Pendiente",
    },
  });

  const verificationToken = jwt.sign(
    {
      id: Number(newUser.usuario_id),
      email: newUser.email,
      type: "email_verification"
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" }
  );

  await emailService.sendVerificationEmail(newUser.email, newUser.nombre, verificationToken);

  return {
    ...newUser,
    usuario_id: Number(newUser.usuario_id),
  };
};

export const loginUser = async (email: string, contrasena: string, recordar: boolean) => {
  const user = await prisma.usuarios.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isMatch = await bcrypt.compare(contrasena, user.contrasena);
  if (!isMatch) {
    throw new Error("Contraseña incorrecta");
  }

  if (user.estado === "Pendiente") {
    throw new Error("Debes verificar tu cuenta antes de iniciar sesión.");
  }

  if (user.estado === "Inactivo") {
    throw new Error("Tu cuenta está inactiva.");
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

  return { token, recordar, expiracion: expiresIn };
};

export const verifyEmail = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      type: string;
    };

    if (decoded.type !== "email_verification") {
      throw new Error("Token inválido");
    }

    const user = await prisma.usuarios.findUnique({
      where: { usuario_id: BigInt(decoded.id) },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.estado === "Activo") {
      return { message: "Tu cuenta ya ha sido verificada" };
    }

    await prisma.usuarios.update({
      where: { usuario_id: BigInt(decoded.id) },
      data: { estado: "Activo" },
    });

    return { message: "Cuenta verificada con éxito" };
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("El enlace de verificación ha expirado. Por favor solicita uno nuevo.");
    }
    throw new Error("Token inválido o expirado");
  }
};
