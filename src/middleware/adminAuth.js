// src/middleware/adminAuth.js
import jwt from "jsonwebtoken";

/**
 * Middleware to verify backend JWT and admin access.
 * Attaches payload to req.user.
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin
    if (!payload.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Attach user info to request
    req.user = payload;

    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
