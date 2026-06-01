import userModel from '../../model/userModel.js';
import tempUserModel from '../../model/tempUser.js';
import { generateOTP } from '../../utils/genarateOTP.js';
import { sendOTP } from '../../utils/sendEmail.js';
import bcrypt from 'bcrypt'

const getUserById = async (userId) => {
    const user = await userModel.findById(userId).select('-password');
    // console.log("user from service",user);
    return user;
}

const updateProfileService = async (userId, name, email) => {

    const currentUser = await getUserById(userId);

    if (!name || name.trim() === '') {
        const error = new Error('Name cannot be empty');
        throw error;
    }
    if (name.trim().length < 3) {
        const error = new Error('Name must be at least 3 characters');
        throw error;
    }

    if (!email || email.trim() === '') {
        const error = new Error('Email cannot be empty');
        throw error;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        const error = new Error('Invalid email format');
        throw error;
    }

    const namechange = name.trim() !== currentUser.name;
    const emailchange = email.trim() !== currentUser.email;

    if (!namechange && !emailchange) {
        const error = new Error('No changes detected');
        throw error;
    }

    if (namechange && !emailchange) {
        await userModel.findByIdAndUpdate(userId, { name: name.trim() });
        return { success: true, requiresOtp: false, message: 'Profile updated successfully' };
    }
    const isExistEmail = await userModel.findOne({ email: email.trim() });
    if (isExistEmail) {
        const error = new Error('Email already in use');
        throw error;
    }

    const existingTempUser = await tempUserModel.findOne({ userId });
    if (existingTempUser) {
        await tempUserModel.deleteMany({userId})
    }

    const otp = generateOTP();
    const expireOtp = new Date(Date.now() + 1000 * 60 * 10);
    console.log(" otp 1:", otp)
    const tempUser = new tempUserModel({
        userId,
        name: name.trim(),
        tempEmail: email.trim(),
        tempEmailOtp: otp,
        emailOtpExpiry: expireOtp
    });
    await tempUser.save();
    console.log(" otp 2:", otp)
    await sendOTP(email.trim(), otp);
    console.log(" otp 3:", otp)
    return { success: true, requiresOtp: true, message: 'OTP sent to new email. Please verify to update profile.' };
}

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
    const expireOtp = new Date(Date.now() + 1000 * 60 * 10);

    console.log("Resent otp 1:", otp)
    await tempUserModel.findOneAndUpdate(
        { userId },
        { tempEmailOtp: otp, emailOtpExpiry: expireOtp },
        { new: true }
    );
    console.log("Resent otp 2:", otp)
    await sendOTP(tempUser.tempEmail, otp);
    console.log("Resent otp 3:", otp)
    return { success: true, message: 'New OTP sent successfully' };
};


const verifyOldPasswordService = async (userId, oldPassword) => {

    if (!oldPassword) throw new Error('Password is required');

    const user = await userModel.findById(userId); 
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Incorrect password');

    return { success: true };
};


const changePasswordService = async (userId, newPassword, confirmPassword) => {
    if (!newPassword || !confirmPassword) throw new Error('All fields are required');

    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');

    if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found');

    if (await bcrypt.compare(newPassword, user.password)) {
        throw new Error('New password must be different from old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    return { success: true };
};


export {
    getUserById,
    updateProfileService,
    verifyOtpService,
    resendOtpService,
    verifyOldPasswordService,
    changePasswordService
}