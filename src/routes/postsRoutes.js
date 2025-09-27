import express from "express";
import { listPosts, getPostById } from "../controllers/postsController.js";

const router = express.Router();

// Public can view all posts
router.get("/", listPosts);

// Public can view single post (for OG meta / WhatsApp preview)
router.get("/:id", getPostById);

export default router;
