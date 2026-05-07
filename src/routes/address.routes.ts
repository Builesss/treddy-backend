import { Router } from "express";
import { addressController } from "../controllers/address.controller";

const router = Router();

router.get("/:userId", addressController.getAddresses);
router.post("/", addressController.createAddress);
router.put("/:id/principal", addressController.setPrincipal);

export default router;
