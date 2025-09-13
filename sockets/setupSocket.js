// const { Server } = require("socket.io");

// const setupSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "http://localhost:5173", // Frontend URL
//       methods: ["GET", "POST"],
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("Client connected:", socket.id);

//     // Handle Bookings
//     socket.on("newBooking", (booking) => {
//       io.emit("bookingUpdate", booking);
//     });

//     socket.on("updateBooking", (booking) => {
//       io.emit("bookingUpdate", booking);
//     });

//     // Handle GPS Tracking
//     socket.on("updateLocation", (location) => {
//       io.emit("locationUpdate", location);
//     });

//     // Handle Payment Tracking
//     socket.on("paymentUpdate", (payment) => {
//       io.emit("paymentStatus", payment);
//     });

//     // Handle Admin WebSocket Connection
//     socket.on("adminConnect", () => {
//       console.log("Admin connected to WebSocket");
//     });

//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//     });
//   });

//   return io;
// };

// module.exports = setupSocket;
