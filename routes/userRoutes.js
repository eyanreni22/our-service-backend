
const express = require("express");
const { registerUser, loginUser, getUserProfile,updateUserProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.get("/profile", protect, updateUserProfile);


module.exports = router;

