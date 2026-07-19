import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxRedeemableAmount: {
        type: Number
    },
    usageLimit: {
        type: Number
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isLimitReached: {
        type: Boolean,
        default: false
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }]
}, {
    timestamps: true
});

const couponModel = mongoose.model("coupon", couponSchema);
export default couponModel;
