import { Router } from "express";
import { requestPasswordReset, resetPassword } from "../controllers/users.controller";

const router = Router();

router.post("/recover-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
