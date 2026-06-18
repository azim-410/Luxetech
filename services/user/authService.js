import User from '../../model/userModel.js';
import OTP from '../../model/otp.js';
import bcrypt from 'bcrypt';
import { generateOTP } from '../../utils/genarateOTP.js';
import { sendOTP } from '../../utils/sendEmail.js';

// ── Validation helpers ───────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ─── REGISTER ───────────────────────────────────────────
const registerUser = async (data) => {
    const { name, email, password, confirmPassword, terms } = data;

    if (!name || !email || !password) {
        const err = new Error("All required fields missing");
        err.field = 'general';
        throw err;
    }
    const existUser = await User.findOne({name})
    console.log("registerUser",existUser)

    if(existUser){
         const err = new Error("name already taken by other user");
        err.field = 'name';
        throw err;
    }
    if (!terms) {
        const err = new Error("You must agree to the Terms and Conditions");
        err.field = 'terms';
        throw err;
    }
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
        const err = new Error("Name must contain only letters");
        err.field = 'name';
        throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const err = new Error('Please enter a valid email address');
        err.field = 'email';
        throw err;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const err = new Error('This email is already registered. Please login instead.');
        err.field = 'email';
        throw err;
    }
    if (password !== confirmPassword) {
        const err = new Error("Password and confirm password do not match");
        err.field = 'confirmPassword';
        throw err;
    }
    if (password.length < 6) {
        const err = new Error("Password must be at least 6 characters");
        err.field = 'password';
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, terms: true });
    await user.save();

    const otp = generateOTP();
    await OTP.create({ userId: user._id, otp, expiresAt: new Date(Date.now() + 4 * 60 * 1000) });

    await sendOTP(email, otp);
    return { success: true, user };
};

// ─── LOGIN ──────────────────────────────────────────────
const loginUser = async (data) => {
    const { email, password } = data;

    if (!email || !password) {
        const err = new Error("Enter Values To Forms");
        err.field = 'general';
        throw err;
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
        const err = new Error("User Not Found");
        err.field = "email";
        throw err;
    }

    if (!user.password) {
        const err = new Error("This account uses Google Sign-In. Please login with Google.");
        err.field = "general";
        throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error("Invalid credentials");
        err.field = "password";
        throw err;
    }

    if (user.isBlocked) {
        const err = new Error("Your account has been blocked by the admin. Please contact support.");
        err.field = "general";
        throw err;
    }

    return { success: true, user };
};

// ─── VERIFY REGISTRATION OTP ────────────────────────────
const verifyOtp = async (inputValue, userId) => {
    const otpRecord = await OTP.findOne({ userId });

    if (!otpRecord) throw new Error("Invalid or expired OTP");
    if (otpRecord.expiresAt < Date.now()) {
        await OTP.deleteOne({ userId });
        throw new Error("OTP expired");
    }
    if (otpRecord.otp !== inputValue) throw new Error("Invalid OTP");

    // Use $unset to fully remove the TTL field so MongoDB never auto-deletes this verified user
    await User.updateOne(
        { _id: userId },
        { $set: { isVerified: true }, $unset: { userExpire: "" } }
    );

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    await OTP.deleteOne({ userId });
    return { success: true, user };
};

// ─── RESEND REGISTRATION OTP ────────────────────────────
const resendOtpService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error('Session expired. Please register again.');
        err.code = 'USER_NOT_FOUND';
        throw err;
    }

    await OTP.deleteOne({ userId });

    const otp = generateOTP();
    await OTP.create({ userId, otp, expiresAt: new Date(Date.now() + 4 * 60 * 1000) });

    await sendOTP(user.email, otp);
    return { success: true };
};

// ── SEND PASSWORD RESET OTP ────────────────────────────
const sendPasswordResetOtpService = async (email) => {
    // Validate email presence
    if (!email || email.trim() === '') {
        const err = new Error('Email address is required.');
        err.field = 'email';
        throw err;
    }

    // Validate email format before querying the DB
    if (!EMAIL_REGEX.test(email.trim())) {
        const err = new Error('Please enter a valid email address (e.g. user@example.com).');
        err.field = 'email';
        throw err;
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) throw new Error('No account found with this email address.');

    await OTP.deleteOne({ userId: user._id });

    const otp = generateOTP();
    await OTP.create({ userId: user._id, otp, expiresAt: new Date(Date.now() + 4 * 60 * 1000) });

    await sendOTP(email, otp);
    return { success: true };
};

// ─── VERIFY RESET OTP ───────────────────────────────────
const verifyResetOtpService = async (email, otp) => {
    if (!email) throw new Error('session expired restart again');
    
    const user = await User.findOne({ email });

    if (!user) throw new Error('User not found.');

    const otpRecord = await OTP.findOne({ userId: user._id });
    if (!otpRecord) throw new Error('OTP expired. Please request a new one.');
    if (otpRecord.otp !== otp) throw new Error('Invalid OTP.');

    await OTP.deleteOne({ userId: user._id });
    return { success: true };
};

// ─── RESEND RESET OTP ───────────────────────────────────
const resendResetOtpService = async (email) => {
    if (!email) throw new Error('session expired restart again');
    const user = await User.findOne({ email });
    if (!user) throw new Error('No account found with this email address.');

    await OTP.deleteOne({ userId: user._id });

    const otp = generateOTP();
    await OTP.create({ userId: user._id, otp, expiresAt: new Date(Date.now() + 4 * 60 * 1000) });

    await sendOTP(email, otp);
    return { success: true };
};

// ─── UPDATE PASSWORD ────────────────────────────────────
const updatePasswordService = async (email, newPassword, confirmPassword) => {
    if (!newPassword) {
        const err = new Error('Password is required.');
        err.field = 'newPassword';
        throw err;
    }
    if (newPassword.length < 6) {
        const err = new Error('Password must be at least 6 characters.');
        err.field = 'newPassword';
        throw err;
    }
    if (newPassword !== confirmPassword) {
        const err = new Error('Passwords do not match.');
        err.field = 'confirmPassword';
        throw err;
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found.');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { success: true };
};

// ── OTP timer-data helper ────────────────────────────────────────
// Returns both the remaining OTP seconds AND the resend cooldown seconds.
// resendCooldownSeconds = how many seconds the user must wait before they
// can resend (60s window from createdAt). Returns 0 when wait is over.
const getOtpTimerData = async (userId) => {
    const otpRecord = await OTP.findOne({ userId });
    if (!otpRecord) return { remainingSeconds: 0, resendCooldownSeconds: 0 };

    const remainingSeconds = Math.max(
        0,
        Math.floor((new Date(otpRecord.expiresAt).getTime() - Date.now()) / 1000)
    );
    const elapsedSinceCreated = Math.floor((Date.now() - new Date(otpRecord.createdAt).getTime()) / 1000);
    const resendCooldownSeconds = Math.max(0, 60 - elapsedSinceCreated);

    return { remainingSeconds, resendCooldownSeconds };
};

export { 
    registerUser, 
    loginUser, 
    verifyOtp, 
    resendOtpService, 
    sendPasswordResetOtpService, 
    verifyResetOtpService, 
    resendResetOtpService,
    updatePasswordService,
    getOtpTimerData
};