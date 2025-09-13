const mongoose = require("mongoose");

const ServiceSchema= new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String,
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    image: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, // ✅ New field
});

module.exports = mongoose.model("Service", ServiceSchema);
