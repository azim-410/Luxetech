import express from "express";
import { isAdminLogin, isAdminAuthenticated } from "../middleware/adminAuth.js";
import { upload } from "../config/ cloudinary.js";
import {
  showLoginPage,
  adminLogin,
  adminLogout,
  showDashboard,
} from "../controller/admin/adminAuthController.js";
import { showAnalytics } from "../controller/admin/analyticsController.js";
import {
  getUserList,
  blockUser,
  unblockUser,
  deleteUser,
  searchUsers,
  createUser,
  exportUsers,
} from "../controller/admin/userManagementController.js";

import {
  getProductList,
  getProductAdd,
  addProduct,
  getProductEdit,
  updateProduct,
  deleteProduct,
} from "../controller/admin/productManagementController.js";

import {
  getCategoryList,
  createCategory,
  editCategory,
  deleteCategory,
  deleteCategoryImage,
  toggleCategoryVisibility,
} from "../controller/admin/categoryManagementController.js";
import {
  getOrderList,
  getOrderDetails,
  updateOrderEstimateDate,
  updateOrderStatus,
  updateOrderPaymentStatus,
  processAdminItemAction,
  exportOrders,
} from "../controller/admin/admincheckourController.js";
import {
  getCouponList,
  createCoupon,
  deleteCoupon,
  updateCoupon,
} from "../controller/admin/couponManagementController.js";

const router = express.Router();

router.get("/login", isAdminLogin, showLoginPage);
router.post("/login", isAdminLogin, adminLogin);
router.get("/logout", isAdminAuthenticated, adminLogout);
router.get("/dashboard", isAdminAuthenticated, showDashboard);
router.get("/analytics", isAdminAuthenticated, showAnalytics);

router.get("/user-management", isAdminAuthenticated, getUserList);
router.get("/user-management/export", isAdminAuthenticated, exportUsers);
router.get("/user-management/search", isAdminAuthenticated, searchUsers);
router.post("/user-management/:userId/block", isAdminAuthenticated, blockUser);
router.post(
  "/user-management/:userId/unblock",
  isAdminAuthenticated,
  unblockUser,
);
router.post(
  "/user-management/:userId/delete",
  isAdminAuthenticated,
  deleteUser,
);
router.post("/user-management/create", isAdminAuthenticated, createUser);

router.get("/product-management", isAdminAuthenticated, getProductList);
router.get("/category-management", isAdminAuthenticated, getCategoryList);
router.post(
  "/category-management/create",
  isAdminAuthenticated,
  upload.single("image"),
  createCategory,
);
router.patch(
  "/category-management/edit/:id",
  isAdminAuthenticated,
  upload.single("image"),
  editCategory,
);
router.post(
  "/category-management/delete-image/:id",
  isAdminAuthenticated,
  deleteCategoryImage,
);
router.patch(
  "/category-management/delete/:id",
  isAdminAuthenticated,
  deleteCategory,
);
router.patch(
  "/category-management/toggle-visibility/:id",
  isAdminAuthenticated,
  toggleCategoryVisibility,
);

router.get("/product-management/add", isAdminAuthenticated, getProductAdd);
router.post(
  "/product-management/add",
  isAdminAuthenticated,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  addProduct,
);
router.get(
  "/product-management/edit/:id",
  isAdminAuthenticated,
  getProductEdit,
);
router.post(
  "/product-management/edit/:id",
  isAdminAuthenticated,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        req.uploadError = err.message;
      }
      next();
    });
  },
  updateProduct,
);
router.delete(
  "/product-management/delete/:id",
  isAdminAuthenticated,
  deleteProduct,
);

router.get("/order-management", isAdminAuthenticated, getOrderList);
router.get("/order-management/export", isAdminAuthenticated, exportOrders);
router.get(
  "/order-management/details/:id",
  isAdminAuthenticated,
  getOrderDetails,
);
router.post(
  "/order-management/details/:id/update-estimate",
  isAdminAuthenticated,
  updateOrderEstimateDate,
);
router.post(
  "/order-management/details/:id/update-status",
  isAdminAuthenticated,
  updateOrderStatus,
);
router.post(
  "/order-management/details/:id/update-payment-status",
  isAdminAuthenticated,
  updateOrderPaymentStatus,
);
router.post(
  "/order-management/details/:id/item/:itemId/action",
  isAdminAuthenticated,
  processAdminItemAction,
);

router.get("/coupon-management", isAdminAuthenticated, getCouponList);
router.post("/coupon-management/create", isAdminAuthenticated, createCoupon);
router.patch("/coupon-management/edit/:id", isAdminAuthenticated, updateCoupon);
router.delete("/coupon-management/:id", isAdminAuthenticated, deleteCoupon);

export default router;
