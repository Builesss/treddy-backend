import { Router } from 'express';
import { getFiguras } from '../controllers/figuras.controller';

const router = Router();

router.get('/', getFiguras); 

/**
 * @swagger
 * tags:
 *   name: Figuras
 *   description: Rutas para obtener figuras
 */

/**
 * @swagger
 * /api/figuras:
 *   get:
 *     summary: Obtener todas las figuras
 *     tags: [Figuras]
 *     responses:
 *       200:
 *         description: Lista de figuras
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
 *                     example: Figura de prueba
 *                   descripcion:
 *                     type: string
 *                     example: Figura de colección
 *                   precio:
 *                     type: number
 *                     example: 15000
 *                   imagen:
 *                     type: string
 *                     example: figura.jpg
 *                   imagenUrl:
 *                     type: string
 *                     example: http://localhost:4000/images/figura.jpg
 *       500:
 *         description: Error al obtener las figuras
 */

export default router;  