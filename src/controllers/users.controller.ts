import { Request, Response } from "express";
import { usersService } from "../services/users.service";

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
