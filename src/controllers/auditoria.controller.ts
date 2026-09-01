import { Request, Response } from "express";
import { obtenerAuditorias } from "../services/auditoria.service"

export const getAuditorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || user.tipo_usuario !== "administrador") {
      res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador." });
      return;
    }

    const auditorias = await obtenerAuditorias();
    
    // Convertir BigInt a string para evitar errores en JSON.stringify
    const auditoriasSerialized = auditorias.map(audit => ({
      ...audit,
      auditoria_id: audit.auditoria_id.toString(),
      usuario_id: audit.usuario_id.toString(),
      registro_id: audit.registro_id.toString()
    }));

    res.status(200).json(auditoriasSerialized);
  } catch (error) {
    console.error("Error obteniendo auditorias:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
