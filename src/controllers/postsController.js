// src/controllers/postsController.js
import cloudinary from "../config/cloudinary.js"; // v2 configured instance
import { supabase } from "../config/supabase.js"; // supabase client

// --- Public: list posts ---
export async function listPosts(req, res) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// --- Admin: create post ---
export async function createPost(req, res) {
  try {
    const { title, description } = req.body;
    let imageUrl = null;

    if (req.file) {
      // Upload image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "posts" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title, description, image_url: imageUrl }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: err.message });
  }
}

// --- Admin: delete post ---
export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Post deleted", data });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: err.message });
  }
}

// --- Admin: delete comment ---
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Comment deleted", data });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: err.message });
  }
}
