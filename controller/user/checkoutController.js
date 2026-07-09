import {
    getCheckoutPageDataService,
    placeOrderService,
    getOrderConfirmationService
} from '../../services/user/checkoutService.js';
import { editAddressService, addAddressService } from '../../services/user/addressService.js';
import { getCartService } from '../../services/user/cartService.js';

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

        res.render('User/cheackoutPage.ejs', {
            ...checkoutData,
            user: req.session.user || req.user || null,
            errors: null,
            formData: null,
            editAddressId: null,
            addErrors: null,
            addFormData: null,
            activeTab: 'saved'
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

        // Catch validation errors and render the checkout page directly with errors
        if (error.statusCode === 400 && error.errors) {
            try {
                const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
                const checkoutData = await getCheckoutPageDataService(userId, req.query);

                return res.render('User/cheackoutPage.ejs', {
                    ...checkoutData,
                    user: req.session.user || req.user || null,
                    errors: error.errors,
                    formData: req.body,
                    editAddressId: req.params.addressId,
                    addErrors: null,
                    addFormData: null,
                    activeTab: 'saved'
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

                return res.render('User/cheackoutPage.ejs', {
                    ...checkoutData,
                    user: req.session.user || req.user || null,
                    errors: null,
                    formData: null,
                    editAddressId: null,
                    addErrors: error.errors,
                    addFormData: req.body,
                    activeTab: 'new'
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
            return res.redirect('/login');
        }

        const order = await placeOrderService(userId, req.query, req.body);

        return res.redirect(`/order/success?orderId=${order.orderId}`);
    } catch (error) {
        console.error("placeOrder Error:", error);
        // Product availability or stock errors — re-render cart with inline error
        if (error.message) {
            try {
                const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
                const cartData = await getCartService(userId);
                return res.render('User/cart', {
                    cart: cartData,
                    user: req.session.user || req.user || null,
                    cartError: error.message
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

export {
    getCheckout,
    editAddress,
    addAddress,
    placeOrder,
    getOrderConfirmation
}