import { getAdminOrdersService, updateOrderEstimateDateService, updateOrderStatusService, updateOrderPaymentStatusService, processAdminItemActionService } from '../../services/admin/adminCheckoutService.js';
import Order from '../../model/order.js';

    const getOrderList = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const sort = req.query.sort || 'date-desc';

            const { orders, totalOrders, totalPage } = await getAdminOrdersService(page, limit, sort);

            return res.render('Admin/orderManagmentPage', {
                orders,
                totalOrders,
                totalPage,
                currentPage: page,
                sort
            });
        } catch (error) {
            console.error("getOrderList error:", error);
            res.status(500).send("Internal Server Error");
        }
    };

const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('userId');
        if (!order) {
            return res.status(404).send("Order not found");
        }
        res.render('Admin/orderDetailsPage', { order });
    } catch (error) {
        console.error("getOrderDetails error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateOrderEstimateDate = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { estimateDate } = req.body;

        await updateOrderEstimateDateService(orderId, estimateDate);

        return res.json({ success: true });
    } catch (error) {
        console.error("updateOrderEstimateDate error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        await updateOrderStatusService(orderId, status);

        return res.json({ success: true });
    } catch (error) {
        console.error("updateOrderStatus error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};
const updateOrderPaymentStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { paymentStatus } = req.body;

        await updateOrderPaymentStatusService(orderId, paymentStatus);

        return res.json({ success: true });
    } catch (error) {
        console.error("updateOrderPaymentStatus error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const processAdminItemAction = async (req, res) => {
    try {
        const orderId = req.params.id;
        const itemId = req.params.itemId;
        const { action } = req.body;

        await processAdminItemActionService(orderId, itemId, action);

        return res.json({ success: true, message: `Item return processed as ${action} successfully` });
    } catch (error) {
        console.error("processAdminItemAction error:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export {
    getOrderList,
    getOrderDetails,
    updateOrderEstimateDate,
    updateOrderStatus,
    updateOrderPaymentStatus,
    processAdminItemAction
};
