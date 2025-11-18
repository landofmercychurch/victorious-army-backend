// src/routes/memorialsRoutes.js
import express from "express";
import multer from "multer";
import { listMemorials, createMemorial, deleteMemorial } from "../controllers/memorialsController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB each
});

// GET memorials
router.get("/", listMemorials);

// Admin: upload up to 10 images for a memorial
router.post("/", authenticateJWT, upload.array("images", 10), createMemorial);

// Admin: delete a memorial by ID
router.delete("/:id", authenticateJWT, deleteMemorial);

export default router;
