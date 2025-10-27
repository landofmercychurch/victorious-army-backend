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
// 🎥 Multer — In-Memory Upload for Short Clips
// ============================================

const upload = multer({
  storage: multer.memoryStorage(), // keep small files in memory
  limits: {
    fileSize: 300 * 1024 * 1024, // ⛔ limit: 300MB max (safe for memory)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Unsupported file type. Please upload MP4, WebM, MOV, JPG, or PNG.")
      );
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

// ✏️ Update existing sermon
router.put("/:id", requireAdmin, updateSermon);

// 🗑️ Delete sermon
router.delete("/:id", requireAdmin, deleteSermon);

export default router;
