import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'variant',
            required: false
        },
        name: {
            type: String,
            required: true
        },
        variantName: {
            type: String,
            default: ''
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        image: {
            type: String,
            default: ''
        }
    }],
    shippingAddress: {
        addressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
        streetAddress: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'home'
        }
    },
    pricing: {
        originalTotal: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        subtotal: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        shipping: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            required: true
        }
    },
    paymentMethod: {
        type: String,
       
        default: 'COD',
        required: true
    },
    shippingMethod: {
        type: String,
        enum: ['standard', 'express'],
        default: 'standard',
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending',
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending',
        required: true
    },
    estimateDate: {
        type: String,
        required: false
    },
    processingDate: {
        type: Date,
        required: false
    },
    shippedDate: {
        type: Date,
        required: false
    },
    outForDeliveryDate: {
        type: Date,
        required: false
    },
    deliveredDate: {
        type: Date,
        required: false
    },
    cancelledDate: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
