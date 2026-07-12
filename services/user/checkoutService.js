import addressModal from '../../model/address.js';
import productModel from '../../model/product.js';
import variantModel from '../../model/variant.js';
import categoryModel from '../../model/category.js';
import cartModal from '../../model/cart.js';
import Order from '../../model/order.js';
import { getCartService } from './cartService.js';
import couponModel from '../../model/coupon.js';
import razorpay from '../../config/razorpay.js';
import crypto from 'crypto';
import userModel from '../../model/userModel.js';
import Transaction from '../../model/transaction.js';

const getCheckoutAddressDataService = async (userId) => {
    if (!userId) {
        return { addresses: [], defaultAddress: null };
    }

    const addresses = await addressModal.find({ userId });
    const defaultAddress = await addressModal.findOne({ userId, isDefault: true }) || addresses[0] || null;

    return {
        addresses,
        defaultAddress,
    };
};

const getCheckoutCartDataService = async (userId, query) => {
    const { productId, variantId, qty } = query;
    if (productId) {
        const product = await productModel.findById(productId);
        if (!product || product.isDeleted || product.isHidden) {
            throw new Error('Product not found or unavailable');
        }

        let variant = null;
        if (variantId) {
            variant = await variantModel.findById(variantId);
        }

        const quantity = parseInt(qty) || 1;
        const priceAdd = variant ? variant.priceAdd : 0;
        const productBasePrice = product.basePrice + priceAdd;
        const productDiscountedPrice = (product.discountedPrice > 0 ? product.discountedPrice : product.basePrice) + priceAdd;

        const itemOriginalTotal = productBasePrice * quantity;
        const itemSubtotal = productDiscountedPrice * quantity;

        const originalTotal = itemOriginalTotal;
        const subtotal = itemSubtotal;
        const discount = originalTotal - subtotal;
        const tax = Math.round(subtotal * 0.08); // 8% tax
        const grandTotal = subtotal + tax;

        let firstImage = '';
        if (variant && variant.images && variant.images.length > 0) {
            firstImage = variant.images[0];
        } else if (product.images && product.images.length > 0) {
            firstImage = product.images[0];
        }

        const items = [{
            productId: product._id,
            categoryId: product.category ? (product.category._id || product.category) : null,
            variantId: variant ? variant._id : null,
            name: product.name,
            variantName: variant ? `${variant.groupName}: ${variant.option}` : '',
            quantity: quantity,
            stock: variant ? variant.stock : 0,
            maxAllowed: 5,
            basePrice: productBasePrice,
            discountedPrice: productDiscountedPrice,
            subtotal: itemSubtotal,
            image: firstImage,
            isUnavailable: false
        }];

        return {
            items,
            originalTotal,
            discount,
            subtotal,
            tax,
            grandTotal,
            totalItems: quantity
        };
    } else {
        const cart = await getCartService(userId);

        // Validate each cart item before allowing checkout
        for (const item of cart.items) {
            // Check product availability (blocked / hidden / deleted)
            if (item.isUnavailable) {
                const err = new Error(`"${item.name}" is currently unavailable. Please remove it from your cart before proceeding.`);
                err.statusCode = 400;
                err.type = 'CART_BLOCKED';
                throw err;
            }

            // Check stock
            if (item.stock <= 0) {
                const err = new Error(`"${item.name}" is out of stock. Please remove it from your cart before proceeding.`);
                err.statusCode = 400;
                err.type = 'CART_OUT_OF_STOCK';
                throw err;
            }

            if (item.quantity > item.stock) {
                const err = new Error(`Not enough stock for "${item.name}". Only ${item.stock} unit(s) available but ${item.quantity} in cart.`);
                err.statusCode = 400;
                err.type = 'CART_INSUFFICIENT_STOCK';
                throw err;
            }
        }

        return cart;
    }
};

const getCheckoutPageDataService = async (userId, query) => {
    const { addresses, defaultAddress } = await getCheckoutAddressDataService(userId);
    const cart = await getCheckoutCartDataService(userId, query);
    return {
        addresses,
        defaultAddress,
        cart
    };
};

const placeOrderService = async (userId, query, body) => {
    const { addressId, shippingMethod, paymentMethod, couponId } = body;
    if (!addressId) {
        throw new Error('Address is required');
    }

    const address = await addressModal.findById(addressId);
    if (!address || String(address.userId) !== String(userId)) {
        throw new Error('Address not found');
    }

    const cart = await getCheckoutCartDataService(userId, query);
    if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty');
    }

    // Validate product availability and stock for all items before placing the order
    for (const item of cart.items) {
        // Re-fetch the latest product state from DB
        const product = await productModel.findById(item.productId).populate('category');
        if (!product || product.isDeleted) {
            throw new Error(`"${item.name}" is no longer available.`);
        }
        if (product.isHidden || product.status === false) {
            throw new Error(`"${item.name}" has been temporarily disabled and cannot be ordered right now.`);
        }

        // Also check if the product's category is blocked
        if (product.category && (product.category.isHidden === true || product.category.status === false)) {
            throw new Error(`"${item.name}" belongs to a category that is currently unavailable.`);
        }

        if (item.variantId) {
            const variant = await variantModel.findById(item.variantId);
            if (!variant) {
                throw new Error(`Product variant for "${item.name}" not found.`);
            }
            if (variant.stock < item.quantity) {
                throw new Error(`Insufficient stock for "${item.name}" (${item.variantName || 'Default'}). Only ${variant.stock} left.`);
            }
        }
    }

    let couponDiscount = 0;
    let coupon = null;
    if (couponId) {
        coupon = await couponModel.findById(couponId);
        if (!coupon || !coupon.status || coupon.expiryDate < new Date()) {
            throw new Error('Invalid or expired coupon');
        }
        if (cart.subtotal < coupon.minOrderValue) {
            throw new Error(`Minimum order value of ₹${coupon.minOrderValue} is required to use this coupon`);
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new Error('This coupon has reached its usage limit');
        }

        // Validate coupon applicable categories on backend
        if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
            const applicableCategoryIds = coupon.applicableCategories.map(cat => cat.toString());
            const invalidItems = [];

            for (const item of cart.items) {
                const product = await productModel.findById(item.productId);
                const itemCategoryId = product && product.category ? product.category.toString() : null;

                if (!itemCategoryId || !applicableCategoryIds.includes(itemCategoryId)) {
                    invalidItems.push(item.name);
                }
            }

            if (invalidItems.length > 0) {
                const namesStr = invalidItems.join(', ');
                throw new Error(`This coupon cannot be used for the following products in your checkout: (${namesStr}). Please remove them to proceed with this coupon.`);
            }
        }

        if (coupon.discountType === 'percentage') {
            couponDiscount = Math.round(cart.subtotal * (coupon.discountValue / 100));
        } else if (coupon.discountType === 'fixed') {
            couponDiscount = coupon.discountValue;
        }

        // Cap coupon discount to cart subtotal
        if (couponDiscount > cart.subtotal) {
            couponDiscount = cart.subtotal;
        }
    }

    const shippingCost = shippingMethod === 'express' ? 150 : 0;
    const finalDiscount = (cart.discount || 0) + couponDiscount;
    const finalGrandTotal = Math.max(0, cart.grandTotal - couponDiscount + shippingCost);

    if (paymentMethod === 'Wallet') {
        const user = await userModel.findById(userId);
        if (!user || (user.wallet || 0) < finalGrandTotal) {
            throw new Error('Insufficient wallet balance to place this order.');
        }
    }

    // Generate unique order ID
    const orderId = `LX-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    let razorpayOrderId = null;
    if (paymentMethod === 'Razorpay') {
        try {
            const rzpOrder = await razorpay.orders.create({
                amount: Math.round(finalGrandTotal * 100), // in paise
                currency: 'INR',
                receipt: orderId
            });
            razorpayOrderId = rzpOrder.id;
        } catch (error) {
            console.error("Razorpay order creation error:", error);
            throw new Error("Failed to initiate online payment transaction with Razorpay. " + (error.message || ''));
        }
    }

    const order = await Order.create({
        userId,
        orderId,
        items: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            name: item.name,
            variantName: item.variantName || '',
            quantity: item.quantity,
            price: item.discountedPrice,
            subtotal: item.subtotal,
            image: item.image || ''
        })),
        shippingAddress: {
            addressId: address._id,
            fullName: address.fullName,
            streetAddress: address.streetAddress,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            phoneNumber: address.phoneNumber,
            type: address.type || 'home'
        },
        pricing: {
            originalTotal: cart.originalTotal,
            discount: finalDiscount,
            productDiscount: cart.discount || 0,
            couponDiscount: couponDiscount,
            subtotal: cart.subtotal,
            tax: cart.tax,
            shipping: shippingCost,
            grandTotal: finalGrandTotal
        },
        couponCode: coupon ? coupon.code : undefined,
        coupon: coupon ? coupon._id : undefined,
        razorpayOrderId: razorpayOrderId,
        paymentMethod: paymentMethod || 'COD',
        shippingMethod: shippingMethod || 'standard',
        paymentStatus: paymentMethod === 'Wallet' ? 'Paid' : 'Pending',
        orderStatus: 'Pending'
    });

    // Reduce variant stock, increment coupon count, and clear cart ONLY for non-Razorpay (e.g. COD) orders initially.
    // Razorpay orders will defer these actions until payment verification is successful.
    if (paymentMethod !== 'Razorpay') {
        // Reduce variant stock
        for (const item of cart.items) {
            if (item.variantId) {
                await variantModel.findByIdAndUpdate(item.variantId, {
                    $inc: { stock: -item.quantity }
                });
            }
        }

        // Increment coupon usage count
        if (coupon) {
            const updatedCoupon = await couponModel.findByIdAndUpdate(
                coupon._id,
                { $inc: { usedCount: 1 } },
                { new: true }
            );
            if (updatedCoupon.usageLimit && updatedCoupon.usedCount >= updatedCoupon.usageLimit) {
                await couponModel.findByIdAndUpdate(coupon._id, {
                    status: false,
                    isLimitReached: true
                });
            }
        }

        // Clear cart if this was checking out the full cart
        if (!query.productId) {
            await cartModal.deleteOne({ userId });
        }

        if (paymentMethod === 'Wallet') {
            await userModel.findByIdAndUpdate(userId, {
                $inc: { wallet: -finalGrandTotal }
            });
            await Transaction.create({
                userId,
                amount: finalGrandTotal,
                type: 'debit',
                description: `Payment for order #${orderId}`,
                orderId: orderId,
                status: 'completed'
            });
        }
    }

    return order;
};

const getOrderConfirmationService = async (orderId) => {
    return await Order.findOne({ orderId });
};

const verifyPaymentService = async (userId, query, payload) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Invalid payment parameters.');
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
        throw new Error('Payment verification failed: Signature mismatch.');
    }

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
        throw new Error('Order not found.');
    }

    // If order was already processed/paid, just return it (idempotency)
    if (order.paymentStatus === 'Paid') {
        return order;
    }

    // Update payment details
    order.paymentStatus = 'Paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // Side effects: Reduce stock
    for (const item of order.items) {
        if (item.variantId) {
            await variantModel.findByIdAndUpdate(item.variantId, {
                $inc: { stock: -item.quantity }
            });
        }
    }

    // Side effects: Coupon usage
    if (order.coupon) {
        const updatedCoupon = await couponModel.findByIdAndUpdate(
            order.coupon,
            { $inc: { usedCount: 1 } },
            { new: true }
        );
        if (updatedCoupon && updatedCoupon.usageLimit && updatedCoupon.usedCount >= updatedCoupon.usageLimit) {
            await couponModel.findByIdAndUpdate(order.coupon, {
                status: false,
                isLimitReached: true
            });
        }
    }

    // Side effects: Clear cart (if NOT a single-product purchase)
    if (!query.productId) {
        await cartModal.deleteOne({ userId });
    }

    return order;
};

export {
    getCheckoutAddressDataService,
    getCheckoutCartDataService,
    getCheckoutPageDataService,
    placeOrderService,
    getOrderConfirmationService,
    verifyPaymentService
};