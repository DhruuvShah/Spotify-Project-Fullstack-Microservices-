import musicModel from "../models/music.Model.js";
import historyModel from "../models/history.model.js";
import likeModel from "../models/like.model.js";
import { cacheGet, cacheSet } from "../utils/cache.js";

export async function getMusicAnalytics(req, res) {
  const cacheKey = `analytics:${req.user.id}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json(cached);

  try {
    const artistMusics = await musicModel.find({ artistId: req.user.id }, { _id: 1, title: 1 });
    const musicIds = artistMusics.map((m) => m._id);

    const [playStats, likeStats] = await Promise.all([
      historyModel.aggregate([
        { $match: { musicId: { $in: musicIds } } },
        {
          $group: {
            _id: "$musicId",
            totalPlays: { $sum: 1 },
            uniqueListeners: { $addToSet: "$userId" },
          },
        },
      ]),
      likeModel.aggregate([
        { $match: { musicId: { $in: musicIds } } },
        { $group: { _id: "$musicId", totalLikes: { $sum: 1 } } },
      ]),
    ]);

    const playMap = Object.fromEntries(
      playStats.map((s) => [
        s._id.toString(),
        { totalPlays: s.totalPlays, uniqueListeners: s.uniqueListeners.length },
      ]),
    );
    const likeMap = Object.fromEntries(likeStats.map((s) => [s._id.toString(), s.totalLikes]));

    const analytics = artistMusics.map((m) => ({
      id: m._id,
      title: m.title,
      totalPlays: playMap[m._id.toString()]?.totalPlays ?? 0,
      uniqueListeners: playMap[m._id.toString()]?.uniqueListeners ?? 0,
      totalLikes: likeMap[m._id.toString()] ?? 0,
    }));

    const totals = analytics.reduce(
      (acc, a) => ({ totalPlays: acc.totalPlays + a.totalPlays, totalLikes: acc.totalLikes + a.totalLikes }),
      { totalPlays: 0, totalLikes: 0 },
    );

    const result = { analytics, totals, trackCount: artistMusics.length };
    cacheSet(cacheKey, result, 300);
    return res.status(200).json(result);
  } catch (error) {
    req.log.error({ err: error }, "Error fetching analytics");
    return res.status(500).json({ message: "Error fetching analytics" });
  }
}
