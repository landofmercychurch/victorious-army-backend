// src/routes/eventsRoutes.js
import express from "express";
import { 
  listEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from "../controllers/eventsController.js";
import { authenticateJWT } from "../middleware/adminAuth.js";

const router = express.Router();

// ===============================
// --- Public Routes ---
// ===============================

// GET all events (public)
router.get("/", listEvents);

// ===============================
// --- Admin Routes ---
// ===============================

// Create a new event
router.post("/", authenticateJWT, createEvent);

// Update an existing event
router.put("/:id", authenticateJWT, updateEvent);

// Delete an existing event
router.delete("/:id", authenticateJWT, deleteEvent);

export default router;
