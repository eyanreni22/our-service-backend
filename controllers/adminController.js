const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Service = require("../models/Service");
const Admin = require("../models/Admin");
const Booking =require("../models/Booking")

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role || "admin" }, // Default to "admin" if role is not set
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Consider using a longer expiration or refresh tokens if needed
  );
};

// Register Admin
exports.registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin", // Default role to admin
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin),
    });
  } catch (error) {
    console.error("Error registering admin:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error registering admin" });
  }
};

// controllers/adminController.js
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ make sure role is included in the response
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role, // ✅ required!
      token: generateToken(admin),
    });

  } catch (error) {
    console.error("Error logging in admin:", error.message);
    res.status(500).json({ message: "Error logging in admin" });
  }
};


// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find(); // Consider adding pagination
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Activate/Deactivate User
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: "User status updated" });
  } catch (error) {
    console.error("Error updating user status:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error updating user status" });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Manage Services (CRUD)
exports.addService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    await newService.save();
    res.json({ message: "Service added successfully" });
  } catch (error) {
    console.error("Error adding service:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error adding service" });
  }
};

exports.editService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.serviceId, req.body, { new: true });
    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service updated successfully" });
  } catch (error) {
    console.error("Error updating service:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error updating service" });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.serviceId);
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error.message); // Add more details for debugging
    res.status(500).json({ message: "Error deleting service" });
  }
};


// Admin Authorization Middleware
exports.verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded admin info to request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Invalid token:", error.message); // Add more details for debugging
    res.status(401).json({ message: "Invalid token" });
  }
};
exports.getAllBookings = async (req, res) => {
  try {
      if (!req.user || req.user.role !== "admin"){
          console.log("req.user:", req.user);
          return res.status(403).json({ message: "Only admins can access all bookings" });
      }
      console.log("DEBUG: req.user inside getAllBookings =>", req.user);

      const bookings = await Booking.find()
          .populate("customer", "name email")
          .populate("service", "name")
          .populate("provider", "name email");

      res.json({ success: true, bookings });
  } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Server error", error });
  }
};
// ✅ Get all services (Public)
exports. getAllServices = async (req, res) => {
    try {
        console.log("🔄 Fetching all services...");
        const services = await Service.find().populate("provider", "name email");

        if (!services || services.length === 0) {
            console.warn("⚠️ No services found");
        }

        // ✅ Fix: Handle null image properly
        const updatedServices = services.map(service => ({
            ...service._doc,
            image: service.image 
                ? (service.image.startsWith("http") ? service.image : `${req.protocol}://${req.get("host")}${service.image}`)
                : null, // ✅ Set to null if no image
        }));

        res.json(updatedServices);
    } catch (error) {
        console.error("❌ Error fetching services:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
