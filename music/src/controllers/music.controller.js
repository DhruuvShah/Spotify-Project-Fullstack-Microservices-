import { uploadFile, deleteFile } from "../services/storage.service.js";
import musicModel from "../models/music.Model.js";
import playlistModel from "../models/playlist.model.js";
import likeModel from "../models/like.model.js";
import historyModel from "../models/history.model.js";
import userPlaylistModel from "../models/userPlaylist.model.js";
import albumModel from "../models/album.model.js";
import { cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import { musicShape } from "../utils/musicShape.js";
import { getArtistName, invalidateMusicCaches } from "../utils/helpers.js";

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
      artist: getArtistName(req.user),
      artistId: req.user.id,
      musicUrl: musicUpload.url,
      coverImageUrl: coverUpload.url,
      musicFileId: musicUpload.fileId,
      coverFileId: coverUpload.fileId,
    });

    invalidateMusicCaches(req.user.id);

    return res.status(201).json({ message: "Music uploaded successfully", music });
  } catch (error) {
    req.log.error({ err: error }, "Error uploading music");
    return res.status(500).json({ message: "Error uploading music" });
  }
}

export async function getAllMusics(req, res) {
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const cacheKey = `musics:all:${skip}:${limit}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ message: "Musics fetched successfully", musics: cached });

  try {
    const musicsDocs = await musicModel.find().skip(skip).limit(limit);

    const docIds = musicsDocs.map((d) => d._id);
    const inPlaylistIds = await playlistModel.distinct("musics", { musics: { $in: docIds } });
    const inPlaylistSet = new Set(inPlaylistIds.map((id) => id.toString()));

    const music = musicsDocs.map((doc) => ({
      ...musicShape(doc),
      isInPlaylist: inPlaylistSet.has(doc._id.toString()),
    }));

    cacheSet(cacheKey, music, 60);
    return res.status(200).json({ message: "Musics fetched successfully", musics: music });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching music");
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
    req.log.error({ err: error }, "Error fetching music");
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function getArtistMusics(req, res) {
  try {
    const musics = await musicModel.find({ artistId: req.user.id });
    return res.status(200).json({ musics: musics.map(musicShape) });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching music");
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function searchMusics(req, res) {
  const { q = "" } = req.query;
  const query = q.trim();
  if (!query || query.length > 200) return res.status(200).json({ musics: [] });

  try {
    const docs = await musicModel
      .find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(20);

    return res.status(200).json({ musics: docs.map(musicShape) });
  } catch (error) {
    req.log.error({ err: error }, "Error searching music");
    return res.status(500).json({ message: "Error searching music" });
  }
}

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

    invalidateMusicCaches(req.user.id);

    return res.status(200).json({ message: "Music updated", music: musicShape(music) });
  } catch (error) {
    req.log.error({ err: error }, "Error editing music");
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

    const cdnCleanup = [];
    if (music.musicFileId) cdnCleanup.push(deleteFile(music.musicFileId).catch(() => {}));
    if (music.coverFileId) cdnCleanup.push(deleteFile(music.coverFileId).catch(() => {}));

    await Promise.all([
      musicModel.deleteOne({ _id: id }),
      playlistModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      userPlaylistModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      albumModel.updateMany({ musics: id }, { $pull: { musics: music._id } }),
      likeModel.deleteMany({ musicId: id }),
      historyModel.deleteMany({ musicId: id }),
      ...cdnCleanup,
    ]);

    invalidateMusicCaches(req.user.id);
    cacheDel(`analytics:${req.user.id}`);

    return res.status(200).json({ message: "Music deleted" });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting music");
    return res.status(500).json({ message: "Error deleting music" });
  }
}

export async function getPublicArtistMusics(req, res) {
  const { artistId } = req.params;
  const cacheKey = `artist-musics:${artistId}`;

  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return res.status(200).json({ musics: cached });

  try {
    const musics = await musicModel.find({ artistId }).limit(20);
    const result = musics.map(musicShape);
    cacheSet(cacheKey, result, 120);
    return res.status(200).json({ musics: result });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching artist public musics");
    return res.status(500).json({ message: "Error fetching musics" });
  }
}
