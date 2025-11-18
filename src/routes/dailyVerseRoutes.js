// src/routes/dailyVerseRoutes.js
import express from "express";
import { getLatestVerse, createVerse, updateVerse } from "../controllers/dailyVerseController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";


const router = express.Router();

router.get("/", getLatestVerse);            // public
router.post("/", authenticateJWT, createVerse); // admin only
router.put("/:id", authenticateJWT, updateVerse); // admin only

export default router;
