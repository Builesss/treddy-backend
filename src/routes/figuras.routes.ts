import { Router } from "express";
import {
  getFiguras,
  getFiguraById,
  createFigura,
  updateFigura,
  deleteFigura
} from "../controllers/figuras.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Figuras
 *   description: Rutas para gestionar figuras (CRUD completo)
 */

/**
 * @swagger
 * /api/figuras:
 *   get:
 *     summary: Obtener todas las figuras
 *     tags: [Figuras]
 *     responses:
 *       200:
 *         description: Lista de figuras disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   producto_id:
 *                     type: integer
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: Figura Hollow Knight
 *                   precio_base:
 *                     type: number
 *                     example: 50000
 *                   categoria:
 *                     type: string
 *                     example: Videojuegos
 *                   stock:
 *                     type: integer
 *                     example: 10
 *                   estado:
 *                     type: string
 *                     example: activo
 *                   imagen:
 *                     type: string
 *                     example: hollow_knight.png
 *                   imagenUrl:
 *                     type: string
 *                     example: http://localhost:4000/images/hollow_knight.png
 *       500:
 *         description: Error al obtener las figuras
 */
router.get("/", getFiguras);

/**
 * @swagger
 * /api/figuras/{id}:
 *   get:
 *     summary: Obtener una figura por su ID
 *     tags: [Figuras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la figura (producto_id)
 *     responses:
 *       200:
 *         description: Figura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 producto_id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 precio_base:
 *                   type: number
 *                 categoria:
 *                   type: string
 *                 imagenUrl:
 *                   type: string
 *       404:
 *         description: Figura no encontrada
 *       500:
 *         description: Error al obtener la figura
 */
router.get("/:id", getFiguraById);

/**
 * @swagger
 * /api/figuras:
 *   post:
 *     summary: Crear una nueva figura
 *     tags: [Figuras]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Figura Iron Man
 *               precio:
 *                 type: number
 *                 example: 120000
 *               imagenUrl:
 *                 type: string
 *                 example: http://localhost:4000/images/ironman.png
 *               categorias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Marvel", "Coleccionables"]
 *     responses:
 *       201:
 *         description: Figura creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al crear la figura
 */
router.post("/", createFigura);

/**
 * @swagger
 * /api/figuras/{id}:
 *   put:
 *     summary: Actualizar una figura existente
 *     tags: [Figuras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la figura (producto_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Figura Iron Man Edición Dorada
 *               precio:
 *                 type: number
 *                 example: 130000
 *               imagenUrl:
 *                 type: string
 *                 example: http://localhost:4000/images/ironman-gold.png
 *               categorias:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Marvel", "Edición especial"]
 *     responses:
 *       200:
 *         description: Figura actualizada exitosamente
 *       404:
 *         description: Figura no encontrada
 *       500:
 *         description: Error al actualizar la figura
 */
router.put("/:id", updateFigura);

/**
 * @swagger
 * /api/figuras/{id}:
 *   delete:
 *     summary: Eliminar una figura
 *     tags: [Figuras]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la figura (producto_id)
 *     responses:
 *       200:
 *         description: Figura eliminada correctamente
 *       404:
 *         description: Figura no encontrada
 *       500:
 *         description: Error al eliminar la figura
 */
router.delete("/:id", deleteFigura);

export default router;
