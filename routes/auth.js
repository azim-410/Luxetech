import express from 'express';
import { 
    register, 
    login, 
    logout, 
    otp, 
    resendOtp, 
    forgotPasswordController, 
    verifyResetOtpController, 
    resendResetOtp,
    updatePasswordController 
} from '../controller/user/authController.js';
import { isAuthenticated, isLogin } from '../middleware/auth.js';

const router = express.Router();

// ─── PAGES ──────────────────────────────────────────────
router.get('/', (req, res) => res.render('User/landing'));
router.get('/register', isLogin, (req, res) => res.render('User/auth/register'));
router.get('/login', isLogin, (req, res) => res.render('User/auth/login'));

router.get('/favorite', isAuthenticated, (req, res) => res.render('User/favorite'));
router.get('/cart', isAuthenticated, (req, res) => res.render('User/cart'));
router.get('/profile', isAuthenticated, (req, res) => res.render('User/profile'));

// ─── REGISTER & LOGIN ───────────────────────────────────
router.post('/register', isLogin, register);
router.post('/login', isLogin, login);
router.post('/logout', isAuthenticated, logout);

// ─── REGISTRATION OTP ───────────────────────────────────
router.get('/otp', isLogin, (req, res) => res.render('User/auth/otp-verification', { 
    actionUrl: '/verify-otp', 
    resendUrl: '/resend-otp' 
}));
router.post('/verify-otp', isLogin, otp);
router.post('/resend-otp', isLogin, resendOtp);

// ─── FORGOT PASSWORD ────────────────────────────────────
router.get('/forget-password', isLogin, (req, res) => res.render('User/auth/forget-password'));
router.post('/forget-password', isLogin, forgotPasswordController);

// ─── RESET OTP ──────────────────────────────────────────
router.get('/verify-reset-otp', isLogin, (req, res) => res.render('User/auth/otp-verification', { 
    actionUrl: '/verify-reset-otp', 
    resendUrl: '/resend-reset-otp' 
}));
router.post('/verify-reset-otp', isLogin, verifyResetOtpController);
router.post('/resend-reset-otp', isLogin, resendResetOtp);

// ─── RESET PASSWORD ─────────────────────────────────────
router.get('/reset-password', isLogin, (req, res) => {
    if (!req.session.canResetPassword) {
        return res.redirect('/forget-password');
    }
    res.render('User/auth/reset-password');
});
router.post('/reset-password', isLogin, updatePasswordController);

export default router;