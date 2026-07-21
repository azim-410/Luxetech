import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: null,
    },
    tempEmail: {
      type: String,
      default: null,
    },
    tempEmailOtp: {
      type: String,
      default: null,
    },
    emailOtpExpiry: {
      type: Date,
      default: null,
    },
    temUserExpire: {
      type: Date,
      default: Date.now,
      expires: 660,
    },
  },
  {
    timestamps: true,
  },
);

const tempUserModel = mongoose.model("TempUser", tempUserSchema);

export default tempUserModel;
