const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

// Create or update review
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId).populate({
      path: "service",
      populate: { path: "provider" },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.customer.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only review your own bookings" });
    if (booking.status !== "completed")
      return res.status(400).json({ message: "You can only review completed bookings" });

    if (!booking.service?.provider)
      return res.status(400).json({ message: "Service provider not found" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    let review = await Review.findOne({ booking: bookingId, customer: req.user.id });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
      return res.status(200).json({ message: "Review updated", review });
    } else {
      review = await Review.create({
        customer: req.user.id,
        provider: booking.service.provider,
        service: booking.service._id,
        booking: bookingId,
        rating,
        comment,
      });
      return res.status(201).json({ message: "Review created", review });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get review by booking ID
const getReviewByBookingId = async (req, res) => {
  try {
    const review = await Review.findOne({
      booking: req.params.bookingId,
      customer: req.user?._id,
    });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a service
const getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId })
      .populate("customer", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get reviews for a provider (with optional pagination)
const getProviderReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const count = await Review.countDocuments({ provider: req.params.providerId });

    res.json({
      reviews,
      total: count,
      page: Number(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get average rating for provider using aggregation
const getProviderRating = async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { provider: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: "$provider",
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating = result[0]?.averageRating?.toFixed(1) || 0;
    res.json({ averageRating: parseFloat(averageRating) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete review (by admin or review owner)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (req.user.role !== "admin" && review.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  createReview,
  getReviewByBookingId,
  getProviderReviews,
  getServiceReviews,
  getProviderRating,
  deleteReview,
};
