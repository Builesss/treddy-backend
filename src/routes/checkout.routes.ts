import { Router } from "express";
import { checkoutController } from "../controllers/checkout.controller";

const router = Router();

router.get("/summary", checkoutController.getSummary);
router.post("/temporal", checkoutController.createTemporaryOrder);

export default router;
