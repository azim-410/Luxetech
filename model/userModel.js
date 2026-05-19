import mongoose, { now } from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        myReferralCode: {
            type: String,
            unique: true,
            sparse: true       // allows multiple users to have null referral code
        },

        referredBy: {
            type: String,
            default: null
        },

        role: {
            type: String,
            default: "user"
        },
        terms: {
            type: Boolean,
            required: true,

        },
        userExpire: {
            type: Date,
            default: Date.now(),
            expires: 720 // time in seconds
        },
        isverified: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;