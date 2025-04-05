import { successResponse, errorResponse } from "../lib/apiResponse.js";
import activityModel from "../models/activityModel.js";
import userModel from "../models/userModel.js";
import cardModel from "../models/cardModel.js";
import billHandler from "../utils/billCycle.js";
import recharegePlans from "../utils/rechargePlans.js";
import regisModel from "../models/regisModel.js";

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

admin.getUser = async (req, res) => {
  try {
    const data = await userModel.find();
    const cardData = await cardModel.find();
    const newCards = await regisModel.find();
    let accumulatedData = data.map((user) => {
      const card = cardData.find(
        (card) => card.userId.toString() === user._id.toString()
      );
      return {
        ...user._doc,
        cardId: card ? card.cardNumber : null,
        balance: card ? card.balance : null,
      };
    });
    newCards.forEach((ui) => {
      //if userHash is already present dont push it...
      const isPresent = accumulatedData.find(
        (user) => user.userHash === ui.userHash
      );
      if (isPresent) {
        return;
      }
      accumulatedData.push({ userHash: ui?.userHash });
    });
    return successResponse(res, "All users", accumulatedData);
  } catch (err) {
    console.log(err);
    return errorResponse(res, err.message);
  }
};

admin.rechargeCard = async (req, res) => {
  try {
    const { cardId, rechargeAmount } = req.body;
    const card = await cardModel.findOne({ cardNumber: cardId });
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
    const activeUsers = await userModel.find({
      activeSession: { $in: ["active", "pause"] },
    });
    const activeSession = await activityModel.find({
      status: { $in: ["active", "pause"] },
    });

    const finData = activeUsers.map((user) => {
      const activity = activeSession.find(
        (activity) => activity.userId.toString() === user._id.toString()
      );
      return {
        name: user.userName,
        userHash: user.userHash,
        loginTime: activity ? activity.createdAt : null,
        status: activity ? activity.status : null,
      };
    });

    return successResponse(res, "All active sessions", finData);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

admin.revokeSession = async (req, res) => {
  try {
    const userHash = req.body.userHash;
    const user = await userModel.findOne({ userHash: userHash });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    const activity = await activityModel.findById(user?.lastActivity);
    if (!activity || activity.status === "end") {
      return errorResponse(res, "Activity not found or user ", null, 404);
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

admin.resumeSession = async (req, res) => {
  try {
    const userBody = req.body.userHash;
    const user = await userModel.findOne({ userHash: userBody });
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    if (user.activeSession === "active" || user.activeSession === null) {
      return errorResponse(res, "Not Applicable", null, 409);
    }
    const activity = await activityModel.findById(user.lastActivity);
    activity.status = "active";
    activity.loginTime = new Date();
    await activity.save();
    user.activeSession = "active";
    await user.save();
    return successResponse(res, "User resumed successfully", user);
  } catch (err) {
    console.log(err);
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

admin.getDashboard = async (req, res) => {
  try {
    const activity = await activityModel.find();
    const today = new Date();
    const distinctUsers = new Set();
    activity.forEach((activity) => {
      const activityDate = new Date(activity.loginTime);
      if (
        activityDate.getDate() === today.getDate() &&
        activityDate.getMonth() === today.getMonth() &&
        activityDate.getFullYear() === today.getFullYear()
      ) {
        distinctUsers.add(activity.userId.toString());
      }
    });
    const currentDayBalance = activity
      .filter((activity) => {
        const activityDate = new Date(activity.loginTime).toDateString();
        const todayDate = today.toDateString();
        return activityDate === todayDate;
      })
      .reduce((total, activity) => {
        return total + (activity.billAmount || 0);
      }, 0);

    const weeklyBalance = activity
      .filter((activity) => {
        const activityDate = new Date(activity.loginTime);
        return (
          activityDate.getDate() >= today.getDate() - 7 &&
          activityDate.getMonth() === today.getMonth() &&
          activityDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((total, activity) => {
        return total + (activity.billAmount || 0);
      }, 0);

    const monthlyBalance = activity
      .filter((activity) => {
        const activityDate = new Date(activity.loginTime);
        return (
          activityDate.getMonth() === today.getMonth() &&
          activityDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((total, activity) => {
        return total + (activity.billAmount || 0);
      }, 0);

    const returnObject = {
      currentDayBalance,
      weeklyBalance,
      monthlyBalance,
      totalUsers: distinctUsers.size,
    };
    return successResponse(res, "Dashboard data", returnObject);
  } catch (err) {
    console.log(err);
    return errorResponse(res, err.message);
  }
};

admin.removeUserAndCard = async (req, res) => {
  try {
    const cardId = req.body.cardNumber;
    const getCard = await cardModel.findOne({ cardNumber: cardId });
    if (!getCard) {
      return errorResponse(res, "Card not found", null, 404);
    }
    const user = await userModel.findById(getCard.userId);
    if (!user) {
      return errorResponse(res, "User not found", null, 404);
    }
    if (user.activeSession === null) {
      return errorResponse(res, "Please revoke any session", null, 409);
    }
    await userModel.findByIdAndDelete(user._id);
    await cardModel.findByIdAndDelete(getCard._id);
    return successResponse(res, "User and card removed successfully", null);
  } catch (err) {
    console.log(err);
    return errorResponse(res, err.message);
  }
};

admin.getAllBills = async (req, res) => {
  try {
    const allActivities = await activityModel
      .find()
      .populate("userId", "userName");
    const activityDetails = allActivities
      .filter((activity) => activity.status === "end")
      .map((activity) => {
        const activityDate = new Date(activity.loginTime).toLocaleDateString();
        const activityLogin = new Date(activity?.createdAt).toLocaleString().split(",")[1];
        const activityLogout = new Date(activity?.logOutTime).toLocaleString().split(",")[1];
        return {
          date: activityDate,
          userName: activity.userId?.userName || "Unknown",
          billAmount: activity.billAmount || 0,
          loginTime: activityLogin,
          logOutTime: activityLogout,
        };
      });
      return successResponse(res, "All bills", activityDetails);
  } catch (err) {
    console.log(err);
    return errorResponse(res, err.message);
  }
};

export default admin;
