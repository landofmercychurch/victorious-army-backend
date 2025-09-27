import express from "express";
import multer from "multer";
import { listPosts, createPost, deletePost, deleteComment } from "../controllers/picturePostsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Posts
router.get("/", listPosts);
router.post("/", requireAdmin, upload.single("image"), createPost);
router.delete("/:id", requireAdmin, deletePost);

// Comments
router.delete("/comments/:id", requireAdmin, deleteComment);

export default router;
