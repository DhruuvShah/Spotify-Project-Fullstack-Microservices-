import userPlaylistModel from "../models/userPlaylist.model.js";
import musicModel from "../models/music.Model.js";
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import { populateMusics } from "../utils/populateMusics.js";

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
    req.log.error({ err: error }, "Error creating user playlist");
    return res.status(500).json({ message: "Error creating playlist" });
  }
}

export async function getUserPlaylists(req, res) {
  try {
    const docs = await userPlaylistModel.find({ userId: req.user.id }).sort({ createdAt: -1 });

    const allIds = [...new Set(docs.flatMap((pl) => pl.musics.slice(0, 4).map((id) => id.toString())))];
    const coverDocs = allIds.length > 0
      ? await musicModel.find({ _id: { $in: allIds } }, { coverImageUrl: 1 })
      : [];
    const coverMap = new Map(coverDocs.map((d) => [d._id.toString(), d.coverImageUrl]));

    const playlists = docs.map((pl) => ({
      ...pl.toObject(),
      coverImages: pl.musics.slice(0, 4).map((id) => coverMap.get(id.toString())).filter(Boolean),
    }));

    return res.status(200).json({ playlists });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching user playlists");
    return res.status(500).json({ message: "Error fetching playlists" });
  }
}

export async function getUserPlaylistById(req, res) {
  const { id } = req.params;
  const cacheKey = `user-playlist:${id}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ playlist: cached });

  try {
    const playlistDoc = await userPlaylistModel.findOne({ _id: id, userId: req.user.id });
    if (!playlistDoc) return res.status(404).json({ message: "Playlist not found" });

    const musics = await populateMusics(playlistDoc.musics);

    const result = { id: playlistDoc._id, title: playlistDoc.title, musics };
    cacheSet(cacheKey, result, 300);
    return res.status(200).json({ playlist: result });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching user playlist");
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

    cacheDel(`user-playlist:${id}`);
    return res.status(200).json({ message: "Song added to playlist" });
  } catch (error) {
    req.log.error({ err: error }, "Error adding to user playlist");
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

    cacheDel(`user-playlist:${id}`);
    return res.status(200).json({ message: "Song removed from playlist" });
  } catch (error) {
    req.log.error({ err: error }, "Error removing from user playlist");
    return res.status(500).json({ message: "Error removing song" });
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
      { returnDocument: "after" },
    );
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    cacheDel(`user-playlist:${id}`);
    return res.status(200).json({ message: "Playlist renamed", playlist });
  } catch (error) {
    req.log.error({ err: error }, "Error renaming user playlist");
    return res.status(500).json({ message: "Error renaming playlist" });
  }
}

export async function deleteUserPlaylist(req, res) {
  const { id } = req.params;
  try {
    const result = await userPlaylistModel.deleteOne({ _id: id, userId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Playlist not found" });

    cacheDel(`user-playlist:${id}`);
    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting user playlist");
    return res.status(500).json({ message: "Error deleting playlist" });
  }
}
