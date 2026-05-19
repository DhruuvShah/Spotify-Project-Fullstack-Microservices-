import mongoose from "mongoose";

const userPlaylistSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  userId: { type: String, required: true },
  musics: [{ type: mongoose.Schema.Types.ObjectId, ref: "music" }],
}, { timestamps: true });

userPlaylistSchema.index({ userId: 1 });

export default mongoose.model("UserPlaylist", userPlaylistSchema);
