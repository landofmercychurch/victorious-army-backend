// src/routes/sermonsRoutes.js
import express from "express";
import multer from "multer";
import { listSermons, createSermon } from "../controllers/sermonsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.get("/", listSermons);
router.post("/", requireAdmin, upload.single("video"), createSermon);

export default router;