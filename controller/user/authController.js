import { 
    registerUser, 
    loginUser, 
    verifyOtp, 
    resendOtpService, 
    sendPasswordResetOtpService, 
    verifyResetOtpService, 
    updatePasswordService,
    resendResetOtpService,
    getOtpTimerData
} from "../../services/user/authService.js";

// ─── PAGE RENDERS ─────────────────────────────────────────
const registerPage = (req, res) => {
    const googleError = req.session.googleError || null;
    req.session.googleError = null;
    const expiredMessage = req.query.expired === '1'
        ? 'Your registration session expired (12 minutes). Please register again.'
        : null;
    return res.render('User/auth/register', { googleError, expiredMessage });
};

const loginPage = (req, res) => {
    const blocked = req.query.blocked === '1';
    return res.render('User/auth/login', {
        errorMessage: blocked ? 'Your account has been blocked by the admin. Please contact support.' : null,
        errorField:   blocked ? 'general' : null,
        formData: {}
    });
};

const otpPage = async (req, res) => {
    const userId = req.session.userId;
    const { remainingSeconds, resendCooldownSeconds } = userId
        ? await getOtpTimerData(userId)
        : { remainingSeconds: 0, resendCooldownSeconds: 0 };
    return res.render('User/auth/otp-verification', {
        actionUrl:             '/verify-otp',
        resendUrl:             '/resend-otp',
        errorMessage:          null,
        successMessage:        null,
        remainingSeconds,
        resendCooldownSeconds
    });
};

const forgotPasswordPage = (req, res) => {
    return res.render('User/auth/forget-password');
};

const verifyResetOtpPage = async (req, res) => {
    const userId = req.session.resetEmail
        ? (await (await import('../../model/userModel.js')).default.findOne({ email: req.session.resetEmail }))?._id
        : null;
    const { remainingSeconds, resendCooldownSeconds } = userId
        ? await getOtpTimerData(userId)
        : { remainingSeconds: 0, resendCooldownSeconds: 0 };
    return res.render('User/auth/otp-verification', {
        actionUrl:             '/verify-reset-otp',
        resendUrl:             '/resend-reset-otp',
        errorMessage:          null,
        successMessage:        null,
        remainingSeconds,
        resendCooldownSeconds
    });
};

const resetPasswordPage = (req, res) => {
    if (!req.session.canResetPassword) {
        return res.redirect('/forget-password');
    }
    return res.render('User/auth/reset-password', { actionUrl: '/reset-password' });
};

// ─── REGISTER ───────────────────────────────────────────
const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);
        req.session.userId = user.user._id;
        return res.redirect('/otp');
    } catch (error) {
        console.error("Register Error:", error.message);
        return res.status(400).render('User/auth/register', {
            errorMessage: error.message,
            errorField: error.field || 'general',
            formData: req.body
        });
    }
};

// ─── LOGIN ──────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const result = await loginUser(req.body);
        req.session.user = {
            id: result.user._id,
            email: result.user.email
        };
        return res.redirect('/');
    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(400).render('User/auth/login', {
            errorMessage: error.message,
            errorField: error.field,
            formData: req.body
        });
    }
};

// ─── LOGOUT ─────────────────────────────────────────────
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).redirect('/');
        }
        res.clearCookie('connect.sid');
        return res.redirect('/');
    });
};

// ─── VERIFY REGISTRATION OTP ────────────────────────────
const otp = async (req, res) => {
    try {
        const inputValue = Object.values(req.body).join('');
        const userId = req.session.userId;

        // Guard: session may be lost after server restart or expiry
        if (!userId) {
            return res.status(400).render('User/auth/otp-verification', {
                errorMessage: 'Session expired. Please register again.',
                successMessage: null,
                actionUrl: '/verify-otp',
                resendUrl: '/resend-otp'
            });
        }

        await verifyOtp(inputValue, userId);
        return res.redirect('/login');
    } catch (error) {
        console.error('OTP Error:', error.message);
        const { remainingSeconds, resendCooldownSeconds } = req.session.userId
            ? await getOtpTimerData(req.session.userId)
            : { remainingSeconds: 0, resendCooldownSeconds: 0 };
        return res.status(400).render('User/auth/otp-verification', {
            errorMessage:          error.message,
            successMessage:        null,
            actionUrl:             '/verify-otp',
            resendUrl:             '/resend-otp',
            remainingSeconds,
            resendCooldownSeconds
        });
    }
};

// ─── RESEND REGISTRATION OTP ────────────────────────────
const resendOtp = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).render('User/auth/otp-verification', {
                actionUrl: '/verify-otp',
                resendUrl: '/resend-otp',
                errorMessage: 'Session expired. Please register again.',
                successMessage: null
            });
        }
        await resendOtpService(userId);
        const { remainingSeconds, resendCooldownSeconds } = await getOtpTimerData(userId);
        return res.render('User/auth/otp-verification', {
            actionUrl:             '/verify-otp',
            resendUrl:             '/resend-otp',
            errorMessage:          null,
            successMessage:        'OTP resent successfully.',
            remainingSeconds,
            resendCooldownSeconds
        });
    } catch (error) {
        console.error("Resend OTP Error:", error.message);

        // User was deleted by TTL — their 12-minute window expired
        if (error.code === 'USER_NOT_FOUND') {
            return res.redirect('/register?expired=1');
        }

        const { remainingSeconds, resendCooldownSeconds } = req.session.userId
            ? await getOtpTimerData(req.session.userId)
            : { remainingSeconds: 0, resendCooldownSeconds: 0 };
        return res.status(500).render('User/auth/otp-verification', {
            actionUrl:             '/verify-otp',
            resendUrl:             '/resend-otp',
            errorMessage:          error.message || "Failed to resend OTP.",
            successMessage:        null,
            remainingSeconds,
            resendCooldownSeconds
        });
    }
};

// ─── FORGOT PASSWORD ────────────────────────────────────
const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        await sendPasswordResetOtpService(email);
        req.session.resetEmail = email;
        return res.redirect('/verify-reset-otp');
    } catch (error) {
        console.error('Forgot Password Error:', error.message);
        return res.render('User/auth/forget-password', {
            errorMessage: error.message,
            errorField:   error.field || 'email',
            formData:     req.body
        });
    }
};

// ─── VERIFY RESET OTP ───────────────────────────────────
const verifyResetOtpController = async (req, res) => {
    try {
        const otp = Object.values(req.body).join('');
        const email = req.session.resetEmail;

        await verifyResetOtpService(email, otp);
        req.session.canResetPassword = true;
        return res.redirect('/reset-password');
    } catch (error) {
        console.error("Verify Reset OTP Error:", error.message);
        const User = (await import('../../model/userModel.js')).default;
        const user = req.session.resetEmail ? await User.findOne({ email: req.session.resetEmail }) : null;
        const { remainingSeconds, resendCooldownSeconds } = user
            ? await getOtpTimerData(user._id)
            : { remainingSeconds: 0, resendCooldownSeconds: 0 };
        return res.render('User/auth/otp-verification', {
            errorMessage:          error.message,
            successMessage:        null,
            actionUrl:             '/verify-reset-otp',
            resendUrl:             '/resend-reset-otp',
            remainingSeconds,
            resendCooldownSeconds
        });
    }
};

// ─── RESEND RESET OTP ───────────────────────────────────
const resendResetOtp = async (req, res) => {
    try {
        const email = req.session.resetEmail;

        await resendResetOtpService(email);
        const User = (await import('../../model/userModel.js')).default;
        const user = email ? await User.findOne({ email }) : null;
        const { remainingSeconds, resendCooldownSeconds } = user
            ? await getOtpTimerData(user._id)
            : { remainingSeconds: 0, resendCooldownSeconds: 0 };
        return res.render('User/auth/otp-verification', {
            errorMessage:          null,
            successMessage:        'OTP resent successfully.',
            actionUrl:             '/verify-reset-otp',
            resendUrl:             '/resend-reset-otp',
            remainingSeconds,
            resendCooldownSeconds
        });

    } catch (error) {
        console.error("Resend Reset OTP Error:", error.message);
        return res.render('User/auth/otp-verification', {
            errorMessage:          error.message,
            successMessage:        null,
            actionUrl:             '/verify-reset-otp',
            resendUrl:             '/resend-reset-otp',
            remainingSeconds:      0,
            resendCooldownSeconds: 0
        });
    }
};

// ─── UPDATE PASSWORD ────────────────────────────────────
const updatePasswordController = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const email = req.session.resetEmail;

        if (!email || !req.session.canResetPassword) {
            return res.render('User/auth/reset-password', {
                actionUrl: '/reset-password',
                errorMessage: 'Something went wrong. Please restart the process.'
            });
        }

        await updatePasswordService(email, newPassword, confirmPassword);

        req.session.resetEmail = null;
        req.session.canResetPassword = null;

        return res.redirect('/login');
    } catch (error) {
        console.error("Update Password Error:", error.message);
        return res.render('User/auth/reset-password', { 
            actionUrl: '/reset-password',
            errorMessage: error.message 
        });
    }
};

// ─── GOOGLE CALLBACK ─────────────────────────────────────────
const googleCallback = (req, res) => {
    const source = req.session.authSource || 'login';
    req.session.authSource = null;

    // Block existing users coming from the register page
    if (source === 'register' && req.session.googleConflict) {
        req.session.googleConflict = false;
        // Log out passport user, then set error and redirect
        req.logout(() => {
            req.session.googleError = 'This Google account is already registered. Please login instead.';
            req.session.save(() => res.redirect('/register'));
        });
        return;
    }

    req.session.user = { id: req.user._id, email: req.user.email };
    return res.redirect('/');
};

export { 
    registerPage,
    loginPage,
    otpPage,
    forgotPasswordPage,
    verifyResetOtpPage,
    resetPasswordPage,
    googleCallback,
    register, 
    login, 
    logout, 
    otp, 
    resendOtp, 
    forgotPasswordController, 
    verifyResetOtpController, 
    resendResetOtp,
    updatePasswordController 
};
