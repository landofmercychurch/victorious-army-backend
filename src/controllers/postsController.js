// src/routes/PostsRoutes.js
import express from "express";
import { listPosts } from "../controllers/postsController.js";

const router = express.Router();

// Public can view all posts
router.get("/", listPosts);

export default router;

