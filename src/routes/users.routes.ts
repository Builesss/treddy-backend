import { Router } from "express";
import passport from "../config/passport";
import { 
  requestPasswordReset, 
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getUserOrders,
  changePassword,
  getPreferences,
  updatePreferences
} from "../controllers/users.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios y perfiles
 */

/**
 * @swagger
 * /api/user/recover-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Correo enviado para recuperar contraseña
 *       400:
 *         description: Email no proporcionado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post("/recover-password", requestPasswordReset);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT recibido por email
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: nuevaPassword123
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada con éxito
 *       400:
 *         description: Token inválido o datos faltantes
 *       500:
 *         description: Error del servidor
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil obtenido con éxito
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     usuario_id:
 *                       type: number
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan
 *                     apellido:
 *                       type: string
 *                       example: Pérez
 *                     email:
 *                       type: string
 *                       example: juan@ejemplo.com
 *                     telefono:
 *                       type: string
 *                       example: "+57 300 123 4567"
 *                     rol:
 *                       type: string
 *                       example: cliente
 *                     fechaRegistro:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-20"
 *       401:
 *         description: No autorizado - Token inválido o ausente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  getUserProfile
);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Carlos
 *               apellido:
 *                 type: string
 *                 example: Pérez López
 *               telefono:
 *                 type: string
 *                 example: "+57 310 555 6789"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil actualizado con éxito
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     usuario_id:
 *                       type: number
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: Juan Carlos
 *                     apellido:
 *                       type: string
 *                       example: Pérez López
 *                     email:
 *                       type: string
 *                       example: juan@ejemplo.com
 *                     telefono:
 *                       type: string
 *                       example: "+57 310 555 6789"
 *                     rol:
 *                       type: string
 *                       example: cliente
 *                     fechaRegistro:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-20"
 *       401:
 *         description: No autorizado - Token inválido o ausente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  updateUserProfile
);

/**
 * @swagger
 * /api/user/orders:
 *   get:
 *     summary: Obtener historial de pedidos del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de pedidos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Se encontraron 3 pedidos
 *                 pedidos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1001
 *                       producto:
 *                         type: string
 *                         example: Figura Hornet
 *                       fecha:
 *                         type: string
 *                         format: date
 *                         example: "2025-01-15"
 *                       estado:
 *                         type: string
 *                         example: Entregado
 *                       total:
 *                         type: number
 *                         example: 25000
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             nombre:
 *                               type: string
 *                               example: Figura Hornet
 *                             cantidad:
 *                               type: number
 *                               example: 1
 *                             subtotal:
 *                               type: number
 *                               example: 25000
 *       401:
 *         description: No autorizado - Token inválido o ausente
 *       500:
 *         description: Error del servidor
 */
router.get(
  "/orders",
  passport.authenticate("jwt", { session: false }),
  getUserOrders
);

/**
 * @swagger
 * /api/user/change-password:
 *   put:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contrasenaActual
 *               - nuevaContrasena
 *             properties:
 *               contrasenaActual:
 *                 type: string
 *                 example: miPasswordActual
 *               nuevaContrasena:
 *                 type: string
 *                 example: miNuevaPassword123
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Contraseña actual incorrecta o campos faltantes
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  changePassword
);

/**
 * @swagger
 * /api/user/preferences:
 *   get:
 *     summary: Obtener preferencias del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferencias del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notificaciones_email:
 *                   type: boolean
 *                 notificaciones_sms:
 *                   type: boolean
 *                 tema:
 *                   type: string
 *                   enum: [oscuro, claro]
 *       401:
 *         description: No autorizado
 */
router.get(
  "/preferences",
  passport.authenticate("jwt", { session: false }),
  getPreferences
);

/**
 * @swagger
 * /api/user/preferences:
 *   put:
 *     summary: Actualizar preferencias del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificaciones_email:
 *                 type: boolean
 *               notificaciones_sms:
 *                 type: boolean
 *               tema:
 *                 type: string
 *                 enum: [oscuro, claro]
 *     responses:
 *       200:
 *         description: Preferencias guardadas
 *       400:
 *         description: Tema inválido
 *       401:
 *         description: No autorizado
 */
router.put(
  "/preferences",
  passport.authenticate("jwt", { session: false }),
  updatePreferences
);

export default router;
