// src/controllers/picturePostsController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";

// List posts
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

// Create post
export async function createPost(req, res) {
  try {
    const { title, description } = req.body;
    let image_url = null;
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "posts" });
      image_url = result.secure_url;
    }
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title, description, image_url }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete post (admin)
export async function deletePost(req, res) {
  try {
    const { id } = req.params;

    // Delete post
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;

    // Delete related likes and comments
    await supabase.from("likes").delete().eq("post_id", id);
    await supabase.from("comments").delete().eq("post_id", id);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete comment (admin)
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
