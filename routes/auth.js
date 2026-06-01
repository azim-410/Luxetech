import express from 'express';
import passport from 'passport';
import {
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
} from '../controller/user/authController.js';
import { isAuthenticated, isLogin, checkIfBlocked } from '../middleware/auth.js';

const router = express.Router();

// ─── PAGES ──────────────────────────────────────────────
router.get('/',                 (req, res) => res.render('User/landing'));
router.get('/register',         isLogin, registerPage);
router.get('/login',            isLogin, loginPage);

// ─── GOOGLE AUTH ─────────────────────────────────────────
router.get('/auth/google', (req, res, next) => {
    req.session.authSource = req.query.source || 'login';
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    googleCallback
);

// ─── REGISTER & LOGIN ───────────────────────────────────
router.post('/register',isLogin, register);
router.post('/login', isLogin,login);
router.post('/logout', isAuthenticated, checkIfBlocked, logout);

// ─── REGISTRATION OTP ───────────────────────────────────
router.get('/otp',              isLogin, otpPage);
router.post('/verify-otp',      isLogin, otp);
router.post('/resend-otp',      isLogin, resendOtp);

// ─── FORGOT PASSWORD ────────────────────────────────────
router.get('/forget-password',  isLogin, forgotPasswordPage);
router.post('/forget-password', isLogin, forgotPasswordController);

// ─── RESET OTP ──────────────────────────────────────────
router.get('/verify-reset-otp',  isLogin, verifyResetOtpPage);
router.post('/verify-reset-otp', isLogin, verifyResetOtpController);
router.post('/resend-reset-otp', isLogin, resendResetOtp);

// ─── RESET PASSWORD ─────────────────────────────────────
router.get('/reset-password',    isLogin, resetPasswordPage);
router.post('/reset-password',   isLogin, updatePasswordController);

export default router;