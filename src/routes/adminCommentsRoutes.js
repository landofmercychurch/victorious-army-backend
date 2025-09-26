// src/routes/adminCommentsRoutes.js
import express from "express";
import { listCommentsForPost, deleteComment } from "../controllers/adminCommentsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Admin: list all comments for a post
router.get("/post/:postId", requireAdmin, listCommentsForPost);

// Admin: delete a comment
router.delete("/:id", requireAdmin, deleteComment);

export default router;
