const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    amount: { type: Number, required: true },
    pdfUrl: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
