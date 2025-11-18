import express from "express";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from "../controllers/announcementsController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

// ===============================
// --- Public Routes ---
// ===============================
router.get("/", listAnnouncements);

// ===============================
// --- Admin Routes ---
// ===============================
router.post("/", authenticateJWT, createAnnouncement);
router.put("/:id", authenticateJWT, updateAnnouncement);
router.delete("/:id", authenticateJWT, deleteAnnouncement);

export default router;