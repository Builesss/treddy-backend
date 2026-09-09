import { Router } from "express";
import passport from "../config/passport";
import { getResenasByProducto, createResena, deleteResena } from "../controllers/resenas.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resenas
 *   description: Reseñas de productos
 */

/**
 * @swagger
 * /api/resenas/{productoId}:
 *   get:
 *     summary: Obtener reseñas de un producto
 *     tags: [Resenas]
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de reseñas
 */
router.get("/:productoId", getResenasByProducto);

/**
 * @swagger
 * /api/resenas/{productoId}:
 *   post:
 *     summary: Crear una reseña (requiere autenticación)
 *     tags: [Resenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 example: 5
 *               comentario:
 *                 type: string
 *                 example: "Excelente figura!"
 *     responses:
 *       201:
 *         description: Reseña creada
 *       401:
 *         description: No autorizado
 */
router.post(
  "/:productoId",
  passport.authenticate("jwt", { session: false }),
  createResena
);

/**
 * @swagger
 * /api/resenas/{resenaId}:
 *   delete:
 *     summary: Eliminar una reseña propia (o si eres admin)
 *     tags: [Resenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resenaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Reseña eliminada
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Reseña no encontrada
 */
router.delete(
  "/:resenaId",
  passport.authenticate("jwt", { session: false }),
  deleteResena
);

export default router;
