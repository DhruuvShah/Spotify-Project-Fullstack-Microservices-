import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  musics: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "music",
    },
  ],
});

const playlist = mongoose.model("playlist", playlistSchema);

export default playlist;
