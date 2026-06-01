import express from 'express';
import { isAuthenticated, isLogin, checkIfBlocked } from '../middleware/auth.js';
import { 
    getProfile,
    updateProfile,
    showOtpPage,
    verifyOtp,
    resendOtp,
    showChangePasswordPage,
    verifyOldPassword,      
    showNewPasswordPage,
    changePassword    

 } from '../controller/user/profileController.js';  
const router = express.Router();

// ─── PAGES ────────────────────────────────────────────── 

router.get('/profile', isAuthenticated, checkIfBlocked, getProfile);
router.get('/favorite', isAuthenticated, checkIfBlocked, (req, res) => res.render('User/favorite'));
router.get('/cart', isAuthenticated, checkIfBlocked, (req, res) => res.render('User/cart'));

router.post('/profile/update', isAuthenticated, checkIfBlocked, updateProfile);
router.get('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, showOtpPage);
router.post('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, verifyOtp);

router.post('/verify-emailChange-otp/resend', isAuthenticated, checkIfBlocked, resendOtp); 

router.get('/change-password', isAuthenticated, checkIfBlocked, showChangePasswordPage);
router.post('/change-password/verify-old', isAuthenticated, checkIfBlocked, verifyOldPassword);

router.get('/change-password/new', isAuthenticated, checkIfBlocked, showNewPasswordPage);
router.post('/change-password/new', isAuthenticated, checkIfBlocked, changePassword);
export default router;  