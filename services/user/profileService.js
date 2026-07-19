import userModel from '../../model/userModel.js';
import tempUserModel from '../../model/tempUser.js';
import OTP from '../../model/otp.js';
import { generateOTP } from '../../utils/genarateOTP.js';
import { sendOTP } from '../../utils/sendEmail.js';
import bcrypt from 'bcrypt';
import Order from '../../model/order.js';
import Address from '../../model/address.js';

const getUserById = async (userId) => {
    const user = await userModel.findById(userId).select('-password');
    // console.log("user from service",user);
    return user;
}

// ── Validation helpers ───────────────────────────────────────
const NAME_REGEX = /^[A-Za-z\s]+$/;                                    // letters + spaces only
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/; // RFC-friendly

const updateProfileService = async (userId, name, email, profileImage) => {
    const currentUser = await getUserById(userId);

    // ── Name validation ──────────────────────────────────────
    if (name !== undefined) {
        const trimmedName = name.trim();
        if (trimmedName === '') {
            throw new Error('Name cannot be empty.');
        }
        if (trimmedName.length < 3) {
            throw new Error('Name must be at least 3 characters.');
        }
        if (trimmedName.length > 50) {
            throw new Error('Name must not exceed 50 characters.');
        }
        if (!NAME_REGEX.test(trimmedName)) {
            throw new Error('Name must contain only letters and spaces.');
        }
    }

    // ── Email validation ─────────────────────────────────────
    if (email !== undefined) {
        const trimmedEmail = email.trim();
        if (trimmedEmail === '') {
            throw new Error('Email cannot be empty.');
        }
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            throw new Error('Please enter a valid email address (e.g. user@example.com).');
        }
    }

    const updatedName = name ? name.trim() : currentUser.name;
    const updatedEmail = email ? email.trim() : currentUser.email;

    const nameChanged = updatedName !== currentUser.name;
    const emailChanged = updatedEmail !== currentUser.email;
    const imageChanged = !!profileImage;

    if (!nameChanged && !emailChanged && !imageChanged) {
        throw new Error('No changes detected.');
    }

    if (imageChanged) {
        await userModel.findByIdAndUpdate(userId, { profileImage });
    }

    if (imageChanged && !nameChanged && !emailChanged) {
        return { success: true, requiresOtp: false, message: 'Profile image updated successfully.' };
    }

    if (nameChanged && !emailChanged) {
        await userModel.findByIdAndUpdate(userId, { name: updatedName });
        return { success: true, requiresOtp: false, message: 'Profile updated successfully.' };
    }

    const isExistEmail = await userModel.findOne({ email: updatedEmail });
    if (isExistEmail) throw new Error('This email is already in use by another account.');

    // Clean up any existing temp or OTP records for this user
    await tempUserModel.deleteMany({ userId });
    await OTP.deleteMany({ userId });

    const currentOtp = generateOTP();

    // Save the OTP in the otps collection (OTP model)
    await OTP.create({
        userId,
        otp: currentOtp,
        expiresAt: new Date(Date.now() + 4 * 60 * 1000)
    });

    // Save the new email and name info in tempUserModel
    const tempUser = new tempUserModel({
        userId,
        name: updatedName,
        tempEmail: updatedEmail
    });
    await tempUser.save();

    try {
        await sendOTP(currentUser.email, currentOtp);
    } catch (emailError) {
        console.error('OTP sending error to current email:', emailError.message);
    }

    return { success: true, requiresOtp: true, message: 'OTP sent to your current email. Please verify.' };
};

const deleteProfileImageServices = async (userId) => {
    await userModel.findByIdAndUpdate(userId, { profileImage: null })
    return { success: true, message: ' profile delete successfully' }
}

const verifyCurrentOtpService = async (userId, otp) => {
    const tempUser = await tempUserModel.findOne({ userId });
    if (!tempUser) {
        throw new Error('No OTP request found. Please try again.');
    }

    if (!otp || otp.trim().length !== 6) {
        throw new Error('OTP must be 6 digits');
    }

    const otpRecord = await OTP.findOne({ userId });
    if (!otpRecord) {
        throw new Error('OTP expired. Please try again.');
    }

    if (otpRecord.expiresAt < Date.now()) {
        await OTP.deleteOne({ userId });
        throw new Error('OTP has expired. Please try again.');
    }

    if (otpRecord.otp !== otp.trim()) {
        throw new Error('Invalid OTP. Please try again.');
    }

    // Step 1 verified successfully! Remove the Step 1 OTP record.
    await OTP.deleteOne({ userId });

    // Step 2: Generate OTP for new email and store it in tempUserModel
    const newOtp = generateOTP().toString();
    const expireOtp = new Date(Date.now() + 1000 * 60 * 4);

    // Delete and recreate the tempUserModel record to guarantee a fresh createdAt timestamp!
    await tempUserModel.deleteOne({ userId });
    const newTempUser = new tempUserModel({
        userId,
        name: tempUser.name,
        tempEmail: tempUser.tempEmail,
        tempEmailOtp: newOtp,
        emailOtpExpiry: expireOtp
    });
    await newTempUser.save();

    try {
        await sendOTP(tempUser.tempEmail, newOtp);
    } catch (emailError) {
        console.error('OTP sending error to new email:', emailError.message);
    }

    return { success: true, message: 'Current email verified. OTP sent to your new email.' };
};

const resendCurrentOtpService = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found.');

    const tempUser = await tempUserModel.findOne({ userId });
    if (!tempUser) throw new Error('No active email change request found.');

    await OTP.deleteMany({ userId });

    const currentOtp = generateOTP();

    await OTP.create({
        userId,
        otp: currentOtp,
        expiresAt: new Date(Date.now() + 4 * 60 * 1000)
    });

    try {
        await sendOTP(user.email, currentOtp);
    } catch (emailError) {
        console.error('OTP resending error to current email:', emailError.message);
    }

    return { success: true, message: 'New OTP sent to your current email.' };
};

const getProfileCurrentOtpTimerData = async (userId) => {
    const otpRecord = await OTP.findOne({ userId });
    const user = await userModel.findById(userId);
    const email = user ? user.email : null;
    if (!otpRecord) return { remainingSeconds: 0, resendCooldownSeconds: 0, email };

    const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(otpRecord.expiresAt).getTime() - Date.now()) / 1000)
    );
    const elapsedSinceCreated = Math.floor((Date.now() - new Date(otpRecord.createdAt).getTime()) / 1000);
    const resendCooldownSeconds = Math.max(0, 60 - elapsedSinceCreated);

    return { remainingSeconds, resendCooldownSeconds, email };
};

const verifyOtpService = async (userId, otp) => {

    const tempUser = await tempUserModel.findOne({ userId });

    if (!tempUser) {
        throw new Error('No OTP request found. Please try again.');
    }

    if (!otp || otp.trim().length !== 6) {
        throw new Error('OTP must be 6 digits');
    }

    if (new Date() > tempUser.emailOtpExpiry) {
        await tempUserModel.findOneAndDelete({ userId }); // clean up expired record
        throw new Error('OTP has expired. Please try again.');
    }

    if (tempUser.tempEmailOtp.toString() !== otp.trim()) {
        throw new Error('Invalid OTP. Please try again.');
    }

    await userModel.findByIdAndUpdate(userId, {
        email: tempUser.tempEmail,
        name: tempUser.name
    });

    await tempUserModel.findOneAndDelete({ userId });

    return { success: true, message: 'Profile updated successfully' };
};

const resendOtpService = async (userId) => {

    const tempUser = await tempUserModel.findOne({ userId });

    if (!tempUser) {
        throw new Error('No OTP request found. Please try again.');
    }

    const otp = generateOTP().toString();
    const expireOtp = new Date(Date.now() + 1000 * 60 * 4);

    console.log("Resent otp 1:", otp)
    await tempUserModel.deleteOne({ userId });
    const newTempUser = new tempUserModel({
        userId,
        name: tempUser.name,
        tempEmail: tempUser.tempEmail,
        tempEmailOtp: otp,
        emailOtpExpiry: expireOtp
    });
    await newTempUser.save();
    console.log("Resent otp 2:", otp)

    try {
        await sendOTP(tempUser.tempEmail, otp);
        console.log("Resent otp 3:", otp)
    } catch (emailError) {
        console.error("Resend OTP email error:", emailError.message);
        // Don't throw - OTP was already saved in database
        console.log("OTP saved but email failed. User can continue with verification.");
    }

    return { success: true, message: 'New OTP sent successfully' };
};


const verifyOldPasswordService = async (userId, oldPassword) => {

    if (!oldPassword || oldPassword.trim() === '') {
        throw new Error('Current password is required.');
    }

    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found.');

    // Validate that the user's account email is in a proper format (integrity check)
    if (!EMAIL_REGEX.test(user.email)) {
        throw new Error('Your account email appears to be invalid. Please contact support.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Incorrect current password.');

    return { success: true };
};


const changePasswordService = async (userId, newPassword, confirmPassword) => {
    if (!newPassword || !confirmPassword) {
        throw new Error('All fields are required.');
    }

    if (newPassword.trim() === '') {
        throw new Error('New password cannot be empty.');
    }

    if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
    }

    if (newPassword.length > 64) {
        throw new Error('New password must not exceed 64 characters.');
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(newPassword)) {
        throw new Error('New password must contain at least one uppercase letter.');
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(newPassword)) {
        throw new Error('New password must contain at least one lowercase letter.');
    }

    // Must contain at least one digit
    if (!/[0-9]/.test(newPassword)) {
        throw new Error('New password must contain at least one number.');
    }

    if (newPassword !== confirmPassword) {
        throw new Error('New password and confirm password do not match.');
    }

    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found.');

    if (await bcrypt.compare(newPassword, user.password)) {
        throw new Error('New password must be different from your current password.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    return { success: true };
};

const getProfileOtpTimerData = async (userId) => {
    const tempUser = await tempUserModel.findOne({ userId });
    const email = tempUser ? tempUser.tempEmail : null;
    if (!tempUser || !tempUser.emailOtpExpiry) return { remainingSeconds: 0, resendCooldownSeconds: 0, email };

    const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(tempUser.emailOtpExpiry).getTime() - Date.now()) / 1000)
    );
    const elapsedSinceCreated = Math.floor((Date.now() - new Date(tempUser.createdAt).getTime()) / 1000);
    const resendCooldownSeconds = Math.max(0, 60 - elapsedSinceCreated);

    return { remainingSeconds, resendCooldownSeconds, email };
};


const getProfileDashboardData = async (userId) => {

    const recentOrders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(2);

    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    const savedAddresses = [];
    const defaultAddress = addresses.find(a => a.isDefault);
    if (defaultAddress) {
        savedAddresses.push(defaultAddress);
    }
    const latestAddress = addresses.find(a => !savedAddresses.some(sa => sa._id.toString() === a._id.toString()));
    if (latestAddress) {
        savedAddresses.push(latestAddress);
    }

    // If no default address is found but addresses exist, just get the first two latest addresses
    if (savedAddresses.length === 0 && addresses.length > 0) {
        savedAddresses.push(addresses[0]);
        if (addresses.length > 1) {
            savedAddresses.push(addresses[1]);
        }
    }

    return { recentOrders, savedAddresses };
};

export {
    getUserById,
    updateProfileService,
    verifyOtpService,
    resendOtpService,
    verifyOldPasswordService,
    changePasswordService,
    deleteProfileImageServices,
    getProfileOtpTimerData,
    getProfileDashboardData,
    verifyCurrentOtpService,
    resendCurrentOtpService,
    getProfileCurrentOtpTimerData
};