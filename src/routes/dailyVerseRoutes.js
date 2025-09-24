// src/routes/dailyVerseRoutes.js
import express from "express";
import { getLatestVerse, createVerse, updateVerse } from "../controllers/dailyVerseController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", getLatestVerse);            // public
router.post("/", requireAdmin, createVerse); // admin only
router.put("/:id", requireAdmin, updateVerse); // admin only

export default router;