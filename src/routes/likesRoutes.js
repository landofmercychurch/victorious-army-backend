// src/routes/likesRoutes.js
import express from "express";
import { createLike, countLikes } from "../controllers/likesController.js";

const router = express.Router();

// Like a post/sermon
router.post("/", createLike);

// Count likes for a post/sermon
router.get("/count/:postId", countLikes);

export default router;
