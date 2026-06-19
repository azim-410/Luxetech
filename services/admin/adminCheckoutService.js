import Order from '../../model/order.js';
import User from '../../model/userModel.js'; // Ensure User model is loaded for populate

const getAdminOrdersService = async (page, limit) => {
    try {
        const skip = (page - 1) * limit;
        const totalOrders = await Order.countDocuments({});
        const totalPage = Math.max(1, Math.ceil(totalOrders / limit));

        const orders = await Order.find({})
            .populate('userId')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

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

    const validStatuses = ['Pending', 'Paid'];
    if (!validStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status.');
    }

    order.paymentStatus = paymentStatus;
    await order.save();
    return order;
};

export {
    getAdminOrdersService,
    updateOrderEstimateDateService,
    updateOrderStatusService,
    updateOrderPaymentStatusService
};
