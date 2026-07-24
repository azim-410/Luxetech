import userModel from "../../model/userModel.js";
import bcrypt from "bcrypt";
const getAllUsersService = async (page, limit) => {
  const skip = (page - 1) * limit;

  const totalUsers = await userModel.countDocuments({ role: "user" });
  const totalPages = Math.ceil(totalUsers / limit);

  const users = await userModel
    .find({ role: "user" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { users, totalUsers, totalPages };
};

const blockUserService = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.role === "admin") throw new Error("Cannot block and unblock admin");

  await userModel.findByIdAndUpdate(userId, { isBlocked: true });
  return { success: true };
};

const unblockUserService = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.role === "admin") throw new Error("Cannot block and unblock admin");
  if (user.isBlocked !== true)
    throw new Error("Cannot unblock, user is not blocked");
  await userModel.findByIdAndUpdate(userId, { isBlocked: false });
  return { success: true };
};

const deleteUserService = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("no user found");
  if (user.role === "admin") throw new Error("Cant delete an admin");
  await userModel.findByIdAndDelete(userId);
};

const searchUsersService = async (query) => {
  const users = await userModel
    .find({
      role: "user",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
    .select("-password")
    .sort({ createdAt: -1 });
  return users;
};

const createUserService = async (name, email, password) => {
  if (!name || name.trim() === "") throw new Error("Name is required");
  if (name.trim().length < 3)
    throw new Error("Name must be at least 3 characters");
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name.trim()))
    throw new Error("Name must contain only letters and spaces");

  if (!email || email.trim() === "") throw new Error("Email is required");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) throw new Error("Invalid email format");

  if (!password || password.trim() === "")
    throw new Error("Password is required");
  if (password.length < 6)
    throw new Error("Password must be at least 6 characters");

  const existing = await userModel.findOne({
    email: email.trim().toLowerCase(),
  });
  if (existing) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new userModel({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    role: "user",
    isverified: true,
    userExpire: null,
    terms: true,
  });

  await newUser.save();
  return { success: true };
};

const getAllUsersNoPaginationService = async () => {
  return await userModel.find({ role: "user" }).sort({ createdAt: -1 });
};

export {
  getAllUsersService,
  blockUserService,
  unblockUserService,
  deleteUserService,
  searchUsersService,
  createUserService,
  getAllUsersNoPaginationService,
};
