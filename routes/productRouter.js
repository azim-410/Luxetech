import express from 'express';
import { isAuthenticated, checkIfBlocked } from '../middleware/auth.js';
import {
    getShop,
    getProductDetails,
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    addAllFromWishlistToCart
} from '../controller/user/productController.js';

const router = express.Router();

// Product Listing Page
router.get('/shop', getShop);

// Product Details Page
router.get('/product-details', getProductDetails);

// Cart Page
router.get('/cart', isAuthenticated, checkIfBlocked, getCart);
router.post('/cart/add', isAuthenticated, checkIfBlocked, addToCart);
router.post('/cart/update-quantity', isAuthenticated, checkIfBlocked, updateCartQuantity);
router.post('/cart/remove', isAuthenticated, checkIfBlocked, removeFromCart);

// Wishlist / Favorite Page
router.get('/wishlist', isAuthenticated, checkIfBlocked, getWishlist);
router.get('/favorite', isAuthenticated, checkIfBlocked, getWishlist);

// Wishlist Actions
router.post('/wishlist/add', isAuthenticated, checkIfBlocked, addToWishlist);
router.post('/wishlist/remove', isAuthenticated, checkIfBlocked, removeFromWishlist);
router.post('/wishlist/add-all-to-cart', isAuthenticated, checkIfBlocked, addAllFromWishlistToCart);

export default router;
