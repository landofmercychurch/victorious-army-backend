import express from "express";
import multer from "multer";
import { uploadAmbient, listAmbients } from "../controllers/ambientController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/ambient", upload.single("audio"), uploadAmbient);
router.get("/ambient", listAmbients);

export default router;
