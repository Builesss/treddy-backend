import { Router } from "express";
import { createPreference } from "../controllers/payment.controller";
import { webhookController } from "../controllers/webhook.controller";

const router = Router();

router.post("/create_preference", createPreference);
router.post("/webhook", webhookController);

export default router;
