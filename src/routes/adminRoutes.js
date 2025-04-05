import e  from "express";
import admin from "../controller/adminController.js";

const AdminRouter = e.Router();



AdminRouter.post("/add",admin.addUser);
AdminRouter.get("/user",admin.getUser);
AdminRouter.post("/recharge",admin.rechargeCard);
AdminRouter.get("/active",admin.getAllActiveSession);
AdminRouter.get("/bills",admin.getAllBills);
AdminRouter.post("/remove",admin.removeUserAndCard);
AdminRouter.get("/dashboard",admin.getDashboard);
AdminRouter.post("/resume",admin.resumeSession);
AdminRouter.post("/revoke",admin.revokeSession);
AdminRouter.get('/sessions',admin.getAllBills);
AdminRouter.get('/recharges',admin.getAllRecharges);

export default AdminRouter;