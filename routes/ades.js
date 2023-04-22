import express from "express";
import { getAde } from "../controllers/ades.js";

const router = express.Router();

/* READ */
router.get("/:id", getAde);

export default router;
