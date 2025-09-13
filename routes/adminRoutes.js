const express = require("express");
const router = express.Router();
const Service = require("../models/Service"); 

   // 🔐 Middleware
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// 📦 Admin Controllers
const {
  registerAdmin,
  loginAdmin,
  getUsers,
  toggleUserStatus,
  deleteUser,
  addService,
  editService,
  deleteService,
  getAllBookings,
  getAllServices
} = require("../controllers/adminController");
// const getAllServices =require("../controllers/serviceController")

// 📦 Booking & Invoice Controllers
const {  updateBookingStatus } = require("../controllers/bookingController");
const { getAllInvoices } = require("../controllers/invoiceController");
const {registerAdminValidators} = require("../middlewares/adminValidators");
const {validateRequest} =require("../middlewares/validateRequest");

// ========================
// 🔓 Public Admin Routes
// ========================

// ✅ Admin Registration
router.post("/register", registerAdmin);

// ✅ Admin Login
router.post("/login", loginAdmin);

// ========================
// 🔒 Protected Admin Routes
// ========================

// ✅ User Management
router.get("/users", protect, adminOnly, getUsers);
router.put("/user/status/:userId", protect, adminOnly, toggleUserStatus);
router.delete("/user/:userId", protect, adminOnly, deleteUser);
router.post('/register', registerAdminValidators, validateRequest, registerAdmin);

// ✅ Service Management
router.get("/services", protect, adminOnly, getAllServices); // Add this route
router.post("/service", protect, adminOnly, addService);
router.put("/service/:serviceId", protect, adminOnly, editService);
router.delete("/service/:serviceId", protect, adminOnly, deleteService);

// ✅ Booking Management
router.get("/bookings", protect, adminOnly, getAllBookings);
router.put("/bookings/:bookingId/status", protect, adminOnly, updateBookingStatus);

// ✅ Invoice Management
router.get("/invoices", protect, adminOnly, getAllInvoices);

module.exports = router;
