// src/middleware/adminAuth.js
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // verify admin in DB
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, is_admin")
      .eq("id", payload.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    if (!profile.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = { ...payload, profile };
    next();
  } catch (err) {
    console.error("JWT auth error:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
