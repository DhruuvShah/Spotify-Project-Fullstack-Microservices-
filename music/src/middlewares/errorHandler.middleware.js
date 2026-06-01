import logger from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  (req.log ?? logger).error({ err }, err.message ?? "Unhandled error");

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry" });
  }

  return res.status(500).json({ message: "Internal server error" });
}
