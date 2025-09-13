// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// require("dotenv").config();


// User Registration
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const validRoles = ["customer", "provider"];
        const userRole = validRoles.includes(role) ? role : "customer";  // ✅ Validate role

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role: userRole }); // ✅ Use `userRole`
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // ✅ Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ Debugging Logs
        console.log("🔑 Generated Token:", token);
        console.log("🔑 JWT_SECRET in login:", process.env.JWT_SECRET);
        console.log("✅ Loaded JWT_SECRET:", process.env.JWT_SECRET);
      

        // ✅ Send token & user info in response
        res.json({
            token, 
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("🚨 Login Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// Fetch User Profile
exports.getUserProfile = async (req, res) => {
    try {
        console.log("🔍 Checking `req.user`:", req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Update User Profile
exports.updateUserProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true }
        ).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};