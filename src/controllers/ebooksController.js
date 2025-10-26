// src/controllers/ebooksController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { PDFDocument } from "pdf-lib"; // npm install pdf-lib

/**
 * List all ebooks, grouped by series
 */
export async function listEbooks(req, res) {
  try {
    const { series: filterSeries } = req.query;
    console.log("[listEbooks] Fetching ebooks. Filter series:", filterSeries);

    let query = supabase
      .from("ebooks")
      .select("*")
      .order("series_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filterSeries) query = query.eq("series", filterSeries);

    const { data, error } = await query;
    if (error) throw error;

    // Group ebooks by series
    const grouped = data.reduce((acc, ebook) => {
      const seriesKey = ebook.series || "Standalone";
      if (!acc[seriesKey]) acc[seriesKey] = [];
      acc[seriesKey].push(ebook);
      return acc;
    }, {});

    console.log("[listEbooks] Ebooks grouped by series:", Object.keys(grouped));
    return res.json(grouped);
  } catch (err) {
    console.error("[listEbooks] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Upload a new ebook with optional cover image and series
 * Embeds metadata into PDF
 */
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order } = req.body;
    console.log("[uploadEbook] Upload request received:", { title, author, series, series_order });

    if (!req.files?.pdf || !req.files.pdf[0]) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    // --- Embed PDF metadata ---
    const pdfBuffer = req.files.pdf[0].buffer;
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    pdfDoc.setTitle(title || "Untitled");
    pdfDoc.setAuthor(author || "Unknown");
    pdfDoc.setSubject(series || "Standalone");
    pdfDoc.setKeywords(series_order ? [`Part ${series_order}`] : []);

    const modifiedPdfBuffer = await pdfDoc.save();

    // Upload PDF with metadata
    const pdfResult = await uploadBufferToCloudinary(modifiedPdfBuffer, {
      folder: "ebooks",
      resource_type: "raw",
    });
    const pdf_url = pdfResult.secure_url;

    // Optional cover upload
    let cover_url = null;
    if (req.files?.cover && req.files.cover[0]) {
      const coverResult = await uploadBufferToCloudinary(req.files.cover[0].buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });
      cover_url = coverResult.secure_url;
    }

    const order = series_order ? parseInt(series_order) : 0;

    // Insert into Supabase
    const { data, error } = await supabase
      .from("ebooks")
      .insert([
        { title, author, series: series || null, series_order: order, pdf_url, cover_url },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("[uploadEbook] Ebook uploaded successfully:", data);
    return res.status(201).json(data);
  } catch (err) {
    console.error("[uploadEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Delete a single ebook by id OR all ebooks in a series
 */
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;
    const { series } = req.query;
    console.log("[deleteEbook] Delete request:", { id, series });

    if (!id && !series) {
      return res.status(400).json({ error: "Provide an ebook ID or a series name to delete" });
    }

    let query = supabase.from("ebooks");

    if (id) query = query.eq("id", id);
    else if (series) query = query.eq("series", series);

    const { data, error } = await query.delete().select();
    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No ebook(s) found to delete" });
    }

    console.log("[deleteEbook] Deleted ebooks:", data.length);
    return res.json({ message: `${data.length} ebook(s) deleted successfully`, data });
  } catch (err) {
    console.error("[deleteEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
