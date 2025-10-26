// src/routes/eventsRoutes.js
import express from "express";
import { listEvents, createEvent, updateEvent } from "../controllers/eventsController.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// ===============================
// --- Public Routes ---
// ===============================

// GET all events
router.get("/", listEvents);

// ===============================
// --- Admin Routes ---
// ===============================

// Create a new event
router.post("/", requireAdmin, createEvent);

// Update an existing event
router.put("/:id", requireAdmin, updateEvent);

// Delete an event
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Admin deleting event:", id);

    // Delete from Supabase
    const { error } = await require("../controllers/eventsController.js").deleteEvent(id);
    if (error) throw error;

    console.log("✅ Event deleted successfully:", id);
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    console.error("❌ Delete event error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
