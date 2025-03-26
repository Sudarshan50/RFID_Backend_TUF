import mongoose from "mongoose";


const regisSchema = new mongoose.Schema({
    userHash: {
        type: String,
        required: true,
    },
});
const regisModel = mongoose.model("regis", regisSchema);
export default regisModel;
