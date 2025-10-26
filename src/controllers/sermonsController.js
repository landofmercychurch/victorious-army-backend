import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

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
 * 🎬 Upload and create a new sermon record
 */
export async function createSermon(req, res) {
  try {
    const { title, description, youtube_url } = req.body;

    // 🧩 Validate input
    if (!req.file) {
      console.warn("⚠️ No video file attached");
      return res.status(400).json({ error: "No video file provided" });
    }

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    console.log("🎥 Received sermon upload:", { title, description, youtube_url });
    console.log("📁 File:", req.file.originalname);

    // --- Upload to Cloudinary ---
    console.log("☁️ Uploading video to Cloudinary...");
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "sermons",
      resource_type: "video",
      hls: true,
    });

    console.log("✅ Cloudinary upload complete:", uploadResult.public_id);

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

    // --- Generate additional Cloudinary URLs ---
    const hls_url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_auto,du_${Math.round(
      duration
    )}/fl_streaming:auto/${public_id}.m3u8`;

    const thumbnail_url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_5,w_640,h_360,c_fill/${public_id}.jpg`;

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

    console.log("✅ Sermon successfully saved:", data.id);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating sermon:", err);
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

    // Fetch record
    const { data: sermon, error: fetchError } = await supabase
      .from("sermons")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !sermon) {
      return res.status(404).json({ error: "Sermon not found" });
    }

    // Remove from Cloudinary
    if (sermon.public_id) {
      try {
        await cloudinary.uploader.destroy(sermon.public_id, { resource_type: "video" });
        console.log("✅ Cloudinary video deleted");
      } catch (cloudErr) {
        console.error("⚠️ Cloudinary delete error:", cloudErr);
      }
    }

    // Remove from Supabase
    const { error: deleteError } = await supabase
      .from("sermons")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

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
      .update({ title, description, youtube_url: youtube_url || null })
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
