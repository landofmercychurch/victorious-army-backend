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
 * 🎬 Upload and create a new sermon record (with progress tracking)
 */
export async function createSermon(req, res) {
  try {
    const { title, description, youtube_url } = req.body;

    // 🧩 Validate inputs
    if (!req.file) {
      console.warn("⚠️ No video file attached");
      return res.status(400).json({ error: "No video file provided" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    console.log("🎥 Received sermon upload:", {
      title,
      description,
      youtube_url,
      file: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    // ✅ Prepare Server-Sent Events (SSE)
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Handle client disconnection gracefully
    req.on("close", () => {
      console.log("❌ Client closed connection before upload completed.");
    });

    // Send progress events
    const sendProgress = (percent) => {
      const progressEvent = {
        type: "progress",
        percent,
        message: `Upload ${percent}% complete`,
      };
      res.write(`data: ${JSON.stringify(progressEvent)}\n\n`);
    };

    // --- Upload to Cloudinary with progress ---
    console.log("☁️ Uploading video to Cloudinary (with progress)...");
    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      {
        folder: "sermons",
        resource_type: "video",
        hls: true,
        originalFormat: req.file.originalname || req.file.mimetype,
      },
      sendProgress
    );

    console.log("✅ Cloudinary upload complete:", uploadResult.public_id);

    // --- Extract details ---
    const {
      secure_url,
      public_id,
      eager,
      duration,
      bytes,
      format,
    } = uploadResult;

    const compressed_url = eager?.[0]?.secure_url || secure_url;
    const size_mb = bytes ? (bytes / (1024 * 1024)).toFixed(2) : null;

    // --- Generate additional URLs ---
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const hls_url = `https://res.cloudinary.com/${cloudName}/video/upload/fl_streaming:auto/${public_id}.m3u8`;
    const thumbnail_url =
      `https://res.cloudinary.com/${cloudName}/video/upload/so_3,w_640,h_360,c_fill/${public_id}.jpg` ||
      "/images/default-thumbnail.jpg";

    // --- Save to Supabase ---
    const { data, error } = await supabase
      .from("sermons")
      .insert([
        {
          title,
          description,
          video_url: compressed_url,
          hls_url,
          thumbnail_url,
          public_id,
          duration,
          format,
          size_mb,
          youtube_url: youtube_url || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // ✅ Final event to close connection
    const completeEvent = {
      type: "complete",
      progress: 100,
      done: true,
      sermon: data,
    };
    res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
    res.end();

    console.log("✅ Sermon successfully saved:", data.id);
  } catch (err) {
    console.error("❌ Error creating sermon:", {
      message: err.message,
      stack: err.stack,
      file: req.file?.originalname,
    });

    // Send error event to SSE stream
    res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
    res.end();
  }
}

/**
 * 🗑️ Delete sermon by ID
 */
export async function deleteSermon(req, res) {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting sermon with ID: ${id}`);

    // Fetch the sermon record
    const { data: sermon, error: fetchError } = await supabase
      .from("sermons")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !sermon) {
      console.warn("⚠️ Sermon not found:", id);
      return res.status(404).json({ error: "Sermon not found" });
    }

    // Delete from Cloudinary
    if (sermon.public_id) {
      try {
        await cloudinary.uploader.destroy(sermon.public_id, {
          resource_type: "video",
        });
        console.log("✅ Cloudinary video deleted");
      } catch (cloudErr) {
        console.error("⚠️ Cloudinary delete error:", cloudErr);
      }
    }

    // Delete from Supabase
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

/**
 * ✏️ Update sermon by ID
 */
export async function updateSermon(req, res) {
  try {
    const { id } = req.params;
    const { title, description, youtube_url } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

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
