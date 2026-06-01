import express from 'express'
import { isAdminLogin, isAdminAuthenticated } from '../middleware/adminAuth.js'
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

export default router  