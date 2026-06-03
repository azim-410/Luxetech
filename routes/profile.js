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
router.get('/favorite', isAuthenticated, checkIfBlocked, (req, res) => res.render('User/favorite'));
router.get('/cart', isAuthenticated, checkIfBlocked, (req, res) => res.render('User/cart'));

router.post('/profile/update', isAuthenticated, checkIfBlocked, upload.single('avatar'), updateProfile);
router.get('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser,  showOtpPage);
router.post('/verify-emailChange-otp', isAuthenticated, checkIfBlocked, blockIfGoogleUser,  verifyOtp);

router.post('/verify-emailChange-otp/resend', isAuthenticated, checkIfBlocked, blockIfGoogleUser, resendOtp); 

router.get('/change-password', isAuthenticated, checkIfBlocked,blockIfGoogleUser, showChangePasswordPage);
router.post('/change-password/verify-old', isAuthenticated, checkIfBlocked, blockIfGoogleUser, verifyOldPassword);

router.get('/change-password/new', isAuthenticated, checkIfBlocked, blockIfGoogleUser, showNewPasswordPage);
router.post('/change-password/new', isAuthenticated, checkIfBlocked, blockIfGoogleUser, changePassword);

router.post('/profile/delete-image', isAuthenticated, checkIfBlocked, deleteProfileImage);


router.get('/address', isAuthenticated, checkIfBlocked, getAddresses);
router.post('/address/add', isAuthenticated, checkIfBlocked, addAddress);
router.post('/address/edit/:addressId', isAuthenticated, checkIfBlocked, editAddress);
router.post('/address/delete/:addressId', isAuthenticated, checkIfBlocked, deleteAddress);

export default router;  