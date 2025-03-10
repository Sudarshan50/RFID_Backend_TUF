import e from "express";
import master from "../controller/masterController.js";

const masterRouter = e.Router();

masterRouter.get("/info/:userHash",master.getCurrentInfo);
masterRouter.post("/login",master.login);
masterRouter.post("/logout",master.logOut);




export default masterRouter;