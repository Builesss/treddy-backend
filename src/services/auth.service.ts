import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma";

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
    },
  });

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
