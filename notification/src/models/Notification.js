import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientEmail: { type: String, required: true },
    type: { type: String, enum: ["welcome"], required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    messageId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Notification", notificationSchema);
