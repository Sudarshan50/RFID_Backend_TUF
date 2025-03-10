import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  userHash: {
    type: String,
    required: true,
    unique: true,
  },
  dateOfIssue: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastActivity: {
    type: String,
    ref: "Activity",
  },
  card: {
    type: String,
    ref: "Card",
  },
  activeSession: {
    type: String,
    enum: [null, "active", "pause"],
    default: null,
  },
});
export default mongoose.model("User", userSchema);
