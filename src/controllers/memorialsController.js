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
 * Create a new memorial with uploaded images and sounds
 */
export async function createMemorial(req, res) {
  try {
    console.log("🖼️ Received memorial upload request:", req.body);

    const { title, description } = req.body;

    if (!req.files || req.files.length === 0) {
      console.warn("⚠️ No files provided for memorial");
      return res.status(400).json({ error: "At least one file required." });
    }

    // Separate images and sounds based on MIME type
    const uploadedImages = [];
    const uploadedSounds = [];

    for (const file of req.files) {
      const folderType = file.mimetype.startsWith("image/") ? "memorials/images" : "memorials/sounds";
      console.log(`☁️ Uploading ${file.mimetype.startsWith("image/") ? "image" : "sound"} to Cloudinary:`, file.originalname);
      const result = await uploadBufferToCloudinary(file.buffer, { folder: folderType });
      const fileData = { url: result.secure_url, public_id: result.public_id };

      if (file.mimetype.startsWith("image/")) uploadedImages.push(fileData);
      else if (file.mimetype.startsWith("audio/")) uploadedSounds.push(fileData);

      console.log("✅ Uploaded:", result.secure_url);
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({ error: "At least one image is required for a memorial." });
    }

    console.log("🗂️ Inserting memorial record into database...");
    const { data, error } = await supabase
      .from("memorials")
      .insert([{ title, description, images: uploadedImages, sounds: uploadedSounds }])
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
 * Delete a memorial by ID (including Cloudinary images and sounds)
 */
export async function deleteMemorial(req, res) {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting memorial:", id);

    // Fetch memorial to get files
    const { data: memorial, error: fetchErr } = await supabase
      .from("memorials")
      .select("id, images, sounds")
      .eq("id", id)
      .single();

    if (fetchErr || !memorial) {
      console.warn("⚠️ Memorial not found:", id);
      return res.status(404).json({ error: "Memorial not found" });
    }

    // Delete images from Cloudinary
    if (memorial.images && Array.isArray(memorial.images)) {
      for (const img of memorial.images) {
        if (img.public_id) {
          try {
            await cloudinary.uploader.destroy(img.public_id, { resource_type: "image" });
            console.log("🧹 Deleted image from Cloudinary:", img.public_id);
          } catch (cloudErr) {
            console.error("⚠️ Cloudinary delete error:", cloudErr);
          }
        }
      }
    }

    // Delete sounds from Cloudinary
    if (memorial.sounds && Array.isArray(memorial.sounds)) {
      for (const sound of memorial.sounds) {
        if (sound.public_id) {
          try {
            await cloudinary.uploader.destroy(sound.public_id, { resource_type: "video" }); // audio files are treated as "video" in Cloudinary
            console.log("🧹 Deleted sound from Cloudinary:", sound.public_id);
          } catch (cloudErr) {
            console.error("⚠️ Cloudinary delete error:", cloudErr);
          }
        }
      }
    }

    // Delete memorial from Supabase
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
