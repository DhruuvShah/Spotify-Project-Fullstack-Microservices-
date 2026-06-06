import albumModel from "../models/album.model.js";
import musicModel from "../models/music.Model.js";
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import { musicShape } from "../utils/musicShape.js";
import { getArtistName } from "../utils/helpers.js";

export async function createAlbum(req, res) {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  try {
    const album = await albumModel.create({
      title: title.trim(),
      artist: getArtistName(req.user),
      artistId: req.user.id,
      musics: [],
    });

    cacheDel(`artist-albums:${req.user.id}`);

    return res.status(201).json({ message: "Album created", album });
  } catch (error) {
    req.log.error({ err: error }, "Error creating album");
    return res.status(500).json({ message: "Error creating album" });
  }
}

export async function getArtistAlbums(req, res) {
  const cacheKey = `artist-albums:${req.user.id}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ albums: cached });

  try {
    const albumDocs = await albumModel.find({ artistId: req.user.id }).sort({ createdAt: -1 });

    const allIds = albumDocs.flatMap((al) => al.musics.map((id) => id.toString()));
    const uniqueIds = [...new Set(allIds)];
    const musicDocs = uniqueIds.length ? await musicModel.find({ _id: { $in: uniqueIds } }) : [];
    const musicMap = new Map(musicDocs.map((d) => [d._id.toString(), d]));

    const albums = albumDocs.map((al) => ({
      id: al._id,
      title: al.title,
      artist: al.artist,
      coverImageUrl: al.coverImageUrl,
      musics: al.musics.map((mid) => musicMap.get(mid.toString())).filter(Boolean).map(musicShape),
    }));

    cacheSet(cacheKey, albums, 120);
    return res.status(200).json({ albums });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching albums");
    return res.status(500).json({ message: "Error fetching albums" });
  }
}

export async function getAlbumsByArtist(req, res) {
  const { artistId } = req.params;
  try {
    const albums = await albumModel.find({ artistId }).sort({ createdAt: -1 }).select("_id title coverImageUrl musics");
    return res.status(200).json({ albums });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching albums by artist");
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

    cacheDel(`artist-albums:${req.user.id}`);

    return res.status(200).json({ message: "Song added to album" });
  } catch (error) {
    req.log.error({ err: error }, "Error adding to album");
    return res.status(500).json({ message: "Error adding song" });
  }
}

export async function removeMusicFromAlbum(req, res) {
  const { id, musicId } = req.params;
  try {
    const result = await albumModel.updateOne(
      { _id: id, artistId: req.user.id },
      { $pull: { musics: musicId } },
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Album not found" });

    cacheDel(`artist-albums:${req.user.id}`);

    return res.status(200).json({ message: "Song removed" });
  } catch (error) {
    req.log.error({ err: error }, "Error removing from album");
    return res.status(500).json({ message: "Error removing song" });
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
      { returnDocument: "after" },
    );
    if (!album) return res.status(404).json({ message: "Album not found" });

    cacheDel(`artist-albums:${req.user.id}`);

    return res.status(200).json({ message: "Album renamed", album });
  } catch (error) {
    req.log.error({ err: error }, "Error renaming album");
    return res.status(500).json({ message: "Error renaming album" });
  }
}

export async function deleteArtistAlbum(req, res) {
  const { id } = req.params;
  try {
    const result = await albumModel.deleteOne({ _id: id, artistId: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Album not found" });

    cacheDel(`artist-albums:${req.user.id}`);

    return res.status(200).json({ message: "Album deleted" });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting album");
    return res.status(500).json({ message: "Error deleting album" });
  }
}
