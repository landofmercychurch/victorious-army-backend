// src/routes/memorialsRoutes.js
import express from "express";
import multer from "multer";
import { listMemorials, createMemorial } from "../controllers/memorialsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", listMemorials);
router.post("/", requireAdmin, upload.array("images", 10), createMemorial);

export default router;