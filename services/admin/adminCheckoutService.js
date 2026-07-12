import Order from '../../model/order.js';
import User from '../../model/userModel.js'; // Ensure User model is loaded for populate
import Transaction from '../../model/transaction.js';

const getAdminOrdersService = async (page, limit, sort = 'date-desc') => {
    try {
        const skip = (page - 1) * limit;
        const totalOrders = await Order.countDocuments({});
        const totalPage = Math.max(1, Math.ceil(totalOrders / limit));

        let sortQuery = { createdAt: -1 };
        if (sort === 'date-asc') {
            sortQuery = { createdAt: 1 };
        } else if (sort === 'price-asc') {
            sortQuery = { 'pricing.grandTotal': 1 };
        } else if (sort === 'price-desc') {
            sortQuery = { 'pricing.grandTotal': -1 };
        }

        const orders = await Order.find({})
            .populate('userId')
            .skip(skip)
            .limit(limit)
            .sort(sortQuery);

        return { orders, totalOrders, totalPage };
    } catch (error) {
        throw new Error('Failed to retrieve orders: ' + error.message);
    }
};

const updateOrderEstimateDateService = async (orderId, estimateDate) => {
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    // Validate estimateDate
    const selectedDate = new Date(estimateDate);
    if (isNaN(selectedDate.getTime())) {
        throw new Error('Invalid estimate date format.');
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if selected date is before today
    if (selectedDate < today) {
        throw new Error('Estimate date must be today or in the future.');
    }

    // Save to DB
    order.estimateDate = estimateDate;
    await order.save();

    return order;
};

const updateOrderStatusService = async (orderId, status) => {
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const currentStatus = order.orderStatus;

    // If it's already Delivered or Cancelled, it's final
    if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
        throw new Error(`Cannot change status. The order is already ${currentStatus}.`);
    }

    // Check transition validity
    if (currentStatus === 'Pending' && !['Processing', 'Cancelled'].includes(status)) {
        throw new Error('Pending orders can only be updated to Processing or Cancelled.');
    }
    if (currentStatus === 'Processing' && !['Shipped', 'Cancelled'].includes(status)) {
        throw new Error('Processing orders can only be updated to Shipped or Cancelled.');
    }
    if (currentStatus === 'Shipped' && !['Out for Delivery', 'Cancelled'].includes(status)) {
        throw new Error('Shipped orders can only be updated to Out for Delivery or Cancelled.');
    }
    if (currentStatus === 'Out for Delivery' && !['Delivered', 'Cancelled'].includes(status)) {
        throw new Error('Out for Delivery orders can only be updated to Delivered or Cancelled.');
    }

    // Set status change date
    if (status === 'Processing') {
        order.processingDate = new Date();
    } else if (status === 'Shipped') {
        order.shippedDate = new Date();
    } else if (status === 'Out for Delivery') {
        order.outForDeliveryDate = new Date();
    } else if (status === 'Delivered') {
        order.deliveredDate = new Date();
    } else if (status === 'Cancelled') {
        order.cancelledDate = new Date();
        const isPaid = order.paymentStatus === 'Paid';
        if (isPaid) {
            order.paymentStatus = 'Refunded';
            const refundAmount = order.pricing.grandTotal;
            if (refundAmount > 0) {
                await User.findByIdAndUpdate(order.userId, {
                    $inc: { wallet: refundAmount }
                });
                await Transaction.create({
                    userId: order.userId,
                    amount: refundAmount,
                    type: 'credit',
                    description: `Refund for order cancellation by Admin (Order #${order.orderId})`,
                    orderId: order.orderId,
                    status: 'completed'
                });
            }
        }
        // Mark all items as Cancelled and set paymentReturned = true if paid
        order.items.forEach(item => {
            if (item.status !== 'Cancelled') {
                item.status = 'Cancelled';
                item.cancelledDate = new Date();
                item.cancellationReason = 'Cancelled by Administrator';
                if (isPaid) {
                    item.paymentReturned = true;
                }
            }
        });
    }

    // Save to DB
    order.orderStatus = status;
    await order.save();

    return order;
};

const updateOrderPaymentStatusService = async (orderId, paymentStatus) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!validStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status.');
    }

    order.paymentStatus = paymentStatus;
    await order.save();
    return order;
};

const processAdminItemActionService = async (orderId, itemId, action) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const item = order.items.find(i => String(i._id) === String(itemId) || String(i.productId) === String(itemId));

    if (!item) {
        throw new Error('Item not found in order');
    }

    if (action === 'Return' || action === 'Replacement') {
        if (item.status !== 'Return Requested') {
            throw new Error('This item does not have an active return request');
        }
        if (action === 'Return') {
            item.status = 'Return Confirmed';
            item.paymentReturned = true;
            // Credit refund to user's wallet
            const refundAmount = item.subtotal;
            await User.findByIdAndUpdate(order.userId, {
                $inc: { wallet: refundAmount }
            });
            await Transaction.create({
                userId: order.userId,
                amount: refundAmount,
                type: 'credit',
                description: `Refund for returned item: ${item.name}`,
                orderId: order.orderId,
                status: 'completed'
            });
        } else {
            item.status = 'Replacement Confirmed';
        }
        item.returnConfirmedDate = new Date();
        if (!item.returnRequestDate) {
            item.returnRequestDate = new Date();
        }
    } else if (action === 'MarkReturned') {
        if (item.status !== 'Return Confirmed') {
            throw new Error('This item is not in Return Confirmed state');
        }
        item.status = 'Returned';
        item.returnedDate = new Date();
        if (!item.returnConfirmedDate) {
            item.returnConfirmedDate = new Date();
        }
        if (!item.returnRequestDate) {
            item.returnRequestDate = new Date();
        }
    } else if (action === 'MarkReplaced') {
        if (item.status !== 'Replacement Confirmed') {
            throw new Error('This item is not in Replacement Confirmed state');
        }
        item.status = 'Replaced';
        item.returnedDate = new Date();
        if (!item.returnConfirmedDate) {
            item.returnConfirmedDate = new Date();
        }
        if (!item.returnRequestDate) {
            item.returnRequestDate = new Date();
        }
    } else {
        throw new Error('Invalid action');
    }

    // Now update overall order status based on item statuses:
    const hasPendingReturnRequests = order.items.some(i => i.status === 'Return Requested');
    const hasConfirmedReturns = order.items.some(i => i.status === 'Return Confirmed');
    const hasConfirmedReplacements = order.items.some(i => i.status === 'Replacement Confirmed');

    if (hasPendingReturnRequests) {
        order.orderStatus = 'Return Requested';
        if (!order.returnRequestDate) {
            order.returnRequestDate = new Date();
        }
    } else if (hasConfirmedReturns || hasConfirmedReplacements) {
        if (hasConfirmedReturns) {
            order.orderStatus = 'Return Confirmed';
            // order.paymentStatus = 'Refunded';
        } else {
            order.orderStatus = 'Replacement Confirmed';
        }
        if (!order.returnConfirmedDate) {
            order.returnConfirmedDate = new Date();
        }
        if (!order.returnRequestDate) {
            order.returnRequestDate = new Date();
        }
    } else {
        const hasReturnedItems = order.items.some(i => i.status === 'Returned');
        const hasReplacedItems = order.items.some(i => i.status === 'Replaced');

        if (hasReturnedItems || hasReplacedItems) {
            order.orderStatus = hasReturnedItems ? 'Returned' : 'Replaced';
            if (!order.returnedDate) {
                order.returnedDate = new Date();
            }
            if (!order.returnConfirmedDate) {
                order.returnConfirmedDate = new Date();
            }
            if (!order.returnRequestDate) {
                order.returnRequestDate = new Date();
            }
        }
    }

    const hasActiveItems = order.items.some(i => !['Cancelled', 'Returned', 'Return Confirmed'].includes(i.status));
    if (!hasActiveItems) {
        order.paymentStatus = 'Refunded';
    }

    await order.save();
    return order;
};

export {
    getAdminOrdersService,
    updateOrderEstimateDateService,
    updateOrderStatusService,
    updateOrderPaymentStatusService,
    processAdminItemActionService
};

