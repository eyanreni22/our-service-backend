// Core Dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
require("dotenv").config();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // temp folder

// MongoDB Connection
const connectDB = require("./config/db");
connectDB();

// Express App & HTTP Server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",                     // Local Vite dev
  "https://our-service-frontend.vercel.app",   // Your deployed frontend
];

// ✅ CORS Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||                                // allow server-to-server or curl
      allowedOrigins.includes(origin) ||        // exact matches
      /\.vercel\.app$/.test(origin)             // allow any *.vercel.app
    ) {
      callback(null, true);
    } else {
      console.error("❌ CORS blocked for:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight support

// Socket.IO Setup
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS (Socket.IO)"));
      }
    },
    credentials: true,
  },
});
app.set("io", io);

// Socket Handlers
require("./sockets/bookingSocket")(io);

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));

// ✅ Static Files (images, invoices, public assets)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Root Test
app.get("/", (req, res) => res.send("✅ Backend working"));

// 404 Handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error Handler
const { errorHandler } = require("./middlewares/errorMiddleware");
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
