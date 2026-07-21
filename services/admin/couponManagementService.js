import couponModel from "../../model/coupon.js";
import categoryModel from "../../model/category.js";
import Order from "../../model/order.js";

const getCouponsService = async () => {
  const today = new Date();

  // Automatically deactivate expired coupons in the DB
  await couponModel.updateMany(
    { status: true, expiryDate: { $lte: today } },
    { $set: { status: false } },
  );

  const allCoupons = await couponModel
    .find({})
    .populate("applicableCategories")
    .sort({ createdAt: -1 });
  const categories = await categoryModel
    .find({ status: true, isHidden: false })
    .sort({ categoryName: 1 });

  const activeCoupons = [];
  const inactiveCoupons = [];

  allCoupons.forEach((coupon) => {
    if (coupon.status) {
      activeCoupons.push(coupon);
    } else {
      inactiveCoupons.push(coupon);
    }
  });

  const recentRedemptions = await Order.find({
    couponCode: { $ne: null, $exists: true },
  })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  const allRedemptions = await Order.find({
    couponCode: { $ne: null, $exists: true },
  })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  return {
    activeCoupons,
    inactiveCoupons,
    categories,
    recentRedemptions,
    allRedemptions,
  };
};

const createCouponService = async (couponData) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    maxRedeemableAmount,
    usageLimit,
    expiryDate,
    applicableCategories,
  } = couponData;

  if (!code || code.trim() === "") throw new Error("Coupon Code is required");
  if (!/^[A-Z0-9]+$/i.test(code.trim()))
    throw new Error("Coupon Code must be alphanumeric");

  const existingCoupon = await couponModel.findOne({
    code: code.trim().toUpperCase(),
  });
  if (existingCoupon) throw new Error("Coupon Code already exists");

  if (discountType === "fixed") {
    const val = Number(discountValue);
    const minVal = Number(minOrderValue || 0);
    if (val >= minVal) {
      throw new Error(
        "Fixed discount amount must be less than the minimum purchase requirement",
      );
    }
  }

  if (
    discountType === "percentage" &&
    maxRedeemableAmount !== undefined &&
    maxRedeemableAmount !== null &&
    maxRedeemableAmount !== ""
  ) {
    const maxRed = Number(maxRedeemableAmount);
    if (isNaN(maxRed) || maxRed <= 0) {
      throw new Error("Maximum redeemable amount must be a positive number");
    }
  }

  let categoriesArr = [];
  if (applicableCategories) {
    if (Array.isArray(applicableCategories)) {
      categoriesArr = applicableCategories;
    } else {
      categoriesArr = [applicableCategories];
    }
  }

  const newExpiryDate = new Date(expiryDate);
  const today = new Date();
  const isExpired = newExpiryDate <= today;

  const newCoupon = new couponModel({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue,
    minOrderValue: minOrderValue || 0,
    maxRedeemableAmount:
      discountType === "percentage"
        ? maxRedeemableAmount || undefined
        : undefined,
    usageLimit: usageLimit || undefined,
    expiryDate: newExpiryDate,
    applicableCategories: categoriesArr,
    status: !isExpired,
    isLimitReached: false,
  });

  try {
    await newCoupon.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Coupon Code already exists");
    }
    throw err;
  }
  return { success: true };
};

const deleteCouponService = async (id) => {
  const updated = await couponModel.findByIdAndUpdate(
    id,
    { status: false },
    { new: true },
  );
  if (!updated) throw new Error("Coupon not found");
  return { success: true };
};

const updateCouponService = async (id, couponData) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    maxRedeemableAmount,
    usageLimit,
    expiryDate,
    applicableCategories,
  } = couponData;

  if (!code || code.trim() === "") throw new Error("Coupon Code is required");
  if (!/^[A-Z0-9]+$/i.test(code.trim()))
    throw new Error("Coupon Code must be alphanumeric");

  const existingCoupon = await couponModel.findOne({
    code: code.trim().toUpperCase(),
    _id: { $ne: id },
  });
  if (existingCoupon) throw new Error("Coupon Code already exists");

  if (discountType === "fixed") {
    const val = Number(discountValue);
    const minVal = Number(minOrderValue || 0);
    if (val >= minVal) {
      throw new Error(
        "Fixed discount amount must be less than the minimum purchase requirement",
      );
    }
  }

  if (
    discountType === "percentage" &&
    maxRedeemableAmount !== undefined &&
    maxRedeemableAmount !== null &&
    maxRedeemableAmount !== ""
  ) {
    const maxRed = Number(maxRedeemableAmount);
    if (isNaN(maxRed) || maxRed <= 0) {
      throw new Error("Maximum redeemable amount must be a positive number");
    }
  }

  const couponToUpdate = await couponModel.findById(id);
  if (!couponToUpdate) throw new Error("Coupon not found");

  let categoriesArr = [];
  if (applicableCategories) {
    if (Array.isArray(applicableCategories)) {
      categoriesArr = applicableCategories;
    } else {
      categoriesArr = [applicableCategories];
    }
  }

  const newUsageLimit = usageLimit || undefined;
  const currentUsedCount = couponToUpdate.usedCount || 0;
  const newExpiryDate = new Date(expiryDate);
  const today = new Date();

  let isLimitReached = couponToUpdate.isLimitReached || false;
  let status = couponToUpdate.status;

  // Check limit
  if (newUsageLimit && currentUsedCount >= newUsageLimit) {
    isLimitReached = true;
    status = false;
  } else {
    if (couponToUpdate.isLimitReached) {
      isLimitReached = false;
      status = true;
    }
  }

  // Check expiry
  const isExpired = newExpiryDate <= today;
  if (isExpired) {
    status = false;
  } else if (
    couponToUpdate.expiryDate &&
    new Date(couponToUpdate.expiryDate) <= today
  ) {
    // Reactivate if it was expired but now has a future expiry
    status = true;
  }

  try {
    const updated = await couponModel.findByIdAndUpdate(
      id,
      {
        $set: {
          code: code.trim().toUpperCase(),
          discountType,
          discountValue,
          minOrderValue: minOrderValue || 0,
          maxRedeemableAmount:
            discountType === "percentage"
              ? maxRedeemableAmount || undefined
              : undefined,
          usageLimit: newUsageLimit,
          expiryDate: newExpiryDate,
          applicableCategories: categoriesArr,
          isLimitReached,
          status,
        },
      },
      { new: true },
    );

    if (!updated) throw new Error("Coupon not found");
  } catch (err) {
    if (err.code === 11000) {
      throw new Error("Coupon Code already exists");
    }
    throw err;
  }
  return { success: true };
};

export {
  getCouponsService,
  createCouponService,
  deleteCouponService,
  updateCouponService,
};
