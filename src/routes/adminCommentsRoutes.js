// src/routes/adminCommentsRoutes.js
import express from "express";
import { authenticateJWT } from "../middleware/adminAuth.js";

import { listComments, deleteComment } from "../controllers/adminCommentsController.js";

const router = express.Router();

// Admin: list comments for a post or sermon
// Example: GET /api/admin/comments/123?type=sermon
router.get("/:id", authenticateJWT, listComments);

// Admin: delete comment
router.delete("/:id", authenticateJWT, deleteComment);

export default router;
