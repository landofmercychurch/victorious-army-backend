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
 * Create a new memorial with uploaded images
 */
export async function createMemorial(req, res) {
  try {
    console.log("🖼️ Received memorial upload request:", req.body);

    const { title, description } = req.body;

    if (!req.files || req.files.length === 0) {
      console.warn("⚠️ No images provided for memorial");
      return res.status(400).json({ error: "At least one image required." });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      console.log("☁️ Uploading image to Cloudinary:", file.originalname);
      const result = await uploadBufferToCloudinary(file.buffer, { folder: "memorials" });
      uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
      console.log("✅ Image uploaded:", result.secure_url);
    }

    console.log("🗂️ Inserting memorial record into database...");
    const { data, error } = await supabase
      .from("memorials")
      .insert([{ title, description, images: uploadedImages }])
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
 * Delete a memorial by ID (including Cloudinary images)
 */
export async function deleteMemorial(req, res) {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting memorial:", id);

    // Fetch memorial to get images
    const { data: memorial, error: fetchErr } = await supabase
      .from("memorials")
      .select("id, images")
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
