import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  musicId: { type: mongoose.Schema.Types.ObjectId, ref: "music", required: true },
}, { timestamps: true });

likeSchema.index({ userId: 1, musicId: 1 }, { unique: true });

export default mongoose.model("Like", likeSchema);
