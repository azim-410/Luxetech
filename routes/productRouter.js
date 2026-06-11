import express from 'express';
import { isAuthenticated, checkIfBlocked } from '../middleware/auth.js';
import {
    getShop,
    getProductDetails,
    getCart,
    getWishlist
} from '../controller/user/productController.js';

const router = express.Router();

// Product Listing Page
router.get('/shop', getShop);

// Product Details Page
router.get('/product-details', getProductDetails);

// Cart Page
router.get('/cart', isAuthenticated, checkIfBlocked, getCart);

// Wishlist / Favorite Page
router.get('/wishlist', isAuthenticated, checkIfBlocked, getWishlist);
router.get('/favorite', isAuthenticated, checkIfBlocked, getWishlist);

export default router;
