// src/routes/sermons.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  listSermons,
  createSermon,
  deleteSermon,
} from "../controllers/sermonsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// TEMP folder for uploads
const uploadDir = path.join(__dirname, "../../tmp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup — store temporarily on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
});

// Routes
router.get("/", listSermons);
router.post("/", requireAdmin, upload.single("video"), createSermon);
router.delete("/:id", requireAdmin, deleteSermon);

export default router;
