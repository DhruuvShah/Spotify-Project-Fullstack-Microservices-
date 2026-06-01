import historyModel from "../models/history.model.js";
import { musicShape } from "../utils/musicShape.js";

export async function recordPlay(req, res) {
  const { id } = req.params;
  try {
    await historyModel.findOneAndUpdate(
      { userId: req.user.id, musicId: id },
      { $set: { playedAt: new Date() } },
      { upsert: true },
    );

    const overflow = await historyModel
      .find({ userId: req.user.id }, { _id: 1 })
      .sort({ playedAt: -1 })
      .skip(50);

    if (overflow.length > 0) {
      await historyModel.deleteMany({ _id: { $in: overflow.map((d) => d._id) } });
    }

    return res.status(201).json({ message: "Recorded" });
  } catch (error) {
    req.log.error({ err: error }, "Error recording play");
    return res.status(500).json({ message: "Error recording play" });
  }
}

export async function getHistory(req, res) {
  try {
    const docs = await historyModel
      .find({ userId: req.user.id })
      .sort({ playedAt: -1 })
      .limit(20)
      .populate("musicId");

    const musics = docs
      .map((d) => (d.musicId ? { ...musicShape(d.musicId), playedAt: d.playedAt } : null))
      .filter(Boolean);

    return res.status(200).json({ musics });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching history");
    return res.status(500).json({ message: "Error fetching history" });
  }
}
