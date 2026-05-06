import { Router } from "express";

const router = Router();

router.get("/success", (_, res) => res.redirect(`${process.env.FRONTEND_URL}/success`));
router.get("/failure", (_, res) => res.redirect(`${process.env.FRONTEND_URL}/failure`));
router.get("/pending", (_, res) => res.redirect(`${process.env.FRONTEND_URL}/pending`));

export default router;