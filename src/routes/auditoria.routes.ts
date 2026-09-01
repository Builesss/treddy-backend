import { Router } from "express";
import passport from "../config/passport";
import { getAuditorias } from "../controllers/auditoria.controller";

const router = Router();

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getAuditorias
);

export default router;