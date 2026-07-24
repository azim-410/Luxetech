import {
  getOrCreateReferralCode,
  getReferredUsers,
} from "../../services/user/referralService.js";

export const getReferralPage = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await getOrCreateReferralCode(userId);
    const referredUsers = await getReferredUsers(user.myReferralCode);
    const referredCount = referredUsers.length;

    return res.render("User/refer", {
      user,
      referredCount,
      referredUsers,
      host: req.headers.host,
    });
  } catch (error) {
    console.error("Referral page controller error:", error);
    return res.status(500).send("Server error");
  }
};
