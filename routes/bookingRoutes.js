const express = require("express");
const router = express.Router();
const {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  updatePaymentStatus,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/", protect, authorize("customer"), createBooking);
router.get("/customer", protect, authorize("customer"), getCustomerBookings);
router.get("/provider", protect, authorize("provider", "admin"), getProviderBookings);
router.put("/status/:id", protect, authorize("provider", "admin"), updateBookingStatus);
router.put("/payment/:id", protect, authorize("provider", "admin"), updatePaymentStatus);

module.exports = router;
