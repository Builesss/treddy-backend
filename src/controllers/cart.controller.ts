import { Request, Response } from "express";
import { cartService } from "../services/cart.service";

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as any;
    const cart = await cartService.getCart(Number(userId), sessionId?.toString());
    res.json(cart);
  } catch (error: any) {
    console.error("Error getCart:", error);
    res.status(400).json({ error: error.message || "Error al obtener el carrito" });
  }
};

export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, productoId, cantidad } = req.body;
    const item = await cartService.addItem(
      Number(userId),
      sessionId?.toString(),
      Number(productoId),
      Number(cantidad) || 1
    );
    res.status(201).json(item);
  } catch (error: any) {
    console.error("Error addItem:", error);
    res.status(400).json({ error: error.message || "Error al agregar item" });
  }
};

export const updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, cantidad } = req.body;
    const productoId = Number(req.params.productoId);
    const result = await cartService.updateItemQuantity(Number(userId), sessionId?.toString(), productoId, cantidad);
    res.json(result);
  } catch (error: any) {
    console.error("Error updateItemQuantity:", error);
    res.status(400).json({ error: error.message || "Error al actualizar cantidad" });
  }
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as any;
    const productoId = Number(req.params.productoId);
    const result = await cartService.removeItem(Number(userId), sessionId?.toString(), productoId);
    res.json(result);
  } catch (error: any) {
    console.error("Error removeItem:", error);
    res.status(400).json({ error: error.message || "Error al eliminar item" });
  }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.query as any;
    const result = await cartService.clearCart(Number(userId), sessionId?.toString());
    res.json(result);
  } catch (error: any) {
    console.error("Error clearCart:", error);
    res.status(400).json({ error: error.message || "Error al vaciar carrito" });
  }
};

export const mergeSessionCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, userId } = req.body;
    const result = await cartService.mergeSessionCart(sessionId, Number(userId));
    res.json(result);
  } catch (error: any) {
    console.error("Error mergeSessionCart:", error);
    res.status(400).json({ error: error.message || "Error al unir carritos" });
  }
};
