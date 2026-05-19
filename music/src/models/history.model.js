import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  musicId: { type: mongoose.Schema.Types.ObjectId, ref: "music", required: true },
  playedAt: { type: Date, default: Date.now },
});

historySchema.index({ userId: 1, playedAt: -1 });
historySchema.index({ userId: 1, musicId: 1 });

export default mongoose.model("History", historySchema);
