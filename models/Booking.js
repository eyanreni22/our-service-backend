const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["pending", "accepted", "completed", "canceled"], 
        default: "pending" 
    },
    paymentStatus: { 
        type: String, 
        enum: ["pending", "paid", "unpaid"],  // Updated "Unpaid" to "unpaid"
        default: "pending" 
    },
    invoice: { type: String, default: null }, // Optional file path for the invoice
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
