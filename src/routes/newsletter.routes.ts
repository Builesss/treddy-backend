import { Router } from "express";
import { subscribe } from "../controllers/newsletter.controller";

const router = Router();

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Suscribirse al newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suscripción exitosa
 *       400:
 *         description: Error en la solicitud
 */
router.post("/subscribe", subscribe);

export default router;
