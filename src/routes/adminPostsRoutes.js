// src/routes/adminPostsRoutes.js
import express from "express";
import multer from "multer";
import { createPost, deletePost, deleteComment } from "../controllers/postsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin can create a post with an image
router.post("/", requireAdmin, upload.single("image"), createPost);

// Admin can delete a post
router.delete("/:id", requireAdmin, deletePost);

// Admin can delete a post comment
router.delete("/comments/:id", requireAdmin, deleteComment);

export default router;
