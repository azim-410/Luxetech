import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("\nmongoDB connected successfully ");
  } catch (error) {
    console.log("\nconnection error:" + error);
  }
};

export default connectDB;
