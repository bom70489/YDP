import mongoose from "mongoose";

const guestSchema = new mongoose.Schema({
    query : { type : String , required : true },
    timestamp : { type : Date , default : Date.now }
})

const guestSearchModel = mongoose.models.guestSearch || mongoose.model("guestSearch" , guestSchema)

export default guestSearchModel;