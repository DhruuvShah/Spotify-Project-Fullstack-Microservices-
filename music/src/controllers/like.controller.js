import likeModel from "../models/like.model.js";

export async function likeMusic(req, res) {
  const { id } = req.params;
  try {
    await likeModel.create({ userId: req.user.id, musicId: id });
    return res.status(201).json({ message: "Liked" });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Already liked" });
    return res.status(500).json({ message: "Error liking music" });
  }
}

export async function unlikeMusic(req, res) {
  const { id } = req.params;
  try {
    await likeModel.deleteOne({ userId: req.user.id, musicId: id });
    return res.status(200).json({ message: "Unliked" });
  } catch (error) {
    return res.status(500).json({ message: "Error unliking music" });
  }
}

export async function getLikedMusicIds(req, res) {
  try {
    const likes = await likeModel.find({ userId: req.user.id }, { musicId: 1 });
    const likedIds = likes.map((l) => l.musicId.toString());
    return res.status(200).json({ likedIds });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching likes" });
  }
}
