import cloudinary from "../config/cloudinary.js";
import { supabase } from "../config/supabase.js";

// --- Public: list posts ---
export async function listPosts(req, res) {
  console.log("📸 Fetching posts list...");
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data.length} posts`);
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
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

    if (error || !post) return res.status(404).send("Post not found");

    // Escape HTML special chars
    const escapeHTML = (str) =>
      String(str || "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
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
        <meta property="og:type" content="article" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${fullUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
      </head>
      <body>
        <h1>${title}</h1>
        <p>${description}</p>
        <img src="${image}" alt="${title}" style="max-width:100%;" />
      </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Get post preview error:", err);
    res.status(500).send("Internal server error");
  }
}

// --- Admin: create post ---
export async function createPost(req, res) {
  console.log("🖼️ Received post upload request:", req.body);
  try {
    const { title, description } = req.body;
    let image_url = null;
    let public_id = null;

    if (req.file) {
      console.log("☁️ Uploading image to Cloudinary:", req.file.originalname);
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "posts", resource_type: "image" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      image_url = result.secure_url;
      public_id = result.public_id;

      console.log("✅ Cloudinary upload successful:", {
        public_id,
        image_url,
      });
    }

    console.log("🗂️ Inserting new post into database...");
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title, description, image_url, public_id }])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Post created:", data);
    res.status(201).json(data);
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ error: err.message });
  }
}

// --- Admin: delete post ---
export async function deletePost(req, res) {
  console.log("🗑️ Deleting post:", req.params.id);
  try {
    const { id } = req.params;

    // Fetch post to get its Cloudinary public_id
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, public_id")
      .eq("id", id)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete image from Cloudinary if exists
    if (post.public_id) {
      try {
        await cloudinary.uploader.destroy(post.public_id, {
          resource_type: "image",
        });
        console.log("🧹 Cloudinary image deleted:", post.public_id);
      } catch (cloudErr) {
        console.error("⚠️ Cloudinary delete error:", cloudErr);
      }
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    console.log("✅ Post deleted successfully");
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("❌ Delete post error:", err);
    res.status(500).json({ error: err.message });
  }
}

// --- Admin: delete comment ---
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) throw error;
    console.log("💬 Comment deleted:", id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("❌ Delete comment error:", err);
    res.status(500).json({ error: err.message });
  }
}
