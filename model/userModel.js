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
            default: null   // null for Google OAuth users
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
        profileImage: {
            type: String,
            default: null
        },
        role: {
            type: String,
            default: "user"
        },
        terms: {
            type: Boolean,
            default: false  // false for Google OAuth users
        },
        userExpire: {
            type: Date,
            expires: 720       // 12 minutes in seconds
       },
        isBlocked: {
            type: Boolean,
            default: false
        },
        googleId: { type: String, default: null },
        avatar: { type: String, default: null },
        authProvider: {
            type: String,
            default: 'local'
        },
        isVerified: { type: Boolean, default: false },
        wallet: {
            type: Number,
            default: 0
        },
        ordersCount: {
            type: Number,
            default: 0
        },
        totalSpend: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;