import { successResponse, errorResponse } from "../lib/apiResponse.js";
import activityModel from "../models/activityModel.js";
import userModel from "../models/userModel.js";
import cardModel from "../models/cardModel.js";
import billHandler from "../utils/billCycle.js";
import recharegePlans from "../utils/rechargePlans.js";

let admin = {};

admin.addUser = async (req, res) => {
  try {
    const { name, phoneNumber, userHash } = req.body;
    const user = new userModel({
      userName: name,
      phoneNumber,
      userHash,
    });
    await user.save();
    const card = new cardModel({
      userId: user._id,
      cardNumber: Math.floor(Math.random() * 100000000),
    });
    await card.save();
    user.card = card._id;
    await user.save();
    return successResponse(res, "User added successfully", user);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.rechargeCard = async (req, res) => {
  try {
    const { userHash, rechargeAmount } = req.body;
    const user = await userModel.findOne({ userHash: userHash });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    const card = await cardModel.findOne({ userId: user._id });
    if (!card) {
      return errorResponse(res, "Card not found", null, 404);
    }
    card.balance += rechargeAmount;
    card.recharges.push({
      rechargeAmount,
      rechargeDate: new Date(),
    });
    card.validity = recharegePlans[rechargeAmount];
    card.lastRecharge = new Date();
    await card.save();
    return successResponse(
      res,
      `Amount ${rechargeAmount} added successfully`,
      card
    );
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.getAllActiveSession = async (req, res) => {
  try {
    const activeActivity = await activityModel.find({ status: "active" });
    return successResponse(res, "All active sessions", activeActivity);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.revokeSession = async (req, res) => {
  try {
    const activityId = req.body.activityId;
    const activity = await activityModel.findById(activityId);
    if (!activity) {
      return errorResponse(res, "Activity not found", null, 404);
    }
    const billAmount = await billHandler.logActivity(user);
    const card = await cardModel.findOne({ userId: user._id });
    if (card.balance < billAmount) {
      card.balance = 0;
      return errorResponse(
        res,
        `Insufficient balance extra:- ${billAmount - card.balance}`,
        null,
        400
      );
    }
    card.balance -= billAmount;
    await card.save();
    user.activeSession = null;
    await user.save();
    return successResponse(res, "User logged out successfully", user);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.getAllBills = async (req, res) => {
  try {
    const allActivities = await activityModel.find();
    return successResponse(res, "All bills", allActivities);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.getAllRecharges = async (req, res) => {
  try {
    const recharges = await cardModel.find({}, "recharges");
    return successResponse(res, "All recharges", recharges);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
export default admin;
