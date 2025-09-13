const express = require("express");
const { createInvoice, getCustomerInvoices, getProviderInvoices } = require("../controllers/invoiceController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, createInvoice);
router.get("/customer", protect, authorize("customer"), getCustomerInvoices);
router.get("/provider", protect, authorize("provider"), getProviderInvoices);
// router.get("/admin", protect, authorize("admin"), getAllInvoices);

module.exports = router;
