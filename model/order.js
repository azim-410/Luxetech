import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "variant",
          required: false,
        },
        name: {
          type: String,
          required: true,
        },
        variantName: {
          type: String,
          default: "",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          default: "",
        },
        status: {
          type: String,
          enum: [
            "Ordered",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Return Confirmed",
            "Replacement Confirmed",
            "Returned",
            "Replaced",
          ],
          default: "Ordered",
        },
        returnReason: {
          type: String,
          required: false,
        },
        returnComments: {
          type: String,
          required: false,
        },
        returnResolution: {
          type: String,
          required: false,
        },
        returnMethod: {
          type: String,
          required: false,
        },
        cancellationReason: {
          type: String,
          required: false,
        },
        cancellationComments: {
          type: String,
          required: false,
        },
        cancelledDate: {
          type: Date,
          required: false,
        },
        returnRequestDate: {
          type: Date,
          required: false,
        },
        returnConfirmedDate: {
          type: Date,
          required: false,
        },
        returnedDate: {
          type: Date,
          required: false,
        },
        paymentReturned: {
          type: Boolean,
          default: false,
        },
      },
    ],
    shippingAddress: {
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      },
      streetAddress: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        default: "home",
      },
    },
    pricing: {
      originalTotal: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
      productDiscount: {
        type: Number,
        default: 0,
      },
      couponDiscount: {
        type: Number,
        default: 0,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number,
        required: true,
      },
      shipping: {
        type: Number,
        default: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
      },
      refundedAmount: {
        type: Number,
        default: 0,
      },
    },
    couponCode: {
      type: String,
      required: false,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      required: false,
    },
    razorpayOrderId: {
      type: String,
      required: false,
    },
    razorpayPaymentId: {
      type: String,
      required: false,
    },
    razorpaySignature: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      default: "COD",
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Return Confirmed",
        "Replacement Confirmed",
        "Returned",
        "Replaced",
      ],
      default: "Pending",
      required: true,
    },
    estimateDate: {
      type: String,
      required: false,
    },
    processingDate: {
      type: Date,
      required: false,
    },
    shippedDate: {
      type: Date,
      required: false,
    },
    outForDeliveryDate: {
      type: Date,
      required: false,
    },
    deliveredDate: {
      type: Date,
      required: false,
    },
    cancelledDate: {
      type: Date,
      required: false,
    },
    cancellationReason: {
      type: String,
      required: false,
    },
    cancellationComments: {
      type: String,
      required: false,
    },
    returnRequestDate: {
      type: Date,
      required: false,
    },
    returnConfirmedDate: {
      type: Date,
      required: false,
    },
    returnedDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Partial TTL index to match the index in MongoDB Atlas (auto-delete unpaid Razorpay orders after 15 minutes)
orderSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 900,
    partialFilterExpression: {
      paymentStatus: "Pending",
      paymentMethod: "Razorpay",
    },
  },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
