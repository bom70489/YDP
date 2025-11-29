import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : { type : String , required : true },
    email : { type : String , required : true },
    password : { type : String , required : true},
    searchHistory: [
    {
      query: { type: String, required: true }, 
      timestamp: { type: Date, default: Date.now }, 
    }
   ],
   favorites: [
    {
      propertyId: { type: String, required: true }, 
      addedAt: { type: Date, default: Date.now }, 
    }
  ]
} , { timestamps: true })

const userModel = mongoose.models.user || mongoose.model('user' , userSchema)

export default userModel