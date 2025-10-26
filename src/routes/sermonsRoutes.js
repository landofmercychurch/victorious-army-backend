// src/routes/sermons.js
import express from "express";
import multer from "multer";
import {
  listSermons,
  createSermon,
  deleteSermon,
  updateSermon,
} from "../controllers/sermonsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// ============================================
// 🎥 Multer — In-Memory Upload for Cloudinary
// ============================================
const upload = multer({
  storage: multer.memoryStorage(), // no disk writes — streamed directly
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1 GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/mkv", "video/quicktime"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported video format. Please upload MP4 or WebM."));
    }
    cb(null, true);
  },
});

// ============================================
// 🛤️ Sermon Routes
// ============================================

// 📖 List all sermons
router.get("/", listSermons);

// 🎬 Create new sermon (admin only)
router.post("/", requireAdmin, upload.single("video"), createSermon);

// ✏️ Update existing sermon (title, description, YouTube URL)
router.put("/:id", requireAdmin, updateSermon);

// 🗑️ Delete sermon (admin only)
router.delete("/:id", requireAdmin, deleteSermon);

export default router;
