import { Router } from "express";
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeSessionCart,
} from "../controllers/cart.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Rutas para la gestión del carrito de compras
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obtener el carrito actual (por userId o sessionId)
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: integer
 *         description: ID del usuario autenticado (opcional)
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: ID de sesión para usuarios no autenticados (opcional)
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 *       400:
 *         description: Error al obtener el carrito
 */
router.get("/", getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Agregar un producto al carrito
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: integer
 *         description: ID del usuario autenticado (opcional)
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: ID de sesión para usuarios no autenticados (opcional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *             properties:
 *               productoId:
 *                 type: integer
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Producto agregado al carrito
 *       400:
 *         description: Error al agregar el producto
 */
router.post("/items", addItem);

/**
 * @swagger
 * /api/cart/items/{productoId}:
 *   patch:
 *     summary: Actualizar la cantidad de un producto en el carrito
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: integer
 *         description: ID del usuario autenticado (opcional)
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: ID de sesión para usuarios no autenticados (opcional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cantidad actualizada correctamente
 *       400:
 *         description: Error al actualizar la cantidad
 */
router.patch("/items/:productoId", updateItemQuantity);

/**
 * @swagger
 * /api/cart/items/{productoId}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: integer
 *         description: ID del usuario autenticado (opcional)
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: ID de sesión para usuarios no autenticados (opcional)
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       400:
 *         description: Error al eliminar el producto
 */
router.delete("/items/:productoId", removeItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Vaciar todo el carrito
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: integer
 *         description: ID del usuario autenticado (opcional)
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: ID de sesión para usuarios no autenticados (opcional)
 *     responses:
 *       200:
 *         description: Carrito vaciado correctamente
 *       400:
 *         description: Error al vaciar el carrito
 */
router.delete("/", clearCart);

/**
 * @swagger
 * /api/cart/merge-session:
 *   post:
 *     summary: Unir carrito de sesión con carrito de usuario al iniciar sesión
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - userId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "abcd1234-session-temp"
 *               userId:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Carritos unidos correctamente
 *       400:
 *         description: Error al unir carritos
 */
router.post("/merge-session", mergeSessionCart);

export default router;
