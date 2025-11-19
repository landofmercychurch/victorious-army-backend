// src/controllers/sermonsController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import cloudinary from "../config/cloudinary.js";

/**
 * 📖 Get list of sermons
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
 * 🎬 Upload and create a new sermon (Cloudinary + Supabase) with SSE progress
 */
export async function createSermon(req, res) {
  try {
    const { title, description, youtube_url } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No video file provided" });
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    console.log("🎥 Received sermon upload:", { title, file: file.originalname });

    // --- SSE setup ---
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    req.on("close", () => console.log("❌ Client disconnected before upload finished."));

    const sendProgress = (percent) => {
      try {
        res.write(`data: ${JSON.stringify({ type: "progress", percent, message: `Upload ${percent}% complete` })}\n\n`);
      } catch {
        console.warn("⚠️ Unable to send progress: client disconnected.");
      }
    };

    // --- Upload video ---
    const uploadResult = await uploadBufferToCloudinary(file.buffer, { folder: "sermons" }, sendProgress);

    console.log("✅ Cloudinary upload complete:", uploadResult.public_id);

    const { secure_url, public_id, duration, bytes, format } = uploadResult;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    // --- Fallbacks for missing metadata ---
    const size_mb = bytes ? (bytes / (1024 * 1024)).toFixed(2) : (file.size / (1024 * 1024)).toFixed(2);
    const hls_url = public_id ? `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${public_id}.m3u8` : null;
    const thumbnail_url = public_id ? `https://res.cloudinary.com/${cloudName}/video/upload/so_3,w_640,h_360,c_fill/${public_id}.jpg` : null;

    // --- Save to Supabase ---
    const { data: sermonData, error } = await supabase
      .from("sermons")
      .insert([
        {
          title,
          description,
          youtube_url: youtube_url || null,
          video_url: secure_url || null,
          hls_url,
          thumbnail_url,
          public_id: public_id || null,
          duration: duration || null,
          format: format || null,
          size_mb,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // --- SSE complete ---
    try {
      res.write(`data: ${JSON.stringify({ type: "complete", progress: 100, message: "Upload complete", sermon: sermonData })}\n\n`);
      res.end();
    } catch {
      console.warn("⚠️ Unable to notify SSE completion: client disconnected.");
    }

    console.log(`🎉 Sermon "${title}" uploaded and saved. Compressed videos now reliably store.`);
  } catch (err) {
    console.error("❌ Error creating sermon:", err);
    try {
      res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
      res.end();
    } catch {
      res.status(500).json({ error: err.message });
    }
  }
}

/**
 * ✏️ Update sermon by ID (supports new video upload)
 */
export async function updateSermon(req, res) {
  try {
    const { id } = req.params;
    const { title, description, youtube_url } = req.body;
    const file = req.file;

    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    // Fetch existing sermon
    const { data: existing, error: fetchError } = await supabase
      .from("sermons")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: "Sermon not found" });

    let videoFields = {};

    if (file) {
      console.log("🎬 Updating video file for sermon:", id);

      // Delete old Cloudinary video
      if (existing.public_id) {
        try {
          await cloudinary.uploader.destroy(existing.public_id, { resource_type: "video" });
          console.log("✅ Old Cloudinary video deleted");
        } catch (cloudErr) {
          console.error("⚠️ Cloudinary delete error:", cloudErr);
        }
      }

      // Upload new video
      const uploadResult = await uploadBufferToCloudinary(file.buffer, { folder: "sermons" });
      const { secure_url, public_id, duration, bytes, format } = uploadResult;
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

      videoFields = {
        video_url: secure_url || null,
        public_id: public_id || null,
        duration: duration || null,
        format: format || null,
        size_mb: bytes ? (bytes / (1024 * 1024)).toFixed(2) : (file.size / (1024 * 1024)).toFixed(2),
        hls_url: public_id ? `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${public_id}.m3u8` : null,
        thumbnail_url: public_id ? `https://res.cloudinary.com/${cloudName}/video/upload/so_3,w_640,h_360,c_fill/${public_id}.jpg` : null,
      };
    }

    const { data, error } = await supabase
      .from("sermons")
      .update({
        title,
        description,
        youtube_url: youtube_url || null,
        ...videoFields,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Sermon updated successfully:", id);
    res.json({ success: true, sermon: data });
  } catch (err) {
    console.error("❌ Error updating sermon:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * 🗑️ Delete sermon by ID
 */
export async function deleteSermon(req, res) {
  try {
    const { id } = req.params;

    const { data: sermon, error: fetchError } = await supabase
      .from("sermons")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !sermon) return res.status(404).json({ error: "Sermon not found" });

    if (sermon.public_id) {
      try {
        await cloudinary.uploader.destroy(sermon.public_id, { resource_type: "video" });
        console.log("✅ Cloudinary video deleted");
      } catch (cloudErr) {
        console.error("⚠️ Cloudinary delete error:", cloudErr);
      }
    }

    const { error: deleteError } = await supabase.from("sermons").delete().eq("id", id);
    if (deleteError) throw deleteError;

    console.log("✅ Sermon deleted successfully:", id);
    res.json({ success: true, message: "Sermon deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting sermon:", err);
    res.status(500).json({ error: err.message });
  }
}
