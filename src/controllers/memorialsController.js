// src/controllers/memorialsController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import cloudinary from "../config/cloudinary.js";

/**
 * List all memorials
 */
export async function listMemorials(req, res) {
  try {
    console.log("📖 Fetching memorials list...");
    const { data, error } = await supabase
      .from("memorials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data.length} memorial(s)`);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching memorials:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Create a new memorial with multiple uploaded files (images/audio/etc.)
 */
export async function createMemorial(req, res) {
  try {
    const { title, description } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required." });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "At least one file is required." });

    const uploadedFiles = [];

    for (const file of req.files) {
      console.log("☁️ Uploading file to Cloudinary:", file.originalname);

      // Use resource_type "auto" to support images, audio, videos, etc.
      const result = await uploadBufferToCloudinary(file.buffer, { folder: "memorials", resource_type: "auto" });

      uploadedFiles.push({
        url: result.secure_url,
        public_id: result.public_id,
        originalname: file.originalname,
        mimetype: file.mimetype
      });

      console.log("✅ File uploaded:", result.secure_url);
    }

    // Insert a single memorial record with all files
    const { data, error } = await supabase
      .from("memorials")
      .insert([{ title, description, files: uploadedFiles }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Memorial created successfully:", data.id);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating memorial:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a memorial by ID (including all files on Cloudinary)
 */
export async function deleteMemorial(req, res) {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting memorial:", id);

    const { data: memorial, error: fetchErr } = await supabase
      .from("memorials")
      .select("id, files")
      .eq("id", id)
      .single();

    if (fetchErr || !memorial) {
      console.warn("⚠️ Memorial not found:", id);
      return res.status(404).json({ error: "Memorial not found" });
    }

    // Delete all files from Cloudinary
    if (memorial.files && Array.isArray(memorial.files)) {
      for (const file of memorial.files) {
        if (file.public_id) {
          try {
            await cloudinary.uploader.destroy(file.public_id, { resource_type: "auto" });
            console.log("🧹 Deleted file from Cloudinary:", file.public_id);
          } catch (cloudErr) {
            console.error("⚠️ Cloudinary delete error:", cloudErr);
          }
        }
      }
    }

    const { error: delErr } = await supabase
      .from("memorials")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    console.log("✅ Memorial deleted successfully:", id);
    res.json({ success: true, message: "Memorial deleted successfully" });
  } catch (err) {
    console.error("❌ Delete memorial error:", err);
    res.status(500).json({ error: err.message });
  }
}
