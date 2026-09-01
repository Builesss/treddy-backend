import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const obtenerAuditorias = async () => {
  return await prisma.auditoria.findMany({
    orderBy: {
      fecha: 'desc'
    },
    include: {
      usuarios: {
        select: {
          nombre: true,
          apellido: true,
          email: true
        }
      }
    }
  });
};

const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (err) {
    console.error("Error serializando objeto para auditoría:", err);
    return null; // Si no se puede serializar, evitamos tumbar el sistema
  }
};

export const registrarAuditoria = async (
  usuario_id: number,
  tabla_afectada: string,
  registro_id: number,
  accion: string,
  datos_antes?: any,
  datos_despues?: any,
  descripcion_cambio?: string
) => {
  try {
    const dataToSave: any = {
      usuario_id: BigInt(usuario_id),
      tabla_afectada,
      registro_id: BigInt(registro_id),
      accion,
    };

    if (datos_antes) dataToSave.datos_antes = serializeBigInt(datos_antes);
    if (datos_despues) dataToSave.datos_despues = serializeBigInt(datos_despues);
    if (descripcion_cambio) dataToSave.descripcion_cambio = descripcion_cambio;

    await prisma.auditoria.create({
      data: dataToSave
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
};
