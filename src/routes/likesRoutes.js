// src/routes/likesRoutes.js
import express from "express";
import { createLike, countLikes } from "../controllers/likesController.js";

const router = express.Router();

// Like a post or sermon
router.post("/", createLike);

// Count likes for a post or sermon
router.get("/count", countLikes); // query-based: ?type=sermon&sermon_id=xxx or ?type=post&post_id=xxx

export default router;
