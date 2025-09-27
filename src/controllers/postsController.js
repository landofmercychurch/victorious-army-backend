// --- Public: get single post with OG meta ---
export async function getPostById(req, res) {
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

    // Send minimal HTML with OG meta for link previews
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${post.title}</title>
        <meta property="og:title" content="${post.title}" />
        <meta property="og:description" content="${post.description || ''}" />
        <meta property="og:image" content="${post.image_url || ''}" />
        <meta property="og:url" content="${req.protocol}://${req.get('host')}/posts/${post.id}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${post.title}" />
        <meta name="twitter:description" content="${post.description || ''}" />
        <meta name="twitter:image" content="${post.image_url || ''}" />
      </head>
      <body>
        <h1>${post.title}</h1>
        <p>${post.description || ''}</p>
        <img src="${post.image_url || ''}" alt="${post.title}" />
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).send("Internal server error");
  }
}

