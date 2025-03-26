import regis from "../models/regisModel.js";
const logUser = async (userHash) => {
    try {
        await regis.findOne({ userHash: userHash }).then(async (user) => {
            if (!user) {
                await regis.create({ userHash: userHash });
                regis.save();
            }else{
                return;
            }
        });
    } catch (err) {
        console.log(err);
    }
}
export default logUser;