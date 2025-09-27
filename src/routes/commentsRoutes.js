// src/routes/commentsRoutes.js
import express from "express";
import { createComment, getComments } from "../controllers/commentsController.js";

const router = express.Router();

// Guest can fetch comments for a post or sermon
// Example: GET /api/comments/:id?type=post
// Example: GET /api/comments/:id?type=sermon
router.get("/:id", getComments);

// Guest can create comment
router.post("/", createComment);

export default router;
