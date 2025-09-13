const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Debugging (Remove in Production)
console.log("🔍 Payment Controller Loaded:", paymentController);
console.log("✅ getAllPayments Exists:", typeof paymentController.getAllPayments === "function");
console.log("✅ adminOnly Middleware Loaded:", typeof adminOnly === "function");

// Define Routes
router.post("/create-payment-intent", protect, paymentController.createPaymentIntent);
router.post("/pay", protect, paymentController.initiatePayment);
router.post("/confirm", protect, paymentController.confirmPayment);
router.patch("/update/:id", protect, paymentController.updatePaymentStatus);
router.get("/customer", protect, paymentController.getCustomerPayments);
router.get("/provider", protect, paymentController.getProviderPayments);
router.get("/all", adminOnly, paymentController.getAllPayments);
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    paymentController.handleStripeWebhook
);


module.exports = router;
 