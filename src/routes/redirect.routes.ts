import { Router } from "express";

const router = Router();

router.get("/success", (_, res) => res.redirect("http://localhost:3000/success"));
router.get("/failure", (_, res) => res.redirect("http://localhost:3000/failure"));
router.get("/pending", (_, res) => res.redirect("http://localhost:3000/pending"));

export default router;