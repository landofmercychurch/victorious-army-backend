// src/routes/PostsRoutes.js
import express from "express";
import { listPosts, getPostById } from "../controllers/postsController.js";

const router = express.Router();

// Public can view all posts
router.get("/", listPosts);

// New route: view single post with OG tags (for WhatsApp/Facebook preview)
router.get("/:id", getPostById);

export default router;
