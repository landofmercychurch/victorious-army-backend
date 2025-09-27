import express from "express";
import { getPostPreview } from "../controllers/postsController.js";

const router = express.Router();

// Preview page for social sharing (HTML + OG meta)
router.get("/:id", getPostPreview);

export default router;
