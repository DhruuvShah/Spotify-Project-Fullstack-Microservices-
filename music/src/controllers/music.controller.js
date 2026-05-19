import { uploadFile } from "../services/storage.service.js";
import musicModel from "../models/music.Model.js";
import playlistModel from "../models/playlist.model.js";
import likeModel from "../models/like.model.js";
import historyModel from "../models/history.model.js";
import userPlaylistModel from "../models/userPlaylist.model.js";
import albumModel from "../models/album.model.js";

/* ── helpers ── */
function musicShape(m) {
  return {
    id: m._id,
    title: m.title,
    artist: m.artist,
    artistId: m.artistId,
    musicUrl: m.musicUrl,
    coverImageUrl: m.coverImageUrl,
  };
}

/* ── existing ─────────────────────────────────────────────────────── */

export async function uploadMusic(req, res) {
  const musicFile = req.files["musicFile"]?.[0];
  const coverImageFile = req.files["coverImage"]?.[0];

  if (!musicFile || !coverImageFile) {
    return res.status(400).json({ message: "Music file and cover image are required" });
  }

  if (!req.body.title?.trim()) {
    return res.status(400).json({ message: "Title is required" });
  }

  const AUDIO_LIMIT = 50 * 1024 * 1024;
  const IMAGE_LIMIT = 5 * 1024 * 1024;
  if (musicFile.size > AUDIO_LIMIT)
    return res.status(400).json({ message: "Audio file must be under 50 MB" });
  if (coverImageFile.size > IMAGE_LIMIT)
    return res.status(400).json({ message: "Cover image must be under 5 MB" });

  const audioMimes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];
  const imageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!audioMimes.includes(musicFile.mimetype))
    return res.status(400).json({ message: "Unsupported audio format" });
  if (!imageMimes.includes(coverImageFile.mimetype))
    return res.status(400).json({ message: "Unsupported image format" });

  try {
    const [musicUpload, coverUpload] = await Promise.all([
      uploadFile(musicFile.path, musicFile.originalname, "musics"),
      uploadFile(coverImageFile.path, coverImageFile.originalname, "covers"),
    ]);

    const music = await musicModel.create({
      title: req.body.title.trim(),
      artist: req.user.fullname.firstName + " " + req.user.fullname.lastName,
      artistId: req.user.id,
      musicUrl: musicUpload.url,
      coverImageUrl: coverUpload.url,
    });

    return res.status(201).json({ message: "Music uploaded successfully", music });
  } catch (error) {
    console.error("Error uploading music:", error);
    return res.status(500).json({ message: "Error uploading music" });
  }
}

export async function getAllMusics(req, res) {
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  try {
    const musicsDocs = await musicModel.find().skip(skip).limit(limit);

    const music = await Promise.all(
      musicsDocs.map(async (musicDoc) => {
        const isInPlaylist = await playlistModel.exists({ musics: musicDoc._id });
        return { ...musicShape(musicDoc), isInPlaylist: !!isInPlaylist };
      })
    );

    return res.status(200).json({ message: "Musics fetched successfully", musics: music });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function getMusicById(req, res) {
  const { id } = req.params;
  try {
    const musicDoc = await musicModel.findById(id);
    if (!musicDoc) return res.status(404).json({ message: "Music not found" });
    return res.status(200).json({ message: "Music fetched successfully", music: musicShape(musicDoc) });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function getArtistMusics(req, res) {
  try {
    const musics = await musicModel.find({ artistId: req.user.id });
    return res.status(200).json({ musics: musics.map(musicShape) });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function createPlaylist(req, res) {
  const { title, musics } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const playlist = await playlistModel.create({
      title: title.trim(),
      artist: req.user.fullname.firstName + " " + req.user.fullname.lastName,
      artistId: req.user.id,
      musics: musics ?? [],
    });
    return res.status(201).json({ message: "Playlist created successfully", playlist });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return res.status(500).json({ message: "Error creating playlist" });
  }
}

export async function getPlaylists(req, res) {
  try {
    const playlists = await playlistModel.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return res.status(500).json({ message: "Error fetching playlists" });
  }
}

export async function getPlaylistById(req, res) {
  const { id } = req.params;
  try {
    const playlistDoc = await playlistModel.findById(id);
    if (!playlistDoc) return res.status(404).json({ message: "Playlist not found" });

    const musics = (
      await Promise.all(
        playlistDoc.musics.map((mid) => musicModel.findById(mid))
      )
    )
      .filter(Boolean)
      .map(musicShape);

    return res.status(200).json({
      playlist: { id: playlistDoc._id, title: playlistDoc.title, artist: playlistDoc.artist, musics },
    });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return res.status(500).json({ message: "Error fetching playlist" });
  }
}

export async function getArtistPlaylists(req, res) {
  try {
    const playlistDocs = await playlistModel.find({ artistId: req.user.id });

    const playlists = await Promise.all(
      playlistDocs.map(async (pl) => {
        const musics = (
          await Promise.all(pl.musics.map((mid) => musicModel.findById(mid)))
        )
          .filter(Boolean)
          .map(musicShape);
        return { id: pl._id, title: pl.title, artist: pl.artist, musics };
      })
    );

    return res.status(200).json({ playlists });
  } catch (error) {
    console.error("Error fetching artist playlists:", error);
    return res.status(500).json({ message: "Error fetching artist playlists" });
  }
}

export async function searchMusics(req, res) {
  const { q = "" } = req.query;
  if (!q.trim() || q.length > 200) return res.status(200).json({ musics: [] });

  try {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const docs = await musicModel
      .find({ $or: [{ title: regex }, { artist: regex }] })
      .limit(20);

    return res.status(200).json({ musics: docs.map(musicShape) });
  } catch (error) {
    console.error("Error searching music:", error);
    return res.status(500).json({ message: "Error searching music" });
  }
}

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

/* ── history ───────────────────────────────────────────────────────── */

export async function recordPlay(req, res) {
  const { id } = req.params;
  try {
    await historyModel.deleteOne({ userId: req.user.id, musicId: id });
    await historyModel.create({ userId: req.user.id, musicId: id, playedAt: new Date() });

    const count = await historyModel.countDocuments({ userId: req.user.id });
    if (count > 50) {
      const oldest = await historyModel
        .find({ userId: req.user.id })
        .sort({ playedAt: 1 })
        .limit(count - 50)
        .select("_id");
      await historyModel.deleteMany({ _id: { $in: oldest.map((d) => d._id) } });
    }

    return res.status(201).json({ message: "Recorded" });
  } catch (error) {
    console.error("Error recording play:", error);
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
    console.error("Error fetching history:", error);
    return res.status(500).json({ message: "Error fetching history" });
  }
}

/* ── user playlists ────────────────────────────────────────────────── */

export async function createUserPlaylist(req, res) {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  if (title.length > 100) return res.status(400).json({ message: "Title must be under 100 characters" });

  try {
    const playlist = await userPlaylistModel.create({
      title: title.trim(),
      userId: req.user.id,
      musics: [],
    });
    return res.status(201).json({ message: "Playlist created successfully", playlist });
  } catch (error) {
    console.error("Error creating user playlist:", error);
    return res.status(500).json({ message: "Error creating playlist" });
  }
}

export async function getUserPlaylists(req, res) {
  try {
    const playlists = await userPlaylistModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ playlists });
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    return res.status(500).json({ message: "Error fetching playlists" });
  }
}

export async function getUserPlaylistById(req, res) {
  const { id } = req.params;
  try {
    const playlistDoc = await userPlaylistModel.findOne({ _id: id, userId: req.user.id });
    if (!playlistDoc) return res.status(404).json({ message: "Playlist not found" });

    const musics = (
      await Promise.all(playlistDoc.musics.map((mid) => musicModel.findById(mid)))
    )
      .filter(Boolean)
      .map(musicShape);

    return res.status(200).json({
      playlist: { id: playlistDoc._id, title: playlistDoc.title, musics },
    });
  } catch (error) {
    console.error("Error fetching user playlist:", error);
    return res.status(500).json({ message: "Error fetching playlist" });
  }
}

export async function addMusicToUserPlaylist(req, res) {
  const { id, musicId } = req.params;
  try {
    const playlist = await userPlaylistModel.findOne({ _id: id, userId: req.user.id });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (playlist.musics.some((m) => m.toString() === musicId)) {
      return res.status(409).json({ message: "Song already in playlist" });
    }

    playlist.musics.push(musicId);
    await playlist.save();
    return res.status(200).json({ message: "Song added to playlist" });
  } catch (error) {
    console.error("Error adding to user playlist:", error);
    return res.status(500).json({ message: "Error adding song" });
  }
}

export async function removeMusicFromUserPlaylist(req, res) {
  const { id, musicId } = req.params;
  try {
    const playlist = await userPlaylistModel.findOne({ _id: id, userId: req.user.id });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    playlist.musics = playlist.musics.filter((m) => m.toString() !== musicId);
    await playlist.save();
    return res.status(200).json({ message: "Song removed from playlist" });
  } catch (error) {
    console.error("Error removing from user playlist:", error);
    return res.status(500).json({ message: "Error removing song" });
  }
}

export async function deleteUserPlaylist(req, res) {
  const { id } = req.params;
  try {
    const result = await userPlaylistModel.deleteOne({ _id: id, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Playlist not found" });
    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    console.error("Error deleting user playlist:", error);
    return res.status(500).json({ message: "Error deleting playlist" });
  }
}

/* ── edit / delete music (artist) ─────────────────────────────────── */

export async function editMusic(req, res) {
  const { id } = req.params;
  const { title } = req.body;

  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const music = await musicModel.findById(id);
    if (!music) return res.status(404).json({ message: "Music not found" });
    if (music.artistId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    music.title = title.trim();
    await music.save();
    return res.status(200).json({ message: "Music updated", music: musicShape(music) });
  } catch (error) {
    console.error("Error editing music:", error);
    return res.status(500).json({ message: "Error updating music" });
  }
}

export async function deleteMusic(req, res) {
  const { id } = req.params;
  try {
    const music = await musicModel.findById(id);
    if (!music) return res.status(404).json({ message: "Music not found" });
    if (music.artistId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Promise.all([
      musicModel.deleteOne({ _id: id }),
      playlistModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      userPlaylistModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      albumModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      likeModel.deleteMany({ musicId: id }),
      historyModel.deleteMany({ musicId: id }),
    ]);

    return res.status(200).json({ message: "Music deleted" });
  } catch (error) {
    console.error("Error deleting music:", error);
    return res.status(500).json({ message: "Error deleting music" });
  }
}

/* ── analytics ─────────────────────────────────────────────────────── */

export async function getMusicAnalytics(req, res) {
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
      playStats.map((s) => [s._id.toString(), { totalPlays: s.totalPlays, uniqueListeners: s.uniqueListeners.length }])
    );
    const likeMap = Object.fromEntries(
      likeStats.map((s) => [s._id.toString(), s.totalLikes])
    );

    const analytics = artistMusics.map((m) => ({
      id: m._id,
      title: m.title,
      totalPlays: playMap[m._id.toString()]?.totalPlays ?? 0,
      uniqueListeners: playMap[m._id.toString()]?.uniqueListeners ?? 0,
      totalLikes: likeMap[m._id.toString()] ?? 0,
    }));

    const totals = analytics.reduce(
      (acc, a) => ({
        totalPlays: acc.totalPlays + a.totalPlays,
        totalLikes: acc.totalLikes + a.totalLikes,
      }),
      { totalPlays: 0, totalLikes: 0 }
    );

    return res.status(200).json({ analytics, totals, trackCount: artistMusics.length });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ message: "Error fetching analytics" });
  }
}

/* ── albums ────────────────────────────────────────────────────────── */

export async function createAlbum(req, res) {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const album = await albumModel.create({
      title: title.trim(),
      artist: req.user.fullname.firstName + " " + req.user.fullname.lastName,
      artistId: req.user.id,
      musics: [],
    });
    return res.status(201).json({ message: "Album created", album });
  } catch (error) {
    console.error("Error creating album:", error);
    return res.status(500).json({ message: "Error creating album" });
  }
}

export async function getArtistAlbums(req, res) {
  try {
    const albumDocs = await albumModel.find({ artistId: req.user.id }).sort({ createdAt: -1 });

    const albums = await Promise.all(
      albumDocs.map(async (al) => {
        const musics = (
          await Promise.all(al.musics.map((mid) => musicModel.findById(mid)))
        )
          .filter(Boolean)
          .map(musicShape);
        return { id: al._id, title: al.title, artist: al.artist, coverImageUrl: al.coverImageUrl, musics };
      })
    );

    return res.status(200).json({ albums });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return res.status(500).json({ message: "Error fetching albums" });
  }
}

export async function addMusicToAlbum(req, res) {
  const { id, musicId } = req.params;
  try {
    const album = await albumModel.findOne({ _id: id, artistId: req.user.id });
    if (!album) return res.status(404).json({ message: "Album not found" });

    if (album.musics.some((m) => m.toString() === musicId)) {
      return res.status(409).json({ message: "Song already in album" });
    }

    album.musics.push(musicId);
    await album.save();
    return res.status(200).json({ message: "Song added to album" });
  } catch (error) {
    console.error("Error adding to album:", error);
    return res.status(500).json({ message: "Error adding song" });
  }
}

export async function getPublicArtistMusics(req, res) {
  const { artistId } = req.params;
  try {
    const musics = await musicModel.find({ artistId }).limit(20);
    return res.status(200).json({ musics: musics.map(musicShape) });
  } catch (error) {
    console.error("Error fetching artist public musics:", error);
    return res.status(500).json({ message: "Error fetching musics" });
  }
}

/* ── artist playlist / album management ────────────────────────────── */

export async function addMusicToArtistPlaylist(req, res) {
  const { id, musicId } = req.params;
  try {
    const playlist = await playlistModel.findOne({ _id: id, artistId: req.user.id });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.musics.some((m) => m.toString() === musicId)) {
      return res.status(409).json({ message: "Song already in playlist" });
    }
    playlist.musics.push(musicId);
    await playlist.save();
    return res.status(200).json({ message: "Song added to playlist" });
  } catch (error) {
    console.error("Error adding to artist playlist:", error);
    return res.status(500).json({ message: "Error adding song" });
  }
}

export async function removeMusicFromArtistPlaylist(req, res) {
  const { id, musicId } = req.params;
  try {
    const result = await playlistModel.updateOne(
      { _id: id, artistId: req.user.id },
      { $pull: { musics: musicId } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Playlist not found" });
    return res.status(200).json({ message: "Song removed" });
  } catch (error) {
    console.error("Error removing from artist playlist:", error);
    return res.status(500).json({ message: "Error removing song" });
  }
}

export async function removeMusicFromAlbum(req, res) {
  const { id, musicId } = req.params;
  try {
    const result = await albumModel.updateOne(
      { _id: id, artistId: req.user.id },
      { $pull: { musics: musicId } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Album not found" });
    return res.status(200).json({ message: "Song removed" });
  } catch (error) {
    console.error("Error removing from album:", error);
    return res.status(500).json({ message: "Error removing song" });
  }
}

export async function renameArtistPlaylist(req, res) {
  const { id } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  try {
    const playlist = await playlistModel.findOneAndUpdate(
      { _id: id, artistId: req.user.id },
      { title: title.trim() },
      { new: true }
    );
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    return res.status(200).json({ message: "Playlist renamed", playlist });
  } catch (error) {
    console.error("Error renaming playlist:", error);
    return res.status(500).json({ message: "Error renaming playlist" });
  }
}

export async function deleteArtistPlaylist(req, res) {
  const { id } = req.params;
  try {
    const result = await playlistModel.deleteOne({ _id: id, artistId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Playlist not found" });
    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return res.status(500).json({ message: "Error deleting playlist" });
  }
}

export async function renameArtistAlbum(req, res) {
  const { id } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  try {
    const album = await albumModel.findOneAndUpdate(
      { _id: id, artistId: req.user.id },
      { title: title.trim() },
      { new: true }
    );
    if (!album) return res.status(404).json({ message: "Album not found" });
    return res.status(200).json({ message: "Album renamed", album });
  } catch (error) {
    console.error("Error renaming album:", error);
    return res.status(500).json({ message: "Error renaming album" });
  }
}

export async function deleteArtistAlbum(req, res) {
  const { id } = req.params;
  try {
    const result = await albumModel.deleteOne({ _id: id, artistId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Album not found" });
    return res.status(200).json({ message: "Album deleted" });
  } catch (error) {
    console.error("Error deleting album:", error);
    return res.status(500).json({ message: "Error deleting album" });
  }
}

export async function renameUserPlaylist(req, res) {
  const { id } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  if (title.length > 100) return res.status(400).json({ message: "Title must be under 100 characters" });
  try {
    const playlist = await userPlaylistModel.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { title: title.trim() },
      { new: true }
    );
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    return res.status(200).json({ message: "Playlist renamed", playlist });
  } catch (error) {
    console.error("Error renaming user playlist:", error);
    return res.status(500).json({ message: "Error renaming playlist" });
  }
}
