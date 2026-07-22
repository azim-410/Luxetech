import { getUserById } from "../../services/user/profileService.js";
import {
  getUserOrdersService,
  getOrderByIdService,
  cancelOrderService,
  returnOrderService,
  retryPaymentService,
  getInvoiceDataService,
} from "../../services/user/orderService.js";

const getOrdersPage = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.redirect("/login");
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.redirect("/login");
    }
    const orders = await getUserOrdersService(userId);
    res.render("User/userorders", { user, orders });
  } catch (error) {
    console.error("getOrdersPage error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getTrackingPage = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.redirect("/login");
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.redirect("/login");
    }
    const orderId = req.params.orderId;
    const order = await getOrderByIdService(orderId, userId);
    if (!order) {
      return res.status(404).send("Order not found");
    }
    console.log("order:", order);
    res.render("User/trackingPage", { user, order });
  } catch (error) {
    console.error("getTrackingPage error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderId } = req.params;
    const { cancelItems, reason, comments } = req.body;

    const updatedOrder = await cancelOrderService(
      orderId,
      userId,
      cancelItems,
      reason,
      comments,
    );

    return res.json({
      success: true,
      message: "Items cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("cancelOrder controller error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel items",
    });
  }
};

const getReturnPage = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.redirect("/login");
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.redirect("/login");
    }
    const orderId = req.params.orderId;
    const order = await getOrderByIdService(orderId, userId);
    if (!order) {
      return res.status(404).send("Order not found");
    }
    res.render("User/returnProduct", { user, order });
  } catch (error) {
    console.error("getReturnPage error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const processReturn = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.redirect("/login");
    }

    const { orderId } = req.params;
    const { selectedItems, reason, comments, resolution, method } = req.body;

    const updatedOrder = await returnOrderService(
      orderId,
      userId,
      selectedItems,
      reason,
      comments,
      resolution,
      method,
    );

    return res.json({
      success: true,
      message: "Return request processed successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("processReturn controller error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process return request",
    });
  }
};

const retryPayment = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderId } = req.body;
    const retryData = await retryPaymentService(orderId, userId);

    return res.json({
      success: true,
      ...retryData,
    });
  } catch (error) {
    console.error("retryPayment controller error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to initiate payment retry.",
    });
  }
};

const getInvoiceData = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user.id
      : req.user
        ? req.user._id
        : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderId } = req.params;
    const order = await getInvoiceDataService(orderId, userId);

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("getInvoiceData controller error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve invoice data",
    });
  }
};

export {
  getOrdersPage,
  getTrackingPage,
  cancelOrder,
  getReturnPage,
  processReturn,
  retryPayment,
  getInvoiceData,
};
