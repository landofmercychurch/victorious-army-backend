// src/routes/commentsRoutes.js
import express from "express";
import { listCommentsForPost, createComment, deleteComment } from "../controllers/commentsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// GET all comments for a post
router.get("/post/:postId", listCommentsForPost);

// Guest can create comment
router.post("/", createComment);

// Admin can delete comment
router.delete("/:id", requireAdmin, deleteComment);

export default router;
