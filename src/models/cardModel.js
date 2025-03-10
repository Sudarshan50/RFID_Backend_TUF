import mongoose from "mongoose";
const CardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "User",
  },
  cardNumber: {
    type: Number,
    required: true,
    unique: true, 
  },
  balance: {
    type: Number,
    required: true,
    ref: "User",
    default: 0,
  },
  recharges: [
    {
      rechargeAmount: {
        type: Number,
        required: true,
      },
      rechargeDate: {
        type: Date,
        required: true,
      },
    },
  ],
  lastRecharge: {
    type: Date,
    default: null,
  },
  validity: {
    type: Number,
    required: true,
    default: 0,
  },
});
export default mongoose.model("Card", CardSchema);
