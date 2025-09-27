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

// --- Public: get single post with OG meta for social preview ---
export async function getPostPreview(req, res) {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return res.status(404).send("Post not found");
    }

    // Helper to escape HTML special chars
    const escapeHTML = (str) =>
      String(str || "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m]));

    const fullUrl = `${req.protocol}://${req.get("host")}/posts/${post.id}`;
    const title = escapeHTML(post.title);
    const description = escapeHTML(post.description || "");
    const image = post.image_url || "";

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="article" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${fullUrl}" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
      </head>
      <body>
        <h1>${title}</h1>
        <p>${description}</p>
        <img src="${image}" alt="${title}" />
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Get post preview error:", err);
    res.status(500).send("Internal server error");
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
