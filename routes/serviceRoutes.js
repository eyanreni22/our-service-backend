const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
    createService,
    getAllServices,
    getServicesByProvider,
    getServiceById,
    deleteService
} = require("../controllers/serviceController");
const upload = require("../middlewares/uploadMiddleware");


const router = express.Router();

router.get("/", getAllServices);

router.post("/", protect, upload.single("image"), createService); // ✅ Only authenticated providers can add services
router.get("/", getAllServices); // ✅ Public - Get all services
router.get("/provider", protect, getServicesByProvider); // ✅ Providers can view their services
router.get("/:id", getServiceById); // ✅ Public - Get service by ID
router.delete("/:id", protect, deleteService); // ✅ Only authenticated providers can delete their service

module.exports = router;
