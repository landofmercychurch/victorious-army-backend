// src/routes/picturePostsRoutes.js
import express from "express";
import multer from "multer";
import { listPicturePosts, createPicturePost } from "../controllers/picturePostsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", listPicturePosts);
router.post("/", requireAdmin, upload.single("image"), createPicturePost);

export default router;