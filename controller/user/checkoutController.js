import {
    getCheckoutPageDataService,
    getCheckoutAddressDataService,
    placeOrderService,
    getOrderConfirmationService,
    getCheckoutCartDataService,
    verifyPaymentService
} from '../../services/user/checkoutService.js';
import { editAddressService, addAddressService } from '../../services/user/addressService.js';
import { getCartService } from '../../services/user/cartService.js';
import couponModel from '../../model/coupon.js';

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.redirect('/login');
        }

        let checkoutData;
        try {
            checkoutData = await getCheckoutPageDataService(userId, req.query);
        } catch (err) {
            // Cart validation errors (blocked/out-of-stock) — re-render cart with inline error
            if (err.statusCode === 400 && err.type) {
                const cartData = await getCartService(userId);
                return res.render('User/cart', {
                    cart: cartData,
                    user: req.session.user || req.user || null,
                    cartError: err.message
                });
            }
            return res.redirect('/shop');
        }

        const coupons = await couponModel.find({ status: true, expiryDate: { $gt: new Date() } }).populate('applicableCategories');

        res.render('User/cheackoutPage.ejs', {
            ...checkoutData,
            coupons,
            user: req.session.user || req.user || null,
            errors: null,
            formData: null,
            editAddressId: null,
            addErrors: null,
            addFormData: null,
            activeTab: 'saved',
            checkoutError: null
        });

    } catch (error) {
        console.error("getCheckout Error", error);
        res.status(500).send("Internal Server Error");
    }
}

const editAddress = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.redirect('/login');
        }

        const { addressId } = req.params;
        const data = req.body;

        // Call the service layer to edit and validate address data
        await editAddressService(addressId, data);

        // If successful, redirect back to checkout, preserving any query parameters
        let redirectUrl = '/checkout';
        const searchParams = new URLSearchParams(req.query).toString();
        if (searchParams) {
            redirectUrl += '?' + searchParams;
        }
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error("editAddress Error", error);

        if (error.statusCode === 400 && error.errors) {
            try {
                const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
                const checkoutData = await getCheckoutPageDataService(userId, req.query);

                const coupons = await couponModel.find({ status: true, expiryDate: { $gt: new Date() } }).populate('applicableCategories');

                return res.render('User/cheackoutPage.ejs', {
                    ...checkoutData,
                    coupons,
                    user: req.session.user || req.user || null,
                    errors: error.errors,
                    formData: req.body,
                    editAddressId: req.params.addressId,
                    addErrors: null,
                    addFormData: null,
                    activeTab: 'saved',
                    checkoutError: null
                });
            } catch (renderError) {
                console.error("Error rendering checkout page on validation failure", renderError);
                return res.status(500).send("Internal Server Error");
            }
        }

        res.status(500).send("Internal Server Error");
    }
}

const addAddress = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.redirect('/login');
        }

        const data = req.body;

        // Call the service layer to validate and save address data
        await addAddressService(userId, data);

        // If successful, redirect back to checkout, preserving any query parameters
        let redirectUrl = '/checkout';
        const searchParams = new URLSearchParams(req.query).toString();
        if (searchParams) {
            redirectUrl += '?' + searchParams;
        }
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error("addAddress Error", error);

        // Catch validation errors and render the checkout page directly with errors
        if (error.statusCode === 400 && error.errors) {
            try {
                const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
                const checkoutData = await getCheckoutPageDataService(userId, req.query);

                const coupons = await couponModel.find({ status: true, expiryDate: { $gt: new Date() } }).populate('applicableCategories');

                return res.render('User/cheackoutPage.ejs', {
                    ...checkoutData,
                    coupons,
                    user: req.session.user || req.user || null,
                    errors: null,
                    formData: null,
                    editAddressId: null,
                    addErrors: error.errors,
                    addFormData: req.body,
                    activeTab: 'new',
                    checkoutError: null
                });
            } catch (renderError) {
                console.error("Error rendering checkout page on add validation failure", renderError);
                return res.status(500).send("Internal Server Error");
            }
        }

        res.status(500).send("Internal Server Error");
    }
}

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            if (req.body.paymentMethod === 'Razorpay') {
                return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
            }
            return res.redirect('/login');
        }

        const order = await placeOrderService(userId, req.query, req.body);

        if (req.body.paymentMethod === 'Razorpay') {
            return res.status(200).json({
                success: true,
                paymentMethod: 'Razorpay',
                razorpayOrderId: order.razorpayOrderId,
                amount: Math.round(order.pricing.grandTotal * 100),
                currency: 'INR',
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                orderId: order.orderId
            });
        }

        return res.redirect(`/order/success?orderId=${order.orderId}`);
    } catch (error) {
        console.error("placeOrder Error:", error);

        if (req.body.paymentMethod === 'Razorpay') {
            return res.status(400).json({ success: false, message: error.message });
        }

        // Validation errors (blocked product / out of stock) — re-render checkout page with error
        if (error.message) {
            try {
                const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
                // Fetch addresses and raw cart separately to AVOID re-triggering
                // the blocking validation inside getCheckoutCartDataService
                const { addresses, defaultAddress } = await getCheckoutAddressDataService(userId);
                let cart;
                if (req.query.productId) {
                    cart = await getCheckoutCartDataService(userId, req.query);
                } else {
                    cart = await getCartService(userId);
                }
                const coupons = await couponModel.find({ status: true, expiryDate: { $gt: new Date() } }).populate('applicableCategories');
                return res.render('User/cheackoutPage.ejs', {
                    addresses,
                    defaultAddress,
                    cart,
                    coupons,
                    user: req.session.user || req.user || null,
                    errors: null,
                    formData: null,
                    editAddressId: null,
                    addErrors: null,
                    addFormData: null,
                    activeTab: 'saved',
                    checkoutError: error.message
                });
            } catch (renderErr) {
                console.error('placeOrder render fallback error:', renderErr);
            }
        }
        res.status(500).send("Internal Server Error: " + error.message);
    }
};

const getOrderConfirmation = async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId) {
            return res.redirect('/shop');
        }

        const order = await getOrderConfirmationService(orderId);
        if (!order) {
            return res.redirect('/shop');
        }

        res.render('User/orderconformedPage.ejs', {
            order,
            user: req.session.user || req.user || null
        });
    } catch (error) {
        console.error("getOrderConfirmation error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        const order = await verifyPaymentService(userId, req.query, req.body);

        return res.status(200).json({
            success: true,
            orderId: order.orderId
        });
    } catch (error) {
        console.error("verifyPayment Error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Payment verification failed.'
        });
    }
};

export {
    getCheckout,
    editAddress,
    addAddress,
    placeOrder,
    getOrderConfirmation,
    verifyPayment
}