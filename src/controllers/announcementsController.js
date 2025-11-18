import { supabase } from "../config/supabase.js";

/**
 * Public: List all announcements
 */
export async function listAnnouncements(req, res) {
  try {
    console.log("📢 Fetching all announcements...");
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data.length} announcements`);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching announcements:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Create a new announcement
 */
export async function createAnnouncement(req, res) {
  try {
    const { title, message, active } = req.body;
    console.log("📝 Creating announcement:", title);

    if (!title || !message) {
      return res.status(400).json({ error: "title and message required" });
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert([{ title, message, active: !!active }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Announcement created:", data);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating announcement:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Update an existing announcement
 */
export async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { title, message, active } = req.body;
    console.log("✏️ Updating announcement:", id, { title });

    const { data, error } = await supabase
      .from("announcements")
      .update({ title, message, active: !!active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Announcement not found" });

    console.log("✅ Announcement updated:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Error updating announcement:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Admin: Delete an existing announcement
 */
export async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting announcement:", id);

    const { data, error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    console.log("✅ Announcement deleted:", id);
    res.json({ success: true, message: "Announcement deleted successfully", data });
  } catch (err) {
    console.error("❌ Error deleting announcement:", err);
    res.status(500).json({ error: err.message });
  }
}