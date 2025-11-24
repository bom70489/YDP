import mongoose from "mongoose";

const connectDb = async () => {

    mongoose.connection.on('connected' , () => {
        console.log("CB Connect");
    })

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    await mongoose.connect(`${process.env.MONGODB}/assets`)

}

export default connectDb