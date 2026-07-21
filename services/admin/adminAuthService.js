import userModel from "../../model/userModel.js";
import Order from "../../model/order.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const adminLoginService = async (email, password) => {
  if (!email || email.trim() === "" || !password || password.trim() === "")
    throw new Error("All feild required");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) throw new Error("Invalid email format");

  const admin = await userModel.findOne({ email: email.trim().toLowerCase() });
  if (!admin) throw new Error("Invalid credentials");

  if (admin.role !== "admin") throw new Error("Access denied");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return { id: admin._id, email: admin.email, name: admin.name };
};

const getDashboardStatsService = async () => {
  const totalCustomers = await userModel.countDocuments({ role: "user" });
  const totalOrders = await Order.countDocuments();

  // Sum grandTotal of orders where paymentStatus is 'Paid'
  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // Count pending/processing orders
  const pendingOrders = await Order.countDocuments({
    orderStatus: {
      $in: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
      ],
    },
  });

  return {
    totalCustomers,
    totalOrders,
    totalRevenue,
    pendingOrders,
  };
};

export { adminLoginService, getDashboardStatsService };
