import crypto from "crypto";
import { Request, Response } from "express";
import { cartService } from "../services/cart.service";

function serializeBigInt(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)])
    );
  } else if (typeof obj === "bigint") {
    return Number(obj);
  }
  return obj;
}

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as { userId?: string; sessionId?: string };
    const cart = await cartService.getCart(
      userId ? Number(userId) : undefined,
      sessionId?.toString()
    );
    res.json(serializeBigInt(cart));
  } catch (error: any) {
    console.error("Error getCart:", error);
    res.status(400).json({ error: error.message || "Error al obtener el carrito" });
  }
};

export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    let { userId, sessionId, productoId, cantidad } = req.body as {
      userId?: number | string;
      sessionId?: string;
      productoId?: number | string;
      cantidad?: number | string;
    };

    const parsedUserId = userId ? Number(userId) : undefined;
    let activeSessionId = sessionId;

    if (!activeSessionId && req.cookies?.sessionId) {
      activeSessionId = req.cookies.sessionId;
    }

    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
      res.cookie("sessionId", activeSessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, 
      });
    }

    const item = await cartService.addItem(
      parsedUserId,
      activeSessionId,
      Number(productoId),
      Number(cantidad) || 1
    );

    res.status(201).json(serializeBigInt(item));
  } catch (error: any) {
    console.error("Error addItem:", error);
    res.status(400).json({ error: error.message || "Error al agregar item" });
  }
};

export const updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, cantidad } = req.body as {
      userId?: number | string;
      sessionId?: string;
      cantidad?: number | string;
    };
    const productoId = Number(req.params.productoId);

    const result = await cartService.updateItemQuantity(
      userId ? Number(userId) : undefined,
      sessionId?.toString(),
      productoId,
      cantidad ? Number(cantidad) : undefined
    );

    res.json(serializeBigInt(result));
  } catch (error: any) {
    console.error("Error updateItemQuantity:", error);
    res.status(400).json({ error: error.message || "Error al actualizar cantidad" });
  }
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as { userId?: string; sessionId?: string };
    const productoId = Number(req.params.productoId);

    const result = await cartService.removeItem(
      userId ? Number(userId) : undefined,
      sessionId?.toString(),
      productoId
    );

    res.json(serializeBigInt(result));
  } catch (error: any) {
    console.error("Error removeItem:", error);
    res.status(400).json({ error: error.message || "Error al eliminar item" });
  }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as { userId?: string; sessionId?: string };

    const result = await cartService.clearCart(
      userId ? Number(userId) : undefined,
      sessionId?.toString()
    );

    res.json(serializeBigInt(result));
  } catch (error: any) {
    console.error("Error clearCart:", error);
    res.status(400).json({ error: error.message || "Error al vaciar carrito" });
  }
};

export const mergeSessionCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, userId } = req.body as { sessionId: string; userId: number | string };

    const result = await cartService.mergeSessionCart(sessionId, Number(userId));

    res.json(serializeBigInt(result));
  } catch (error: any) {
    console.error("Error mergeSessionCart:", error);
    res.status(400).json({ error: error.message || "Error al unir carritos" });
  }
};
