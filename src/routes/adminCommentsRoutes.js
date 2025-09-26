// src/routes/adminCommentsRoutes.js
import express from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { listComments, deleteComment } from "../controllers/adminCommentsController.js";

const router = express.Router();

// Admin: list comments for a post or sermon
// Example: GET /api/admin/comments/123?type=sermon
router.get("/:id", requireAdmin, listComments);

// Admin: delete comment
router.delete("/:id", requireAdmin, deleteComment);

export default router;
