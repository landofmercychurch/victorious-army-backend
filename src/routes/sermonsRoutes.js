import express from "express";
import multer from "multer";
import { listSermons, createSermon, deleteSermon } from "../controllers/sermonsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// GET sermons (with ?limit & ?offset)
router.get("/", listSermons);

// Admin: upload new sermon video
router.post("/", requireAdmin, upload.single("video"), createSermon);

// Admin: delete sermon by ID
router.delete("/:id", requireAdmin, deleteSermon);

export default router;
