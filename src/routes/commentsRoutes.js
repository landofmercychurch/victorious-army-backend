// src/routes/commentsRoutes.js
import express from "express";
import { listCommentsForPost, createComment, deleteComment } from "../controllers/commentsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/post/:postId", listCommentsForPost);
router.post("/", createComment); // guest allowed
router.delete("/:id", requireAdmin, deleteComment); // admin moderation

export default router;