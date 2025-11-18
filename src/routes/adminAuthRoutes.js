// src/routes/adminAuthRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const router = express.Router();

/**
 * POST /api/admin/auth/login
 * Admin login route: validates credentials via Supabase and returns backend JWT
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Supabase login
    const { data: userData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !userData.user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userId = userData.user.id;

    // fetch profile and check is_admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, is_admin")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // sign backend JWT
    const token = jwt.sign(
      {
        id: userId,
        email: userData.user.email,
        username: profile.username,
        is_admin: profile.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    // return token + user info
    res.json({
      token,
      user: {
        id: userId,
        email: userData.user.email,
        username: profile.username,
        is_admin: profile.is_admin,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
