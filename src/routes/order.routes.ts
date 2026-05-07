import { Router } from "express";
import passport from "../config/passport";
import { orderController } from "../controllers/order.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de pedidos
 */

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido a cancelar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *                 enum: ["Error en dirección", "Producto equivocado", "Cambié de opinión", "Demora excesiva", "Otro"]
 *                 example: "Cambié de opinión"
 *     responses:
 *       200:
 *         description: Pedido cancelado exitosamente
 *       400:
 *         description: No se puede cancelar el pedido (estado no permitido o motivo inválido)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permiso para cancelar este pedido
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post(
  "/:id/cancel",
  passport.authenticate("jwt", { session: false }),
  orderController.cancelOrder
);

export default router;
