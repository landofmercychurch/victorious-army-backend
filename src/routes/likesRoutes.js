// src/routes/likesRoutes.js
import express from "express";
import { createLike, countLikes } from "../controllers/likesController.js";

const router = express.Router();

router.post("/", createLike);
router.get("/count/:postId", countLikes);

export default router;