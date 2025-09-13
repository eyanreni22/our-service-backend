const express = require("express");
const {
  createReview,
  getReviewByBookingId,
  getProviderReviews,
  getServiceReviews,
  deleteReview,
  getProviderRating,
} = require("../controllers/reviewController");

const {
  protect,
  customerOnly,
  adminOnly,
  authorize,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Sanity check route
router.get("/", (req, res) => {
  res.send("Review routes are active ✅");
});

// Create or update a review (Only for customers of completed bookings)
router.post("/", protect, customerOnly, createReview);

// Get review by booking ID (only accessible by that customer)
router.get("/booking/:bookingId", protect, getReviewByBookingId);

// Get all reviews for a provider (accessible by customer/provider)
router.get("/provider/:providerId", protect, authorize("customer", "provider"), getProviderReviews);

// Get all reviews for a service
router.get("/service/:serviceId", protect, getServiceReviews);

// Get average rating for a provider
router.get("/provider/:id/rating", getProviderRating);

// Delete a review (only by customer or admin)
router.delete("/:id", protect, deleteReview);

module.exports = router;
