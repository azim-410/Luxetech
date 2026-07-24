import Order from "../../model/order.js";
import variantModel from "../../model/variant.js";
import User from "../../model/userModel.js";
import Transaction from "../../model/transaction.js";
import razorpay from "../../config/razorpay.js";

const getUserOrdersService = async (userId) => {
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders;
  } catch (error) {
    console.error("getUserOrdersService error:", error);
    throw error;
  }
};

const getOrderByIdService = async (orderId, userId) => {
  try {
    const order = await Order.findOne({ _id: orderId, userId });
    return order;
  } catch (error) {
    console.error("getOrderByIdService error:", error);
    throw error;
  }
};

const cancelOrderService = async (
  orderId,
  userId,
  cancelItemIds,
  reason,
  comments,
) => {
  try {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new Error("Order not found");
    }

    const originalGrandTotal = order.pricing.grandTotal;
    const originalPaymentStatus = order.paymentStatus;

    // Block cancellation if order is Razorpay and has a pending payment status
    if (
      order.paymentMethod === "Razorpay" &&
      order.paymentStatus === "Pending"
    ) {
      throw new Error(
        "This order cannot be cancelled because the payment is pending. Please complete the payment or retry first.",
      );
    }

    // Validate order status
    const nonCancellableStatuses = [
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
      "Replaced",
    ];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      throw new Error(
        `Order cannot be cancelled because it is already ${order.orderStatus}`,
      );
    }

    if (!cancelItemIds || cancelItemIds.length === 0) {
      throw new Error("No items selected for cancellation");
    }

    let updatedAny = false;
    let refundAmount = 0;

    // Loop through items to cancel
    for (const item of order.items) {
      // Check if this item is in the cancelItemIds list and is not already Cancelled
      const shouldCancel = cancelItemIds.some(
        (id) =>
          String(id) === String(item._id) ||
          String(id) === String(item.productId),
      );

      if (shouldCancel && item.status !== "Cancelled") {
        item.status = "Cancelled";
        item.cancellationReason = reason;
        item.cancellationComments = comments;
        item.cancelledDate = new Date();
        updatedAny = true;

        if (originalPaymentStatus === "Paid") {
          refundAmount += item.subtotal;
          item.paymentReturned = true;
        }

        // Restore stock in database
        if (item.variantId) {
          await variantModel.findByIdAndUpdate(item.variantId, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    if (!updatedAny) {
      throw new Error("Selected items are already cancelled");
    }

    // Check if all items in the order are now Cancelled
    const allCancelled = order.items.every(
      (item) => item.status === "Cancelled",
    );

    if (allCancelled) {
      order.orderStatus = "Cancelled";
      order.cancelledDate = new Date();
      // If COD, payment remains Pending/Cancelled. If online, Refunded could apply
      order.paymentStatus = "Refunded";
    }

    // Save cancellation details
    order.cancellationReason = reason;
    order.cancellationComments = comments;

    // Accumulate refundedAmount on pricing — do NOT mutate subtotal/tax/grandTotal
    // so the original pricing remains intact for display.
    if (!order.pricing.refundedAmount) order.pricing.refundedAmount = 0;
    order.pricing.refundedAmount += refundAmount;

    // If paymentStatus was Paid, refund the subtotal of the cancelled items to user's wallet
    if (originalPaymentStatus === "Paid" && refundAmount > 0) {
      // Update User's wallet
      await User.findByIdAndUpdate(userId, {
        $inc: { wallet: refundAmount },
      });

      // Create Transaction record
      await Transaction.create({
        userId: userId,
        amount: refundAmount,
        type: "credit",
        description: `Refund for cancelled items in order #${order.orderId}`,
        orderId: order.orderId,
        status: "completed",
      });
    }

    await order.save();
    return order;
  } catch (error) {
    console.error("cancelOrderService error:", error);
    throw error;
  }
};

const returnOrderService = async (
  orderId,
  userId,
  selectedItems,
  reason,
  comments,
  resolution,
  method,
) => {
  try {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate order status
    if (
      order.orderStatus !== "Delivered" &&
      order.orderStatus !== "Returned" &&
      order.orderStatus !== "Replaced"
    ) {
      throw new Error("Only delivered or returned orders can be returned");
    }

    // Validate 7-day return window
    const refDate = order.deliveredDate || order.updatedAt;
    const diffDays =
      (new Date().getTime() - new Date(refDate).getTime()) /
      (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      throw new Error("Return window of 7 days has expired");
    }

    if (!selectedItems || selectedItems.length === 0) {
      throw new Error("Please select at least one item to return");
    }

    let updatedAny = false;

    // Loop through items to return
    for (const item of order.items) {
      const shouldReturn = selectedItems.some(
        (id) =>
          String(id) === String(item._id) ||
          String(id) === String(item.productId),
      );

      if (shouldReturn) {
        if (item.status === "Cancelled") {
          throw new Error(
            `Item "${item.name}" is already cancelled and cannot be returned`,
          );
        }
        if (
          [
            "Return Requested",
            "Return Confirmed",
            "Replacement Confirmed",
            "Returned",
            "Replaced",
          ].includes(item.status)
        ) {
          throw new Error(
            `Item "${item.name}" has already been returned or has a return/replacement request`,
          );
        }

        item.status = "Return Requested";
        item.returnReason = reason;
        item.returnComments = comments;
        item.returnResolution = resolution;
        item.returnMethod = method;
        item.returnRequestDate = new Date();
        updatedAny = true;

        // Restore stock in database
        if (item.variantId) {
          await variantModel.findByIdAndUpdate(item.variantId, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    if (!updatedAny) {
      throw new Error("No items were marked as returned");
    }

    // Check if all non-cancelled items in the order are now Returned or Return Requested
    const allReturnedOrCancelled = order.items.every((item) =>
      [
        "Return Requested",
        "Return Confirmed",
        "Replacement Confirmed",
        "Returned",
        "Replaced",
        "Cancelled",
      ].includes(item.status),
    );

    if (allReturnedOrCancelled) {
      order.orderStatus = "Return Requested";
      if (!order.returnRequestDate) {
        order.returnRequestDate = new Date();
      }
      order.returnReason = reason;
      order.returnComments = comments;
      order.returnResolution = resolution;
      order.returnMethod = method;
    }

    await order.save();
    return order;
  } catch (error) {
    console.error("returnOrderService error:", error);
    throw error;
  }
};

const retryPaymentService = async (orderId, userId) => {
  try {
    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate eligibility
    if (order.paymentMethod !== "Razorpay") {
      throw new Error("Order is not configured for Razorpay payment.");
    }
    if (order.paymentStatus === "Paid") {
      throw new Error("Order is already paid.");
    }
    if (order.orderStatus === "Cancelled") {
      throw new Error("Order has been cancelled.");
    }

    // Validate stock of items in the order
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await variantModel.findById(item.variantId);
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}"`);
        }
      }
    }

    // Create a new Razorpay order
    let razorpayOrderId;
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(order.pricing.grandTotal * 100), // in paise
        currency: "INR",
        receipt: order.orderId,
      });
      razorpayOrderId = rzpOrder.id;
    } catch (error) {
      console.error("Razorpay order retry creation error:", error);
      throw new Error(
        "Failed to initiate online payment transaction with Razorpay. " +
          (error.message || ""),
      );
    }

    // Update the order's razorpayOrderId
    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    return {
      orderId: order.orderId,
      razorpayOrderId,
      amount: Math.round(order.pricing.grandTotal * 100),
      currency: "INR",
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error("retryPaymentService error:", error);
    throw error;
  }
};

export {
  getUserOrdersService,
  getOrderByIdService,
  cancelOrderService,
  returnOrderService,
  retryPaymentService,
};
