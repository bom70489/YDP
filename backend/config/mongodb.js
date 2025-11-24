import mongoose from "mongoose";

const connectDb = async () => {

    mongoose.connection.on('connected' , () => {
        console.log("CB Connect");
    })

    await mongoose.connect(`${process.env.MONGODB}/assets`)

}

export default connectDb