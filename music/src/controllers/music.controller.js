import { uploadFile } from "../services/storage.service.js";
import musicModel from "../models/music.Model.js";
import playlistModel from "../models/playlist.model.js";

export async function uploadMusic(req, res) {
  const musicFile = req.files["musicFile"]?.[0];
  const coverImageFile = req.files["coverImage"]?.[0];

  if (!musicFile || !coverImageFile) {
    return res
      .status(400)
      .json({ message: "Music file and cover image are required" });
  }

  try {
    const [musicUpload, coverUpload] = await Promise.all([
      uploadFile(musicFile.path, musicFile.originalname, "musics"),
      uploadFile(coverImageFile.path, coverImageFile.originalname, "covers"),
    ]);

    const music = await musicModel.create({
      title: req.body.title,
      artist: req.user.fullname.firstName + " " + req.user.fullname.lastName,
      artistId: req.user.id,
      musicUrl: musicUpload.url,
      coverImageUrl: coverUpload.url,
    });

    return res
      .status(201)
      .json({ message: "Music uploaded successfully", music });
  } catch (error) {
    console.error("Error uploading music:", error);
    return res.status(500).json({ message: "Error uploading music" });
  }
}

export async function getAllMusics(req, res) {
  const { skip = 0, limit = 20 } = req.query;

  try {
    const musicsDocs = await musicModel.find().skip(skip).limit(limit);

    const music = [];

    for (const musicDoc of musicsDocs) {
      const isInPlaylist = await playlistModel.exists({
        musics: musicDoc._id,
      });
      music.push({
        id: musicDoc._id,
        title: musicDoc.title,
        artist: musicDoc.artist,
        musicUrl: musicDoc.musicUrl,
        coverImageUrl: musicDoc.coverImageUrl,
        isInPlaylist,
      });
    }
    return res
      .status(200)
      .json({ message: "Musics fetched successfully", musics: music });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function getMusicById(req, res) {
  const { id } = req.params;
  try {
    const musicDoc = await musicModel.findById(id);

    if (!musicDoc) {
      return res.status(404).json({ message: "Music not found" });
    }
    const music = {
      id: musicDoc._id,
      title: musicDoc.title,
      artist: musicDoc.artist,
      musicUrl: musicDoc.musicUrl,
      coverImageUrl: musicDoc.coverImageUrl,
    };

    return res
      .status(200)
      .json({ message: "Music fetched successfully", music });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function getArtistMusics(req, res) {
  try {
    const musics = await musicModel.find({ artistId: req.user.id });

    return res.status(200).json({ musics });
  } catch (error) {
    console.error("Error fetching music:", error);
    return res.status(500).json({ message: "Error fetching music" });
  }
}

export async function createPlaylist(req, res) {
  const { title, musics } = req.body;

  try {
    const playlist = await playlistModel.create({
      title,
      artist: req.user.fullname.firstName + " " + req.user.fullname.lastName,
      artistId: req.user.id,
      musics: musics,
    });

    return res
      .status(201)
      .json({ message: "Playlist created successfully", playlist });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return res.status(500).json({ message: "Error creating playlist" });
  }
}

export async function getPlaylists(req, res) {
  try {
    const playlists = await playlistModel.find({ artistId: req.user.id });

    return res.status(200).json({ playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return res.status(500).json({ message: "Error fetching playlists" });
  }
}

export async function getPlaylistById(req, res) {
  const { id } = req.params;

  try {
    const playlistDocs = await playlistModel.findById(id);

    if (!playlistDocs) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const musics = [];

    for (const musicId of playlistDocs.musics) {
      const musicDoc = await musicModel.findById(musicId);
      if (musicDoc) {
        musics.push({
          id: musicDoc._id,
          title: musicDoc.title,
          artist: musicDoc.artist,
          musicUrl: musicDoc.musicUrl,
          coverImageUrl: musicDoc.coverImageUrl,
        });
      }
    }

    const playlist = {
      id: playlistDocs._id,
      title: playlistDocs.title,
      artist: playlistDocs.artist,
      musics,
    };

    playlistDocs.musics = musics;

    return res.status(200).json({ playlist: playlistDocs });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return res.status(500).json({ message: "Error fetching playlist" });
  }
}
