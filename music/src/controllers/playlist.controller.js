import playlistModel from "../models/playlist.model.js";
import musicModel from "../models/music.Model.js";
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import { musicShape } from "../utils/musicShape.js";
import { populateMusics } from "../utils/populateMusics.js";
import { getArtistName } from "../utils/helpers.js";

export async function createPlaylist(req, res) {
  const { title, musics } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const playlist = await playlistModel.create({
      title: title.trim(),
      artist: getArtistName(req.user),
      artistId: req.user.id,
      musics: musics ?? [],
    });

    cacheDel("playlists:all");
    cacheDel(`artist-playlists:${req.user.id}`);

    return res.status(201).json({ message: "Playlist created successfully", playlist });
  } catch (error) {
    req.log.error({ err: error }, "Error creating playlist");
    return res.status(500).json({ message: "Error creating playlist" });
  }
}

export async function getPlaylists(req, res) {
  const cached = cacheGet("playlists:all:v2");
  if (cached !== undefined) return res.status(200).json({ playlists: cached });

  try {
    const docs = await playlistModel.find().sort({ createdAt: -1 }).limit(50);

    const allIds = [...new Set(docs.flatMap((pl) => pl.musics.slice(0, 4).map((id) => id.toString())))];
    const coverDocs = allIds.length > 0
      ? await musicModel.find({ _id: { $in: allIds } }, { coverImageUrl: 1 })
      : [];
    const coverMap = new Map(coverDocs.map((d) => [d._id.toString(), d.coverImageUrl]));

    const playlists = docs.map((pl) => ({
      _id: pl._id,
      title: pl.title,
      artist: pl.artist,
      musics: pl.musics,
      coverImages: pl.musics.slice(0, 4).map((id) => coverMap.get(id.toString())).filter(Boolean),
    }));

    cacheSet("playlists:all:v2", playlists, 120);
    return res.status(200).json({ playlists });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching playlists");
    return res.status(500).json({ message: "Error fetching playlists" });
  }
}

export async function getPlaylistById(req, res) {
  const { id } = req.params;
  const cacheKey = `playlist:${id}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ playlist: cached });

  try {
    const playlistDoc = await playlistModel.findById(id);
    if (!playlistDoc) return res.status(404).json({ message: "Playlist not found" });

    const musics = await populateMusics(playlistDoc.musics);

    const result = { id: playlistDoc._id, title: playlistDoc.title, artist: playlistDoc.artist, musics };
    cacheSet(cacheKey, result, 300);
    return res.status(200).json({ playlist: result });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching playlist");
    return res.status(500).json({ message: "Error fetching playlist" });
  }
}

export async function getArtistPlaylists(req, res) {
  const cacheKey = `artist-playlists:${req.user.id}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ playlists: cached });

  try {
    const playlistDocs = await playlistModel.find({ artistId: req.user.id });

    const allIds = playlistDocs.flatMap((pl) => pl.musics.map((id) => id.toString()));
    const uniqueIds = [...new Set(allIds)];
    const musicDocs = uniqueIds.length ? await musicModel.find({ _id: { $in: uniqueIds } }) : [];
    const musicMap = new Map(musicDocs.map((d) => [d._id.toString(), d]));

    const playlists = playlistDocs.map((pl) => ({
      id: pl._id,
      title: pl.title,
      artist: pl.artist,
      musics: pl.musics.map((mid) => musicMap.get(mid.toString())).filter(Boolean).map(musicShape),
    }));

    cacheSet(cacheKey, playlists, 120);
    return res.status(200).json({ playlists });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching artist playlists");
    return res.status(500).json({ message: "Error fetching artist playlists" });
  }
}

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

    cacheDel(`playlist:${id}`);
    cacheDel("playlists:all");
    cacheDel(`artist-playlists:${req.user.id}`);

    return res.status(200).json({ message: "Song added to playlist" });
  } catch (error) {
    req.log.error({ err: error }, "Error adding to artist playlist");
    return res.status(500).json({ message: "Error adding song" });
  }
}

export async function removeMusicFromArtistPlaylist(req, res) {
  const { id, musicId } = req.params;
  try {
    const result = await playlistModel.updateOne(
      { _id: id, artistId: req.user.id },
      { $pull: { musics: musicId } },
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Playlist not found" });

    cacheDel(`playlist:${id}`);
    cacheDel("playlists:all");
    cacheDel(`artist-playlists:${req.user.id}`);

    return res.status(200).json({ message: "Song removed" });
  } catch (error) {
    req.log.error({ err: error }, "Error removing from artist playlist");
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
      { returnDocument: "after" },
    );
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    cacheDel(`playlist:${id}`);
    cacheDel("playlists:all");
    cacheDel(`artist-playlists:${req.user.id}`);

    return res.status(200).json({ message: "Playlist renamed", playlist });
  } catch (error) {
    req.log.error({ err: error }, "Error renaming playlist");
    return res.status(500).json({ message: "Error renaming playlist" });
  }
}

export async function deleteArtistPlaylist(req, res) {
  const { id } = req.params;
  try {
    const result = await playlistModel.deleteOne({ _id: id, artistId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Playlist not found" });

    cacheDel(`playlist:${id}`);
    cacheDel("playlists:all");
    cacheDel(`artist-playlists:${req.user.id}`);

    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting playlist");
    return res.status(500).json({ message: "Error deleting playlist" });
  }
}
