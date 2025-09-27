// src/controllers/postsController.js
import cloudinary from "cloudinary";
import { pool } from "../db.js";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * List all posts
 */
export async function listPosts(req, res) {
  try {
    const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Create a new post (admin only)
 */
export async function createPost(req, res) {
  try {
    const { title, description } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: "posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    const result = await pool.query(
      "INSERT INTO posts (title, description, image_url) VALUES ($1, $2, $3) RETURNING *",
      [title, description, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
}

/**
 * Delete a post (admin only)
 */
export async function deletePost(req, res) {
  try {
    const { id } = req.params;

    // Optionally: delete image from Cloudinary if needed

    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a comment for a post (admin only)
 */
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM comments WHERE id = $1", [id]);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
