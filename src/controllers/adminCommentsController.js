// src/controllers/adminCommentsController.js
import { supabase } from "../config/supabase.js";

// list all comments for a post or sermon
export async function listComments(req, res) {
  try {
    const { id } = req.params;      // postId or sermonId
    const { type } = req.query;     // ?type=post or ?type=sermon

    let query = supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (type === "post") query = query.eq("post_id", id);
    else if (type === "sermon") query = query.eq("sermon_id", id);
    else return res.status(400).json({ error: "type must be 'post' or 'sermon'" });

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// delete a comment by id
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
