import addressModal from '../../model/address.js';
import productModel from '../../model/product.js';
import variantModel from '../../model/variant.js';
import cartModal from '../../model/cart.js';
import Order from '../../model/order.js';
import { getCartService } from './cartService.js';

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
        return await getCartService(userId);
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
    const { addressId, shippingMethod, paymentMethod } = body;
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

    const shippingCost = shippingMethod === 'express' ? 150 : 0;
    const grandTotal = cart.grandTotal + shippingCost;

    // Generate unique order ID
    const orderId = `LX-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

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
            discount: cart.discount || 0,
            subtotal: cart.subtotal,
            tax: cart.tax,
            shipping: shippingCost,
            grandTotal: grandTotal
        },
        paymentMethod: paymentMethod || 'COD',
        shippingMethod: shippingMethod || 'standard',
        paymentStatus: 'Pending',
        orderStatus: 'Pending'
    });

    // Reduce variant stock
    for (const item of cart.items) {
        if (item.variantId) {
            await variantModel.findByIdAndUpdate(item.variantId, {
                $inc: { stock: -item.quantity }
            });
        }
    }

    // Clear cart if this was checking out the full cart
    if (!query.productId) {
        await cartModal.deleteOne({ userId });
    }

    return order;
};

const getOrderConfirmationService = async (orderId) => {
    return await Order.findOne({ orderId });
};

export {
    getCheckoutAddressDataService,
    getCheckoutCartDataService,
    getCheckoutPageDataService,
    placeOrderService,
    getOrderConfirmationService
};