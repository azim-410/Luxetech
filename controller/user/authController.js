import { 
    registerUser, 
    loginUser, 
    verifyOtp, 
    resendOtpService, 
    sendPasswordResetOtpService, 
    verifyResetOtpService, 
    updatePasswordService,
    resendResetOtpService
} from "../../services/user/authService.js";

// ─── REGISTER ───────────────────────────────────────────
const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);
        req.session.userId = user.user._id;
        res.redirect('/otp');
    } catch (error) {
        console.error("Register Error:", error.message);
        res.status(400).render('User/auth/register', {
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
        res.redirect('/');
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(400).render('User/auth/login', {
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
        res.redirect('/');
    });
};

// ─── VERIFY REGISTRATION OTP ────────────────────────────
const otp = async (req, res) => {
    try {
        const inputValue = Object.values(req.body).join('');
        const userId = req.session.userId;
        await verifyOtp(inputValue, userId);
        res.redirect('/login');
    } catch (error) {
        console.error('OTP Error:', error.message);
        res.status(400).render('User/auth/otp-verification', {
            errorMessage: error.message,
            actionUrl: '/verify-otp'
        });
    }
};

// ─── RESEND REGISTRATION OTP ────────────────────────────
const resendOtp = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Session expired. Please register again.' });
        }
        await resendOtpService(userId);
        return res.status(200).json({ success: true, message: 'OTP resent successfully.' });
    } catch (error) {
        console.error("Resend OTP Error:", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to resend OTP." });
    }
};

// ─── FORGOT PASSWORD ────────────────────────────────────
const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        await sendPasswordResetOtpService(email);
        req.session.resetEmail = email;
        res.redirect('/verify-reset-otp');
    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        res.render('User/auth/forget-password', { errorMessage: error.message, });
    }
};

// ─── VERIFY RESET OTP ───────────────────────────────────
const verifyResetOtpController = async (req, res) => {
    try {
        const otp = Object.values(req.body).join('');
        const email = req.session.resetEmail;

        await verifyResetOtpService(email, otp);
        req.session.canResetPassword = true;
        res.redirect('/reset-password');
    } catch (error) {
        console.error("Verify Reset OTP Error:", error.message);
        res.render('User/auth/otp-verification', {
            errorMessage: error.message,
            actionUrl: '/verify-reset-otp',
            resendUrl:'/resend-reset-otp'
        });
    }
};

// ─── RESEND RESET OTP ───────────────────────────────────
const resendResetOtp = async (req, res) => {
    try {
        const email = req.session.resetEmail;

        await resendResetOtpService(email);

        return res.render('User/auth/otp-verification', {
            successMessage: 'OTP resent successfully.',
            actionUrl: '/verify-reset-otp',
            resendUrl: '/resend-reset-otp'
        });

    } catch (error) {
        console.error("Resend Reset OTP Error:", error.message);
        return res.render('User/auth/otp-verification', {
            errorMessage: error.message,
            actionUrl: '/verify-reset-otp',
            resendUrl: '/resend-reset-otp'
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
                errorMessage: 'Something went wrong. Please restart the process.'
            });
        }

        await updatePasswordService(email, newPassword, confirmPassword);

        req.session.resetEmail = null;
        req.session.canResetPassword = null;

        res.redirect('/login');
    } catch (error) {
        console.error("Update Password Error:", error.message);
        res.render('User/auth/reset-password', { 
            errorMessage: error.message 
        });
    }
};

export { 
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
