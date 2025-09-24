// src/middleware/adminAuth.js
import { supabase } from "../config/supabase.js";

/**
 * Middleware that verifies Authorization header token and checks is_admin flag in profiles.
 * Attaches req.user with supabase user object + profile fields.
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    const userId = userData.user.id;

    // fetch profile to get is_admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, is_admin")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    if (!profile.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // attach to req
    req.user = { ...userData.user, profile };
    next();
  } catch (err) {
    console.error("adminAuth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}