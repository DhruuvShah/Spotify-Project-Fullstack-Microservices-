import followModel from "../models/follow.model.js";
import userModel from "../models/user.model.js";

export async function followArtist(req, res) {
  const { artistId } = req.params;
  if (artistId === req.user.id) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    const target = await userModel.findById(artistId).select("role");
    if (!target || target.role !== "artist") {
      return res.status(404).json({ message: "Artist not found" });
    }

    await followModel.create({ followerId: req.user.id, artistId });
    return res.status(201).json({ message: "Followed" });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Already following" });
    return res.status(500).json({ message: "Error following artist" });
  }
}

export async function unfollowArtist(req, res) {
  const { artistId } = req.params;
  try {
    await followModel.deleteOne({ followerId: req.user.id, artistId });
    return res.status(200).json({ message: "Unfollowed" });
  } catch (error) {
    return res.status(500).json({ message: "Error unfollowing artist" });
  }
}

export async function getFollowedArtistIds(req, res) {
  try {
    const follows = await followModel.find({ followerId: req.user.id }, { artistId: 1 });
    const artistIds = follows.map((f) => f.artistId);
    return res.status(200).json({ artistIds });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching following list" });
  }
}

export async function getArtistProfile(req, res) {
  const { artistId } = req.params;
  try {
    const artist = await userModel.findById(artistId).select("fullname role");
    if (!artist || artist.role !== "artist") {
      return res.status(404).json({ message: "Artist not found" });
    }

    const followerCount = await followModel.countDocuments({ artistId });
    const isFollowing = !!(await followModel.findOne({ followerId: req.user.id, artistId }));

    return res.status(200).json({
      artist: {
        id: artist._id,
        name: artist.fullname.firstName + " " + artist.fullname.lastName,
        followerCount,
        isFollowing,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching artist profile" });
  }
}

export async function getFollowedArtists(req, res) {
  try {
    const follows = await followModel.find({ followerId: req.user.id });
    const artists = await Promise.all(
      follows.map(async (f) => {
        const artist = await userModel.findById(f.artistId).select("fullname");
        if (!artist) return null;
        const followerCount = await followModel.countDocuments({ artistId: f.artistId });
        return {
          id: f.artistId,
          name: artist.fullname.firstName + " " + artist.fullname.lastName,
          followerCount,
        };
      })
    );
    return res.status(200).json({ artists: artists.filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching followed artists" });
  }
}
