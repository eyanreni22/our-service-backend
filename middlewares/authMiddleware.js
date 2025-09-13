const jwt = require("jsonwebtoken");
const User = require("../models/User");      // Customers & Service Providers
const Admin = require("../models/Admin");    // Admins only

const DEBUG = false;

// ✅ Extract Bearer token from Authorization header
const getTokenFromHeaders = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const parts = authHeader.split(" ");
    if (parts.length === 2) return parts[1];
  }
  return null;
};

// ✅ Main Authentication Middleware
const protect = async (req, res, next) => {
  const token = getTokenFromHeaders(req);
  if (DEBUG) {
    console.log("🔐 Authorization Header:", req.headers.authorization);
    console.log("🔐 Token Extracted:", token);
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (DEBUG) console.log("✅ Decoded JWT:", decoded);

    let user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) {
        return res.status(401).json({ message: "User not found" });
      }
      req.admin = admin;
      req.user = admin; // Unify for consistent access
    } else {
      req.user = user;
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
// ✅ Role-Based Access Middleware
const customerOnly = (req, res, next) => {
  if (req.user?.role === "customer") return next();
  return res.status(403).json({ message: "Access denied. Customers only." });
};

const providerOnly = (req, res, next) => {
  if (req.user?.role === "provider") return next();
  return res.status(403).json({ message: "Access denied. Providers only." });
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Access denied. Admins only." });
};

// ✅ Dynamic Role-Based Middleware
const authorize = (...roles) => {
  if (DEBUG) {
    console.log(`🔐 Role required: ${roles}, current user role: ${req.user?.role}`);
  }
  
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  customerOnly,
  providerOnly,
  adminOnly,
  authorize,
};
