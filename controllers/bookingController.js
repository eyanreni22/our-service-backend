const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const { generateInvoice, sendInvoiceEmail } = require("../utils/generateInvoice");

// ✅ Create Booking — customer only
const createBooking = async (req, res) => {
  try {
    const { serviceId, date, amount } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const booking = await Booking.create({
      customer: req.user.id,
      service: serviceId,
      provider: service.provider,
      date,
      amount,
      status: "pending",
      paymentStatus: "pending",
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get bookings for logged-in customer
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate("service", "name price image")
      .populate("provider", "name email");

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching customer bookings:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Get bookings for provider or admin
const getProviderBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    let bookings;

    if (req.user.role === "admin") {
      bookings = await Booking.find()
        .populate("service", "name")
        .populate("customer", "name email")
        .populate("provider", "name email")
        .skip((page - 1) * limit)
        .limit(limit);
    } else if (req.user.role === "provider") {
      bookings = await Booking.find({ provider: req.user.id })
        .populate("service", "name")
        .populate("customer", "name email")
        .populate("provider", "name email")
        .skip((page - 1) * limit)
        .limit(limit);
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error("❌ Error fetching provider bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update booking status — provider only
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id)
      .populate("customer", "name email")
      .populate("service", "name")
      .populate("provider", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (req.user.role === "provider" && req.user.id !== booking.provider.id.toString()) {
      return res.status(403).json({ message: "Access denied: Not your booking." });
    }

    status = status.toLowerCase();
    const allowedTransitions = {
      pending: ["accepted", "canceled", "completed"],
      accepted: ["completed", "canceled"],
      completed: [],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change status from ${booking.status} to ${status}` });
    }

    booking.status = status;
    await booking.save();
    req.io.emit("booking:status-updated", booking);

    if (status === "completed") {
      try {
        const invoicePath = await generateInvoice(booking);
        booking.invoice = invoicePath;
        

        await sendInvoiceEmail(booking.customer.email, invoicePath);
      } catch (err) {
        return res.status(500).json({ message: "Invoice processing failed", error: err.message });
      }
    }

    res.json({ message: `Booking ${status} successfully`, booking });
  } catch (error) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update payment status — admin or provider
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    if (!["paid", "unpaid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status. Must be 'paid' or 'unpaid'" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      req.user.role === "provider" &&
      req.user.id !== booking.provider.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update payment status" });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.json({ message: `Payment status updated to ${paymentStatus}`, booking });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  updatePaymentStatus,
};
