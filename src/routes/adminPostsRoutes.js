// src/routes/adminPostsRoutes.js
import express from "express";
import multer from "multer";
import { createPost, deletePost, deleteComment, listPosts } from "../controllers/postsController.js";
import { authenticateJWT  } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Admin can view all posts
router.get("/", authenticateJWT, listPosts);

// Admin can create a post with an image
router.post("/", authenticateJWT, upload.single("image"), createPost);

// Admin can delete a post
router.delete("/:id", authenticateJWT, deletePost);

// Admin can delete a post comment
router.delete("/comments/:id", authenticateJWT, deleteComment);

export default router;
