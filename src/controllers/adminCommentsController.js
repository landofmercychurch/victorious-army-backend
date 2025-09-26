// src/controllers/adminCommentsController.js
import { supabase } from "../config/supabase.js";

export async function listCommentsForPost(req, res) {
  try {
    const { postId } = req.params;

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteComment(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
