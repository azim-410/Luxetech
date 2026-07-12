import express from 'express';
import { upload } from '../config/ cloudinary.js'
import { isAuthenticated, isLogin, checkIfBlocked, blockIfGoogleUser } from '../middleware/auth.js';
import { 
    getProfile,
    updateProfile,
    showOtpPage,
    verifyOtp,
    resendOtp,
    showChangePasswordPage,
    verifyOldPassword,      
    showNewPasswordPage,
    changePassword,
    deleteProfileImage,
    showCurrentOtpPage,
    verifyCurrentOtp,
    resendCurrentOtp,
    getWallet
 } from '../controller/user/profileController.js';  

 import {
    getAddresses,
    addAddress,
    editAddress,
    deleteAddress
 } from '../controller/user/addressController.js'
const router = express.Router();

// ─── prifile Routes ────────────────────────────────────────────── 

router.get('/profile', isAuthenticated, checkIfBlocked, getProfile);

router.post('/profile/update', isAuthenticated, checkIfBlocked, upload.single('avatar'), updateProfile);

router.get('/verify-current-email-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser, showCurrentOtpPage);
router.post('/verify-current-email-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser, verifyCurrentOtp);
router.get('/verify-current-email-otp/resend', isAuthenticated, checkIfBlocked, blockIfGoogleUser, resendCurrentOtp);

router.get('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser,  showOtpPage);
router.post('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser,  verifyOtp);
router.get('/verify-emailChange-otp/resend', isAuthenticated, checkIfBlocked, blockIfGoogleUser, resendOtp); 

router.get('/change-password', isAuthenticated, checkIfBlocked,blockIfGoogleUser, showChangePasswordPage);
router.post('/change-password/verify-old', isAuthenticated, checkIfBlocked, blockIfGoogleUser, verifyOldPassword);

router.get('/change-password/new', isAuthenticated, checkIfBlocked, blockIfGoogleUser, showNewPasswordPage);
router.post('/change-password/new', isAuthenticated, checkIfBlocked, blockIfGoogleUser, changePassword);

router.post('/profile/delete-image', isAuthenticated, checkIfBlocked, deleteProfileImage);


router.get('/address', isAuthenticated, checkIfBlocked, getAddresses);
router.post('/address/add', isAuthenticated, checkIfBlocked, addAddress);
router.post('/address/edit/:addressId', isAuthenticated, checkIfBlocked, editAddress);
router.post('/address/delete/:addressId', isAuthenticated, checkIfBlocked, deleteAddress);

router.get('/wallet', isAuthenticated, checkIfBlocked, getWallet);

export default router;  