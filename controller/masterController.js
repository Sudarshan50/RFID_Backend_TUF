import { successResponse, errorResponse } from "../lib/apiResponse.js";
import userModel from "../models/userModel.js";
import cardModel from "../models/cardModel.js";
import activityModel from "../models/activityModel.js";
import billHandler from "../utils/billCycle.js";

let master = {};

master.getCurrentInfo = async (req, res) => {
  try {
    const userHash = req.params.userHash;
    const user = await userModel.findOne({ userHash: userHash });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    const userCard = await cardModel.findOne({ userId: user._id });
    if (userCard.balance < 30) {
      return errorResponse(res, "Low balance recharge to conitnue", null, 400);
    }
    if (user.activeSession === "active") {
      return successResponse(
        res,
        "User is active",
        { user, balance: userCard?.balance },
        201
      );
    } else if (user.activeSession === "pause") {
      return successResponse(
        res,
        "User is paused",
        { user, balance: userCard?.balance },
        202
      );
    }
    return successResponse(
      res,
      "User is not active",
      { user, balance: userCard?.balance },
      200
    );
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

master.login = async (req, res) => {
  try {
    const userHash = req.body.userHash;
    const user = await userModel.findOne({ userHash: userHash });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    if (user.activeSession === "active") {
      return errorResponse(res, "User is already active", null, 409);
    }
    if (user.activeSession === "pause") {
      const activity = await activityModel.findById(user.lastActivity);
      activity.status = "active";
      activity.loginTime = new Date();
      await activity.save();
      user.activeSession = "active";
      await user.save();
      return successResponse(res, "User resumed successfully", user);
    }
    const activity = new activityModel({
      userId: user._id,
    });
    await activity.save();
    user.lastActivity = activity._id;
    user.activeSession = "active";
    await user.save();
    return successResponse(res, "User logged in successfully", user);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
master.logOut = async (req, res) => {
  try {
    const userHash = req.body.userHash;
    const signal = req.body.signal;
    const user = await userModel.findOne({ userHash: userHash });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    if (user.activeSession === null) {
      return errorResponse(res, "User is not active", null, 409);
    }
    // signal 0 for logout and 1 for pause
    if (signal == "0") {
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
    } else if (signal == "1") {
      await billHandler.pauseActivity(user);
      user.activeSession = "pause";
      await user.save();
      return successResponse(res, "User paused successfully", user);
    }
    return errorResponse(res, "Invalid signal", null, 400);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

export default master;
