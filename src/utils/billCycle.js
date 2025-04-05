import activityModel from "../models/activityModel.js";
import strategy from "./billStrategy.js";
let billHandler = {};

billHandler.logActivity = async (user) => {
  const activity = await activityModel.findById(user.lastActivity);
  activity.logOutTime = new Date();
  activity.status = "end";
  let billAmount = activity?.billAmount;
  billAmount += Math.abs(new Date() - activity.loginTime) / (1000 * 60);
  activity.billAmount = strategy(billAmount);
  await activity.save();
  return strategy(billAmount);
};

billHandler.pauseActivity = async (user) => {
    const activity = await activityModel.findById(user.lastActivity);
    activity.status = "pause";
    let currBill_Init = Math.abs(new Date() - activity.loginTime) / (1000 * 60);
    activity.billAmount += currBill_Init;
    await activity.save();
};

export default billHandler;
