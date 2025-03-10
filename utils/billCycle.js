import activityModel from "../models/activityModel.js";
import strategy from "./billStrategy.js";
let billHandler = {};

billHandler.logActivity = async (user) => {
  const activity = await activityModel.findById(user.lastActivity);
  activity.logOutTime = new Date();
  activity.status = "end";
  const billAmount = Math.abs(activity.logOutTime - activity.loginTime) / (1000 * 60);
  activity.billAmount += strategy(billAmount);
  await activity.save();
  return strategy(billAmount);
};

billHandler.pauseActivity = async (user) => {
    const activity = await activityModel.findById(user.lastActivity);
    activity.status = "pause";
    const currBill_Init = Math.abs(new Date() - activity.loginTime) / (1000 * 60);
    const ammountTillNow = strategy(currBill_Init);
    activity.billAmount += ammountTillNow;
    await activity.save();
};

export default billHandler;
