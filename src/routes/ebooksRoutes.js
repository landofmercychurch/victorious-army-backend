import express from "express";
import multer from "multer";
import {
  listEbooks,
  uploadEbook,
  downloadEbook,
  deleteEbook,
  editEbook, // new controller function
} from "../controllers/ebooksController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

// Configure multer to accept multiple files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET all ebooks (optionally filtered by series)
router.get("/", listEbooks);

// Admin: upload new ebook (PDF + optional cover)
router.post(
  "/",
  authenticateJWT,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadEbook
);

// Admin: edit ebook metadata and optionally replace files
router.put(
  "/:id",
  authenticateJWT,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  editEbook
);

// Download PDF with correct filename and metadata
router.get("/download/:id", downloadEbook); // keep ready, optionally comment out in frontend

// DELETE ebook by ID (admin only)
router.delete("/:id", authenticateJWT, deleteEbook);

export default router;
