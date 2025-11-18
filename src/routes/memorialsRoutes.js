// src/routes/memorialsRoutes.js
import express from "express";
import multer from "multer";
import { listMemorials, createMemorial, deleteMemorial } from "../controllers/memorialsController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

// Memory storage for uploaded files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

// GET all memorials
router.get("/", listMemorials);

// Admin: create a memorial with multiple files (images, audio, etc.)
router.post("/", authenticateJWT, upload.array("files", 20), createMemorial);

// Admin: delete a memorial by ID
router.delete("/:id", authenticateJWT, deleteMemorial);

export default router;
