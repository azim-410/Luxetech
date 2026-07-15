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
    getOrderConfirmation,
    verifyPayment
} from '../controller/user/checkoutController.js';

import { getOrdersPage, getTrackingPage, cancelOrder, getReturnPage, processReturn } from '../controller/user/orderController.js';
import { getOffersPage } from '../controller/user/offersController.js';

const router = express.Router();

// Offers Page
router.get('/offers', getOffersPage);

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
router.post('/checkout/verify-payment', isAuthenticated, checkIfBlocked, verifyPayment);
router.get('/order/success', isAuthenticated, checkIfBlocked, getOrderConfirmation);
router.post('/order/success', isAuthenticated, checkIfBlocked, getOrderConfirmation);

// User Orders Page
router.get('/orders', isAuthenticated, checkIfBlocked, getOrdersPage);
router.get('/orders/track/:orderId', isAuthenticated, checkIfBlocked, getTrackingPage);
router.post('/orders/cancel/:orderId', isAuthenticated, checkIfBlocked, cancelOrder);
router.get('/orders/return/:orderId', isAuthenticated, checkIfBlocked, getReturnPage);
router.post('/orders/return/:orderId', isAuthenticated, checkIfBlocked, processReturn);


export default router;
