import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { registerValidation } from "../middlewares/validateUser";

const router = Router();

router.post("/register", registerValidation, register);
router.post("/login", login);

export default router;