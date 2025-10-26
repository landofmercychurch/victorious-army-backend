import express from "express";
import multer from "multer";
import { listEbooks, uploadEbook, downloadEbook } from "../controllers/ebooksController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Configure multer to accept multiple files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET ebooks (optionally filtered by series)
router.get("/", listEbooks);

// Admin: upload new ebook (PDF + optional cover)
router.post(
  "/",
  requireAdmin,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadEbook
);

// Download PDF with correct filename and metadata
router.get("/download/:id", downloadEbook);
// **Add DELETE route for admin**
router.delete("/:id", requireAdmin, deleteEbook);

export default router;
