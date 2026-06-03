import jwt from "jsonwebtoken";
import config from "../config/config.js";

function authMiddleware(role = null) {
  return (req, res, next) => {
    // Bearer header first (cross-origin production), cookie fallback (local dev)
    const authHeader = req.headers.authorization;
    const token =
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
      req.cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (role && decoded.role !== role) return res.status(403).json({ message: "Forbidden" });
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export const authUserMiddleware = authMiddleware();
export const authArtistMiddleware = authMiddleware("artist");
