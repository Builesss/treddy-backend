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

// ---------- RUTAS CLÁSICAS ----------

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
router.get("/profile", passport.authenticate("jwt", { session: false }), getProfile);

// ---------- GOOGLE AUTH ----------

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
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=google" }),
  (req: any, res) => {
    const token = req.user.token;
    res.redirect(`https://002c169d9f91.ngrok-free.app/auth/callback?token=${token}`);
  }
);

// ---------- MICROSOFT AUTH ----------

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
    console.log("🔵 [MICROSOFT AUTH] → Iniciando flujo de autenticación con Microsoft...");
    next();
  },
  passport.authenticate("azuread-openidconnect", { prompt: "login" })
);

router.all(
  "/microsoft/callback",
  (req, res, next) => {
    console.log("🟡 [MICROSOFT CALLBACK] → Callback recibido desde Microsoft");
    console.log("🟡 Headers:", req.headers);
    console.log("🟡 Body:", req.body);
    next();
  },
  passport.authenticate("azuread-openidconnect", { session: false, failureRedirect: "/login?error=microsoft" }),
  (req: any, res) => {
    if (!req.user) {
      console.error("❌ [MICROSOFT CALLBACK] → No se recibió el usuario desde Passport");
      return res.redirect("http://localhost:3000/auth/login?error=no_user");
    }

    console.log("✅ [MICROSOFT CALLBACK] → Usuario autenticado correctamente");
    console.log("👤 Usuario:", {
      id: req.user?.user?.usuario_id,
      nombre: req.user?.user?.nombre,
      email: req.user?.user?.email,
      role: req.user?.user?.tipo_usuario,
    });

    if (!req.user.token) {
      console.error("❌ [MICROSOFT CALLBACK] → No se generó token JWT");
      return res.redirect("http://localhost:3000/login?error=no_token");
    }

    console.log("🪪 [MICROSOFT CALLBACK] → Token generado correctamente");
    console.log("🔁 Redirigiendo a frontend con token...");

    res.redirect(`http://localhost:3000/auth/callback?token=${req.user.token}`);
  }
);

export default router;
