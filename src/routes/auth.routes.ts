import { Router } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";
import { register, login, getProfile } from "../controllers/auth.controller";
import { registerValidation } from "../middlewares/validateUser";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Rutas de autenticación de usuarios
 */



/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Error de validación
 */
router.post("/register", registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión de un usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado (requiere token JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado
 *       401:
 *         description: Token inválido o ausente
 */
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  getProfile
);



/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Iniciar sesión con Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirige a la página de autenticación de Google
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.all(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:3000/auth/login?error=google",
  }),
  (req: any, res) => {
    const token = req.user.token;

    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);



/**
 * @swagger
 * /api/auth/microsoft:
 *   get:
 *     summary: Iniciar sesión con Microsoft
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirige a la página de autenticación de Microsoft
 */
router.get(
  "/microsoft",
  (req, res, next) => {
    next();
  },
  passport.authenticate("microsoft", {
    prompt: "select_account",
  })
);

router.all(
  "/microsoft/callback",
  (req, res, next) => {
    next();
  },
  passport.authenticate("microsoft", {
    session: false,
    failureRedirect: "http://localhost:3000/auth/login?error=microsoft",
  }),
  (req: any, res) => {
    if (!req.user) {
      return res.redirect("http://localhost:3000/auth/login?error=no_user");
    }

    if (!req.user.token) {
      return res.redirect("http://localhost:3000/auth/login?error=no_token");
    }

    res.redirect(`http://localhost:3000/auth/callback?token=${req.user.token}`);
  }
);
export default router;
