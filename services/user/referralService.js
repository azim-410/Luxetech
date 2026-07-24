import userModel from "../../model/userModel.js";
import Transaction from "../../model/transaction.js";

export const getOrCreateReferralCode = async (userId) => {
  let user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  if (!user.myReferralCode) {
    let isUnique = false;
    let refCode = "";
    while (!isUnique) {
      const randomStr = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      refCode = `${user.name.trim().split(" ")[0].toUpperCase()}_${randomStr}`;
      const existing = await userModel.findOne({ myReferralCode: refCode });
      if (!existing) isUnique = true;
    }
    user.myReferralCode = refCode;
    await user.save();
  }
  return user;
};

export const getReferredUsers = async (myReferralCode) => {
  return await userModel
    .find({ referredBy: myReferralCode })
    .sort({ createdAt: -1 });
};

export const processReferralReward = async (user) => {
  if (!user.referredBy) return;

  const referrer = await userModel.findOne({ myReferralCode: user.referredBy });

  if (referrer) {
    const existingReferrerTx = await Transaction.findOne({
      userId: referrer._id,
      description: `Referral Reward: ${user.name} signed up`,
    });
    if (!existingReferrerTx) {
      referrer.wallet = (referrer.wallet || 0) + 300;
      await referrer.save();

      await Transaction.create({
        userId: referrer._id,
        amount: 300,
        type: "credit",
        description: `Referral Reward: ${user.name} signed up`,
        status: "completed",
      });
    }

    // 2. Credit the new user (referred user) ₹500
    const existingNewUserTx = await Transaction.findOne({
      userId: user._id,
      description: `Welcome Bonus (Referred by ${referrer.name})`,
    });
    if (!existingNewUserTx) {
      user.wallet = (user.wallet || 0) + 500;
      await user.save();

      await Transaction.create({
        userId: user._id,
        amount: 500,
        type: "credit",
        description: `Welcome Bonus (Referred by ${referrer.name})`,
        status: "completed",
      });
    }
  }
};
