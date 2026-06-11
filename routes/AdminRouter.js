import express from 'express'
import { isAdminLogin, isAdminAuthenticated } from '../middleware/adminAuth.js'
import { upload } from '../config/ cloudinary.js'
import {
    showLoginPage,
    adminLogin,
    adminLogout,
    showDashboard,
} from '../controller/admin/adminAuthController.js'
import {
    getUserList,
    blockUser,
    unblockUser,
    deleteUser,
    searchUsers,
    createUser
} from '../controller/admin/userManagementController.js';

import {
    getProductList,
    getProductAdd,
    addProduct,
    getProductEdit,
    updateProduct,
    deleteProduct
} from '../controller/admin/productManagementController.js';

import {
    getCategoryList,
    createCategory,
    editCategory,
    deleteCategory,
    deleteCategoryImage,
    toggleCategoryVisibility
} from '../controller/admin/categoryManagementController.js';

const router = express.Router()

router.get('/login', isAdminLogin, showLoginPage);
router.post('/login', isAdminLogin, adminLogin);
router.get('/logout', isAdminAuthenticated, adminLogout);
router.get('/dashboard', isAdminAuthenticated, showDashboard);


router.get('/user-management', isAdminAuthenticated, getUserList)
router.get('/user-management/search', isAdminAuthenticated, searchUsers)
router.post('/user-management/:userId/block', isAdminAuthenticated, blockUser)
router.post('/user-management/:userId/unblock', isAdminAuthenticated, unblockUser)
router.post('/user-management/:userId/delete', isAdminAuthenticated, deleteUser);
router.post('/user-management/create', isAdminAuthenticated, createUser);


router.get('/product-management', isAdminAuthenticated, getProductList)
router.get('/category-management', isAdminAuthenticated, getCategoryList)
router.post('/category-management/create', isAdminAuthenticated, upload.single('image'), createCategory)
router.patch('/category-management/edit/:id', isAdminAuthenticated, upload.single('image'), editCategory)
router.post('/category-management/delete-image/:id', isAdminAuthenticated, deleteCategoryImage)
router.patch('/category-management/delete/:id',isAdminAuthenticated,deleteCategory)
router.patch('/category-management/toggle-visibility/:id', isAdminAuthenticated, toggleCategoryVisibility)

router.get('/product-management/add',isAdminAuthenticated,getProductAdd);
router.post('/product-management/add', isAdminAuthenticated, (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message 
            });
        }
        next();
    });
}, addProduct);
router.get('/product-management/edit/:id', isAdminAuthenticated, getProductEdit);
router.post('/product-management/edit/:id', isAdminAuthenticated, (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            req.uploadError = err.message;
        }
        next();
    });
}, updateProduct);
router.delete('/product-management/delete/:id', isAdminAuthenticated, deleteProduct);
export default router  