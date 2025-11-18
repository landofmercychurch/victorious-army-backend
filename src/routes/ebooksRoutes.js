// src/routes/ebooksRoutes.js
import express from "express";
import multer from "multer";
import {
  listEbooks,
  uploadEbook,
  editEbook,
  deleteEbook,
  downloadEbook,
  readEbookOnline,
} from "../controllers/ebooksController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ==========================
// 📚 PUBLIC ROUTES
// ==========================

// List all ebooks
router.get("/", listEbooks);

// Read online (opens in browser)
router.get("/read/:id", readEbookOnline);

// Download PDF
router.get("/download/:id", downloadEbook);

// ==========================
// 🔒 ADMIN ROUTES
// ==========================

// Upload (PDF + optional cover)
router.post(
  "/",
  authenticateJWT,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadEbook
);

// Edit metadata or replace files
router.put(
  "/:id",
  authenticateJWT,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  editEbook
);

// Delete ebook
router.delete("/:id", authenticateJWT, deleteEbook);

export default router;
