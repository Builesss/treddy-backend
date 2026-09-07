import { Request, Response } from "express";
import { usersService } from "../services/users.service";
import { registrarAuditoria } from "../services/auditoria.service";

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "El correo es obligatorio" });
      return;
    }

    const result = await usersService.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    console.error("Error en requestPasswordReset:", error);
    const status = error.message === "Usuario no encontrado" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token y nueva contraseña son obligatorios" });
      return;
    }

    const result = await usersService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error: any) {
    console.error("Error en resetPassword:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    
    if (!user || !user.usuario_id) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const userId = typeof user.usuario_id === 'bigint' 
      ? Number(user.usuario_id) 
      : Number(user.usuario_id);

    const profile = await usersService.getProfile(userId);
    res.json({
      message: "Perfil obtenido con éxito",
      usuario: profile,
    });
  } catch (error: any) {
    console.error("Error en getUserProfile:", error);
    const status = error.message === "Usuario no encontrado" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};


export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || !user.usuario_id) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const userId = typeof user.usuario_id === 'bigint' 
      ? Number(user.usuario_id) 
      : Number(user.usuario_id);

    const { nombre, apellido, telefono } = req.body;
    const updated = await usersService.updateProfile(userId, {
      nombre,
      apellido,
      telefono,
    });

    await registrarAuditoria(
      userId,
      "usuarios",
      userId,
      "modificar",
      user,
      updated,
      "Actualización de perfil de usuario"
    );

    res.json({
      message: "Perfil actualizado con éxito",
      usuario: updated,
    });
  } catch (error: any) {
    console.error("Error en updateUserProfile:", error);
    const status = error.message === "Usuario no encontrado" ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || !user.usuario_id) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const userId = typeof user.usuario_id === 'bigint' 
      ? Number(user.usuario_id) 
      : Number(user.usuario_id);

    const orders = await usersService.getUserOrders(userId);
    res.json({
      message: `Se encontraron ${orders.length} pedidos`,
      pedidos: orders,
    });
  } catch (error: any) {
    console.error("Error en getUserOrders:", error);
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || !user.usuario_id) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const { contrasenaActual, nuevaContrasena } = req.body;
    if (!contrasenaActual || !nuevaContrasena) {
      res.status(400).json({ error: "La contraseña actual y la nueva son requeridas" });
      return;
    }

    const userId = Number(user.usuario_id);
    const result = await usersService.changePassword(userId, contrasenaActual, nuevaContrasena);

    await registrarAuditoria(
      userId,
      "usuarios",
      userId,
      "modificar",
      null,
      null,
      "Cambio de contraseña"
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error en changePassword:", error);
    if (error.message === "La contraseña actual es incorrecta") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};

export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || !user.usuario_id) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const prefs = await usersService.getPreferences(Number(user.usuario_id));
    res.status(200).json(prefs);
  } catch (error: any) {
    console.error("Error en getPreferences:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || !user.usuario_id) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const { notificaciones_email, notificaciones_sms, tema } = req.body;
    const prefs = await usersService.updatePreferences(Number(user.usuario_id), {
      notificaciones_email,
      notificaciones_sms,
      tema,
    });

    await registrarAuditoria(
      Number(user.usuario_id),
      "preferencias_usuario",
      Number(user.usuario_id),
      "modificar",
      null,
      prefs,
      "Actualización de preferencias de usuario"
    );

    res.status(200).json({ message: "Preferencias guardadas", ...prefs });
  } catch (error: any) {
    console.error("Error en updatePreferences:", error);
    if (error.message?.includes("Tema inválido")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || user.tipo_usuario !== 'administrador') {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error("Error en getAllUsers:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || user.tipo_usuario !== 'administrador') {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    const targetUserId = Number(req.params.id);
    const { estado, tipo_usuario } = req.body;
    
    const userAntes = await usersService.getProfile(targetUserId);

    const updated = await usersService.updateUserStatus(targetUserId, { estado, tipo_usuario });

    await registrarAuditoria(
      Number(user.usuario_id),
      "usuarios",
      targetUserId,
      "modificar",
      userAntes,
      updated,
      `Admin modificó estado/rol del usuario ID ${targetUserId}`
    );

    res.json({ message: "Usuario actualizado", usuario: updated });
  } catch (error: any) {
    console.error("Error en updateUserStatus:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    if (!user || user.tipo_usuario !== 'administrador') {
      res.status(403).json({ error: "Acceso denegado" });
      return;
    }
    const targetUserId = Number(req.params.id);
    
    if (targetUserId === Number(user.usuario_id)) {
      res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
      return;
    }

    const userAntes = await usersService.getProfile(targetUserId);

    const result = await usersService.deleteUser(targetUserId);

    await registrarAuditoria(
      Number(user.usuario_id),
      "usuarios",
      targetUserId,
      "eliminar",
      userAntes,
      null,
      `Admin eliminó al usuario ${userAntes?.email || targetUserId}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error en deleteUser:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
