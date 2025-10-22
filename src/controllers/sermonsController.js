// src/controllers/sermonsController.js
import { supabase } from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Get list of sermons
 */
export async function listSermons(req, res) {
  try {
    console.log("📖 Fetching sermons list...");
    const { data, error } = await supabase
      .from("sermons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data.length} sermons`);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching sermons:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload and create a new sermon record
 */
export async function createSermon(req, res) {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      console.warn("⚠️ No video file attached");
      return res.status(400).json({ error: "No video file provided" });
    }

    console.log("🎬 Received sermon upload request:", { title, description });
    console.log("📁 File received:", req.file.originalname);

    // Upload video to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "sermons" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const video_url = uploadResult.secure_url;
    const public_id = uploadResult.public_id;

    console.log("✅ Cloudinary upload successful:", { public_id, video_url });

    // Generate a thumbnail snapshot at 5 seconds
    let thumbnail_url = null;
    if (public_id) {
      thumbnail_url = cloudinary.url(public_id, {
        resource_type: "video",
        format: "jpg",
        transformation: [
          { start_offset: "5", width: 640, height: 360, crop: "fill" }
        ],
        secure: true
      });
    }

    // Insert sermon record into Supabase
    console.log("🗂️ Inserting new sermon into database...");
    const { data, error } = await supabase
      .from("sermons")
      .insert([{ title, description, video_url, thumbnail_url, public_id }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Sermon successfully saved to DB:", data.id);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating sermon:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete sermon by ID
 */
export async function deleteSermon(req, res) {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting sermon with ID: ${id}`);

    // Find sermon in DB
    const { data: sermon, error: fetchError } = await supabase
      .from("sermons")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !sermon) {
      console.warn("⚠️ Sermon not found:", id);
      return res.status(404).json({ error: "Sermon not found" });
    }

    // Delete video from Cloudinary
    if (sermon.public_id) {
      console.log("☁️ Removing video from Cloudinary:", sermon.public_id);
      try {
        await cloudinary.uploader.destroy(sermon.public_id, { resource_type: "video" });
        console.log("✅ Cloudinary video deleted");
      } catch (cloudErr) {
        console.error("❌ Cloudinary delete error:", cloudErr);
      }
    }

    // Delete sermon record from DB
    const { error: deleteError } = await supabase
      .from("sermons")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    console.log("✅ Sermon deleted successfully:", id);
    res.json({ success: true, message: "Sermon deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting sermon:", err);
    res.status(500).json({ error: err.message });
  }
}

