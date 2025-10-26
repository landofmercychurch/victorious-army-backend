// src/routes/eventsRoutes.js
import express from "express";
import { 
  listEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from "../controllers/eventsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

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
router.post("/", requireAdmin, createEvent);

// Update an existing event
router.put("/:id", requireAdmin, updateEvent);

// Delete an existing event
router.delete("/:id", requireAdmin, deleteEvent);

export default router;
