import express from "express";
import multer from "multer";
import { listEbooks, uploadEbook } from "../controllers/ebooksController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET ebooks (with ?limit & ?offset) → grouped by series
router.get("/", listEbooks);

// Admin: upload new ebook
router.post("/", requireAdmin, upload.single("pdf"), uploadEbook);

export default router;
