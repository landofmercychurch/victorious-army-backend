// uploadsStatusRoutes.js
import express from "express";
import { handleFileUploadSSE } from "../controllers/uploadsStatusController.js";
import multer from "multer";

const router = express.Router();

// Use memory storage for real-time progress streaming
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Single or multiple file upload using SSE handler
router.post("/", upload.any(), handleFileUploadSSE);

export default router;
