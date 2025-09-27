// src/routes/postsRoutes.js
import express from "express";
import multer from "multer";
import { listPosts, createPost, deletePost, deleteComment } from "../controllers/postsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// Admin can view all posts
router.get("/", requireAdmin, listPosts);

// Admin can create a post
router.post("/", requireAdmin, upload.single("image"), createPost);

// Admin can delete a post
router.delete("/:id", requireAdmin, deletePost);

// Admin can delete a post comment
router.delete("/comments/:id", requireAdmin, deleteComment);

export default router;
