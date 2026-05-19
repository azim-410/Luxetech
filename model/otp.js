import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    otp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0 // 🔥 MongoDB TTL (auto delete OTP)
    },

    attempts: {
        type: Number,
        default: 0
    }

}, 
{
    timestamps: true
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;