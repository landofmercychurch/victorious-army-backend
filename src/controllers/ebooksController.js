// src/controllers/ebooksController.js
import { supabase } from "../config/supabase.js";
import { uploadBufferToCloudinary } from "../utils/upload.js";
import { PDFDocument } from "pdf-lib";

// ==========================
// 📚 LIST EBOOKS
// ==========================
export async function listEbooks(req, res) {
  try {
    const { series } = req.query;

    let query = supabase
      .from("ebooks")
      .select("*")
      .order("created_at", { ascending: false });

    if (series) query = query.eq("series", series);

    const { data, error } = await query;
    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error("[listEbooks] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ==========================
// 📤 UPLOAD EBOOK
// ==========================
export async function uploadEbook(req, res) {
  try {
    const { title, author, series, series_order, description } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!pdfFile) return res.status(400).json({ error: "PDF file is required" });

    // ✏️ Embed metadata
    const pdfDoc = await PDFDocument.load(pdfFile.buffer);
    pdfDoc.setTitle(title || "Untitled");
    pdfDoc.setAuthor(author || "Unknown");
    pdfDoc.setSubject(series || "Standalone");
    if (series_order) pdfDoc.setKeywords([Part ${series_order}]);

    const finalPdf = await pdfDoc.save();

    // 📤 Upload PDF to Cloudinary
    const pdfUpload = await uploadBufferToCloudinary(finalPdf, {
      folder: "ebooks",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    // 📤 Upload cover (optional)
    let cover_url = "https://via.placeholder.com/180x240?text=No+Cover";
    if (coverFile) {
      const coverUpload = await uploadBufferToCloudinary(coverFile.buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });
      cover_url = coverUpload.secure_url;
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
          description: description || "",
          pdf_url: pdfUpload.secure_url,
          cover_url,
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

// ==========================
// ✏️ EDIT EBOOK
// ==========================
export async function editEbook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, series, series_order, description } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    const { data: existing, error: fetchErr } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existing)
      return res.status(404).json({ error: "Ebook not found" });

    let pdf_url = existing.pdf_url;
    let cover_url = existing.cover_url;

    // Replace PDF
    if (pdfFile) {
      const pdfDoc = await PDFDocument.load(pdfFile.buffer);
      pdfDoc.setTitle(title || existing.title);
      pdfDoc.setAuthor(author || existing.author);
      pdfDoc.setSubject(series || existing.series);
      if (series_order) pdfDoc.setKeywords([Part ${series_order}]);

      const finalPdf = await pdfDoc.save();

      const pdfUpload = await uploadBufferToCloudinary(finalPdf, {
        folder: "ebooks",
        resource_type: "auto",
        unique_filename: true,
      });

      pdf_url = pdfUpload.secure_url;
    }

    // Replace Cover
    if (coverFile) {
      const coverUpload = await uploadBufferToCloudinary(coverFile.buffer, {
        folder: "ebooks/covers",
        resource_type: "image",
      });

      cover_url = coverUpload.secure_url;
    }

    const order = series_order
      ? parseInt(series_order, 10)
      : existing.series_order;

    const { data, error } = await supabase
      .from("ebooks")
      .update({
        title: title || existing.title,
        author: author || existing.author,
        series: series || existing.series,
        series_order: order,
        description: description || existing.description,
        pdf_url,
        cover_url,
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

// ==========================
// 🗑️ DELETE EBOOK
// ==========================
export async function deleteEbook(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("ebooks")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data?.length)
      return res.status(404).json({ error: "Ebook not found" });

    return res.json({ message: "Ebook deleted", data });
  } catch (err) {
    console.error("[deleteEbook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ==========================
// ⬇️ DOWNLOAD PDF
// ==========================
export async function downloadEbook(req, res) {
  try {
    const { id } = req.params;

    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ebook)
      return res.status(404).json({ error: "Ebook not found" });

    const pdf = await fetch(ebook.pdf_url);
    const buffer = await pdf.arrayBuffer();

    const safeName = (ebook.title || "ebook").replace(/[\/\\:*?"<>|]/g, "-");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      attachment; filename="${safeName}.pdf"
    );

    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[downloadEbook] Error:", err);
    return res.status(500).json({ error: "Failed to download PDF" });
  }
}

// ==========================
// 📖 READ PDF ONLINE
// ==========================
export async function readEbookOnline(req, res) {
  try {
    const { id } = req.params;

    const { data: ebook, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ebook)
      return res.status(404).json({ error: "Ebook not found" });

    const pdf = await fetch(ebook.pdf_url);
    const buffer = await pdf.arrayBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline"); // <<< OPEN IN BROWSER

    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[readEbookOnline] Error:", err);
    return res.status(500).json({ error: "Unable to open online" });
  }
}
