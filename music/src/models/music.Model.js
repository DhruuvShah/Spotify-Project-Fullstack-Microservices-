import mongoose from "mongoose";

const musicSchema = new mongoose.Schema(
  {
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
    },
    musicUrl: {
      type: String,
      required: true,
    },
    coverImageUrl: {
      type: String,
      required: true,
    },
    musicFileId: {
      type: String,
      default: "",
    },
    coverFileId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

musicSchema.index({ artistId: 1 });
musicSchema.index({ title: "text", artist: "text" });

const music = mongoose.model("music", musicSchema);

export default music;
