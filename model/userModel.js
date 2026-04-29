import mongoose from "mongoose";

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
        terms:{
            type:Boolean,
            required: true,

        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;