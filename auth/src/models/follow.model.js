import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true },
  artistId: { type: String, required: true },
}, { timestamps: true });

followSchema.index({ followerId: 1, artistId: 1 }, { unique: true });
followSchema.index({ artistId: 1 });

export default mongoose.model("Follow", followSchema);
