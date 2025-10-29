import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { PDFDocument } from "pdf-lib";

/**
 * List all ebooks, optionally filtered by series, grouped by series
 */
export async function listEbooks(req, res) {
  try {
    const { series: filterSeries } = req.query;

    let query = supabase
      .from("ebooks")
      .select("*")
      .order("series_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filterSeries) query = query.eq("series", filterSeries);

    const { data: ebooks, error } = await query;
    if (error) throw error;

    // Group by series
    const grouped = ebooks.reduce((acc, ebook) => {
      const key = ebook.series || "Standalone";
      if (!acc[key]) acc[key] = [];
      acc[key].push(ebook);
      return acc;
    }, {});

    return res.json(grouped);
  } catch (err) {
    console.error("[listEbooks] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook with optional cover
 * Embeds metadata into PDF before upload
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order, description } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!pdfFile) return res.status(400).json({ error: "PDF file is required" });

    // Embed PDF metadata
    const pdfDoc = await PDFDocument.load(pdfFile.buffer);
    pdfDoc.setTitle(title || "Untitled");
    pdfDoc.setAuthor(author || "Unknown");
    pdfDoc.setSubject(series || "Standalone");
    if (series_order) pdfDoc.setKeywords([`Part ${series_order}`]);

    const pdfBuffer = await pdfDoc.save();

    // Upload PDF to Cloudinary (inline view)
    const pdfResult = await uploadBufferToCloudinary(pdfBuffer, {
      folder: "ebooks",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // Upload Cover Image (optional)
    let cover_url = "https://via.placeholder.com/180x240?text=No+Cover"; // fallback
    if (coverFile) {
      try {
        const coverResult = await uploadBufferToCloudinary(coverFile.buffer, {
          folder: "ebooks/covers",
          resource_type: "image",
        });
        cover_url = coverResult.secure_url;
      } catch (err) {
        console.warn("[uploadEbook] Cover upload failed:", err.message);
      }
    }

    const order = series_order ? parseInt(series_order, 10) : 0;

    const { data, error } = await supabase
      .from("ebooks")
      .insert([
        {
          title,
          author,
          series: series || null,
          series_order: order,
          pdf_url: pdfResult.secure_url,
          cover_url,
          description: description || "",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    console.error("[uploadEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Edit ebook metadata and optionally replace files
 */
export async function editEbook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, series, series_order, description } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!id) return res.status(400).json({ error: "Ebook ID is required" });

    // Fetch existing ebook
    const { data: existing, error: fetchErr } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) return res.status(404).json({ error: "Ebook not found" });

    let pdf_url = existing.pdf_url;
    let cover_url = existing.cover_url;

    // Replace PDF if uploaded
    if (pdfFile) {
      const pdfDoc = await PDFDocument.load(pdfFile.buffer);
      pdfDoc.setTitle(title || existing.title || "Untitled");
      pdfDoc.setAuthor(author || existing.author || "Unknown");
      pdfDoc.setSubject(series || existing.series || "Standalone");
      if (series_order) pdfDoc.setKeywords([`Part ${series_order}`]);
      const pdfBuffer = await pdfDoc.save();

      const pdfResult = await uploadBufferToCloudinary(pdfBuffer, {
        folder: "ebooks",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      });
      pdf_url = pdfResult.secure_url;
    }

    // Replace Cover if uploaded
    if (coverFile) {
      const coverResult = await uploadBufferToCloudinary(coverFile.buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });
      cover_url = coverResult.secure_url;
    }

    const order = series_order ? parseInt(series_order, 10) : existing.series_order || 0;

    const { data, error } = await supabase
      .from("ebooks")
      .update({
        title: title || existing.title,
        author: author || existing.author,
        series: series || existing.series,
        series_order: order,
        pdf_url,
        cover_url,
        description: description || existing.description || "",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error("[editEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Delete ebook by ID or by series
 */
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;
    const { series } = req.query;

    if (!id && !series)
      return res.status(400).json({ error: "Provide an ebook ID or series name" });

    let result;
    if (id) {
      result = await supabase.from("ebooks").delete().eq("id", id).select();
    } else if (series) {
      result = await supabase.from("ebooks").delete().eq("series", series).select();
    }

    const { data, error } = result;
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: "No ebook(s) found" });

    return res.json({ message: `${data.length} ebook(s) deleted`, data });
  } catch (err) {
    console.error("[deleteEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Download ebook with a safe filename
 */
export async function downloadEbook(req, res) {
  try {
    const { id } = req.params;

    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ebook) return res.status(404).json({ error: "Ebook not found" });

    const response = await fetch(ebook.pdf_url);
    if (!response.ok) throw new Error("Failed to fetch PDF");

    const buffer = await response.arrayBuffer();
    const safeTitle = (ebook.title || "ebook").replace(/[/\\?%*:|"<>]/g, "-").substring(0, 100);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[downloadEbook] Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
