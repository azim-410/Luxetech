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


import {
    getCheckout,
    editAddress,
    addAddress,
    placeOrder,
    getOrderConfirmation
} from '../controller/user/checkoutController.js';

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

// Checkout Page
router.get('/checkout', isAuthenticated, checkIfBlocked, getCheckout);
router.post('/checkout/address/add', isAuthenticated, checkIfBlocked, addAddress);
router.post('/checkout/address/edit/:addressId', isAuthenticated, checkIfBlocked, editAddress);
router.post('/checkout/place-order', isAuthenticated, checkIfBlocked, placeOrder);
router.get('/order/success', isAuthenticated, checkIfBlocked, getOrderConfirmation);
router.post('/order/success', isAuthenticated, checkIfBlocked, getOrderConfirmation);


export default router;
