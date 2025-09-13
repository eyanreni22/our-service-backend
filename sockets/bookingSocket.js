// // server/sockets/bookingSocket.js
// const Booking = require("../models/Booking");

// const setupBookingSocket = (io) => {
//   io.on("connection", (socket) => {
//     const token = socket.handshake.auth?.token;
//     console.log("🛂 Socket connected with token:", token);
//     console.log("New socket connected:", socket.id);

//     if (!token) {
//       console.warn("❌ No token provided, disconnecting...");
//       socket.disconnect(); // Disconnect if no token is provided
//       return;
//     }

//     // Token verification logic (optional)
//     try {
//       // Example: jwt.verify(token, secret);
//     } catch (error) {
//       console.error("❌ Invalid token:", error);
//       socket.disconnect(); // Disconnect on invalid token
//       return;
//     }

//     console.log("📦 Booking Socket connected:", socket.id);

//     // Handle provider joining their room
//     socket.on("joinRoom", (providerId) => {
//       console.log(`📡 Joining room: ${providerId}`);
//       console.log(`Socket ${socket.id} joined room: ${providerId}`);
//       socket.join(providerId);

//       // Optional: Send a test booking after 5 seconds
//       setTimeout(() => {
//         io.to(providerId).emit("newBooking", {
//           test: true,
//           message: `Test booking for provider ${providerId}`,
//         });
//       }, 5000);
//     });

//     // Get provider's bookings
//     socket.on("getProviderBookings", async (providerId) => {
//       console.log("📩 Received getProviderBookings for:", providerId);
//       try {
//         const bookings = await Booking.find({ provider: providerId })
//           .populate("customer", "name email")
//           .populate("service", "name price");
//         socket.emit("providerBookings", bookings);
//       } catch (error) {
//         console.error("❌ Error fetching bookings:", error.message);
//         socket.emit("providerBookings", []); // Send empty array on error
//       }
//     });

//     // Handle new booking event
//     socket.on("newBooking", (booking) => {
//       const providerId = booking.provider?.toString();
//       if (providerId) {
//         console.log("📢 Emitting bookingUpdated to provider:", providerId);
//         io.to(providerId).emit("bookingUpdated", booking);
//       }
//     });

//     // Handle booking updates
//     socket.on("updateBooking", (booking) => {
//       const providerId = booking.provider?.toString();
//       if (providerId) {
//         console.log("♻️ Emitting bookingUpdated to provider:", providerId);
//         io.to(providerId).emit("bookingUpdated", booking);
//       }
//     });

//     // Handle payment updates
//     socket.on("paymentUpdate", (payment) => {
//       const providerId = payment.provider?.toString();
//       if (providerId) {
//         io.to(providerId).emit("paymentStatus", payment);
//       }
//     });

//     // Disconnect handler
//     socket.on("disconnect", () => {
//       console.log("📦 Booking Socket disconnected:", socket.id);
//     });
//   });
// };

// module.exports = setupBookingSocket;
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });

    socket.on("bookingCreated", (data) => {
      console.log("📢 New booking:", data);
      io.emit("bookingUpdate", data); // broadcast to all clients
    });

    socket.on("paymentSuccess", (data) => {
      console.log("💰 Payment success:", data);
      io.emit("paymentUpdate", data);
    });
  });
};