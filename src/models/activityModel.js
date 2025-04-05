import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "User",
  },
  loginTime: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
  },
  status: {
    type: String,
    required: true,
    default: "active",
    enum: ["active", "pause", "end"],
  },
  logOutTime: {
    type: Date,
    default: null,
  },
  billAmount: {
    type: Number,
    default: 0,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },  
});

export default mongoose.model("Activity", activitySchema);
