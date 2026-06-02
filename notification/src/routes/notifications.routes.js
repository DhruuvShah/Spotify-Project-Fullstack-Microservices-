import { Router } from "express";
import Notification from "../models/Notification.js";

const router = Router();

const MAX_LIMIT = 100;

router.get("/notifications/:email", async (req, res) => {
  const { email } = req.params;
  const { type, status } = req.query;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, MAX_LIMIT);

  if (page < 1 || limit < 1) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }

  const filter = { recipientEmail: email };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  res.status(200).json({
    total,
    page,
    limit,
    data: records,
  });
});

export default router;
