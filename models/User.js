const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["customer", "provider"], default: "customer" },
    },
    { timestamps: true }
);

// ✅ Prevent model overwrite
const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
