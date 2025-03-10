import e  from "express";
import admin from "../controller/adminController.js";

const AdminRouter = e.Router();


AdminRouter.post("/add",admin.addUser);
AdminRouter.post("/recharge",admin.rechargeCard);
AdminRouter.get("/active",admin.getAllActiveSession);
AdminRouter.post("/revoke",admin.revokeSession);
AdminRouter.get('/sessions',admin.getAllBills);
AdminRouter.get('/recharges',admin.getAllRecharges);

export default AdminRouter;