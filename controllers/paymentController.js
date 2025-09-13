const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const stripeMode = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "Test Mode" : "Live Mode";
console.log("Stripe is in", stripeMode);

// ✅ Ensure frontend URL is loaded properly
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log("✅ Stripe Key:", process.env.STRIPE_SECRET_KEY);
console.log("✅ Frontend URL:", frontendUrl);


// ✅ Create Payment Intent (for client-only payment)

const createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // amount in cents
            currency: currency || "usd",
        });

        console.log("✅ Payment Intent created:", paymentIntent.id);
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("❌ Error creating payment intent:", error);
        res.status(500).json({ message: "Payment intent creation failed", error: error.message });
    }
};

// ✅ Initiate Stripe Checkout Payment
const initiatePayment = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid Booking ID" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Create pending payment record
        const payment = await new Payment({
            booking: bookingId,
            customer: booking.customer,
            provider: booking.provider,
            amount,
            paymentMethod: "stripe",
            status: "pending",
        }).save();

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: { name: "Service Payment" },
                    unit_amount: amount * 100, // in cents
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${frontendUrl}/payment-success?paymentId=${payment._id}`,
            cancel_url: `${frontendUrl}/payment-cancelled`,
        });

        res.json({ message: "Payment initiated", url: session.url, paymentId: payment._id });
    } catch (error) {
        console.error("❌ Payment initiation failed:", error);
        res.status(500).json({ message: "Payment initiation failed", error: error.message });
    }
};

// ✅ Confirm Payment (manual confirmation after redirect)
const confirmPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = "completed";
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.paymentStatus = "paid";
            await booking.save();
        }

        res.json({ message: "Payment confirmed successfully", payment });
    } catch (error) {
        console.error("❌ Payment confirmation failed:", error);
        res.status(500).json({ message: "Payment confirmation failed", error: error.message });
    }
};

// ✅ Update Payment Status (e.g., by admin/provider)
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, transactionId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Payment ID format" });
        }

        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });

        payment.status = status.toLowerCase();
        if (status.toLowerCase() === "completed" && transactionId) {
            payment.transactionId = transactionId;
        }

        await payment.save();
        res.json({ message: `Payment marked as ${status}`, payment });
    } catch (error) {
        console.error("❌ Payment update error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get Payments for Customer
const getCustomerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ customer: req.user.id }).populate("booking provider");
        res.json({ success: true, payments });
    } catch (error) {
        console.error("❌ Error fetching customer payments:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Get Payments for Provider
const getProviderPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ provider: req.user.id }).populate("booking customer");
        res.json({ success: true, payments });
    } catch (error) {
        console.error("❌ Error fetching provider payments:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Admin: Get All Payments
const getAllPayments = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can access this" });
        }
        const payments = await Payment.find().populate("booking customer provider");
        res.json({ success: true, payments });
    } catch (error) {
        console.error("❌ Error fetching all payments:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
// Stripe requires the raw body to validate the signature
const handleStripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET // Set this in your .env
        );
    } catch (err) {
        console.error("❌ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Handle the event type
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            console.log("✅ Checkout Session Completed:", session.id);
            // You can update payment status in DB here if needed
            break;

        case "payment_intent.succeeded":
            const intent = event.data.object;
            console.log("✅ PaymentIntent Succeeded:", intent.id);
            // Also a good place to update your DB if you're using PaymentIntent directly
            break;

        default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
};


module.exports = {
    createPaymentIntent,
    initiatePayment,
    confirmPayment,
    updatePaymentStatus,
    getCustomerPayments,
    getProviderPayments,
    getAllPayments,
    handleStripeWebhook
};
