// uploadsStatusRoutes.js
import express from "express";
import { handleFileUpload } from "../controllers/uploadsStatusController.js";
import multer from "multer";

const router = express.Router();

// Use memory storage for real-time progress streaming
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Single or multiple file upload
router.post("/", upload.any(), handleFileUpload);

export default router;

