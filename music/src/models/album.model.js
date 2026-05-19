import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  artist: { type: String, required: true },
  artistId: { type: String, required: true },
  coverImageUrl: { type: String, default: "" },
  musics: [{ type: mongoose.Schema.Types.ObjectId, ref: "music" }],
}, { timestamps: true });

albumSchema.index({ artistId: 1 });

export default mongoose.model("Album", albumSchema);
