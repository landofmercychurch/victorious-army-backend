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

    console.log("🎥 Received sermon upload:", { title, file: file.originalname, mimetype: file.mimetype });

    // --- Setup SSE for live progress updates ---
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    req.on("close", () => console.log("❌ Client closed connection before upload completed."));

    const sendProgress = (percent) => {
      res.write(`data: ${JSON.stringify({ type: "progress", percent, message: `Upload ${percent}% complete` })}\n\n`);
    };

    // --- Upload video using chunked Cloudinary uploader ---
    const uploadResult = await uploadBufferToCloudinary(
      file.buffer,
      { folder: "sermons", public_id: undefined },
      sendProgress
    );

    console.log("✅ Cloudinary upload complete:", uploadResult.public_id);

    // --- Extract upload details ---
    const { secure_url, public_id, duration, bytes, format } = uploadResult;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const size_mb = bytes ? (bytes / (1024 * 1024)).toFixed(2) : null;
    const hls_url = `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${public_id}.m3u8`;
    const thumbnail_url = `https://res.cloudinary.com/${cloudName}/video/upload/so_3,w_640,h_360,c_fill/${public_id}.jpg`;

    // --- Save sermon metadata to Supabase ---
    const { data, error } = await supabase
      .from("sermons")
      .insert([
        {
          title,
          description,
          youtube_url: youtube_url || null,
          video_url: secure_url,
          hls_url,
          thumbnail_url,
          public_id,
          duration,
          format,
          size_mb,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // --- Notify SSE completion ---
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        progress: 100,
        message: "Upload complete",
        sermon: data,
      })}\n\n`
    );
    res.end();

    console.log(`🎉 Sermon "${title}" uploaded and saved.`);
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
 * ✏️ Update sermon by ID
 */
export async function updateSermon(req, res) {
  try {
    const { id } = req.params;
    const { title, description, youtube_url } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    const { data, error } = await supabase
      .from("sermons")
      .update({
        title,
        description,
        youtube_url: youtube_url || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Sermon not found" });

    console.log("✅ Sermon updated:", data.id);
    res.json(data);
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
    console.log(`🗑️ Deleting sermon with ID: ${id}`);

    // Fetch sermon record first
    const { data: sermon, error: fetchError } = await supabase
      .from("sermons")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !sermon) return res.status(404).json({ error: "Sermon not found" });

    // Delete from Cloudinary if exists
    if (sermon.public_id) {
      try {
        await cloudinary.uploader.destroy(sermon.public_id, { resource_type: "video" });
        console.log("✅ Cloudinary video deleted");
      } catch (cloudErr) {
        console.error("⚠️ Cloudinary delete error:", cloudErr);
      }
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase.from("sermons").delete().eq("id", id);
    if (deleteError) throw deleteError;

    console.log("✅ Sermon deleted successfully:", id);
    res.json({ success: true, message: "Sermon deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting sermon:", err);
    res.status(500).json({ error: err.message });
  }
}
