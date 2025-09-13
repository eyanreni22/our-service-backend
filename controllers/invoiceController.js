const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Invoice = require("../models/Invoice");
const Booking = require("../models/Booking");
const {sendInvoiceEmail} = require("../utils/generateInvoice");

// Ensure invoices directory exists
const ensureInvoiceDirectory = () => {
    const invoiceDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
    }
};

// Generate PDF Invoice
const generateInvoicePDF = async (booking) => {
    return new Promise((resolve, reject) => {
        try {
            ensureInvoiceDirectory();

            if (!booking.customer || !booking.service || !booking.provider) {
                return reject(new Error("Missing customer, service, or provider details"));
            }

            const invoicePath = path.join(__dirname, `../invoices/invoice_${booking._id}.pdf`);
            const doc = new PDFDocument();
            const writeStream = fs.createWriteStream(invoicePath);

            writeStream.on("finish", () => resolve(invoicePath));
            writeStream.on("error", (err) => reject(err));

            doc.pipe(writeStream);
            doc.fontSize(20).text("Invoice", { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Invoice ID: ${booking._id}`);
            doc.text(`Customer: ${booking.customer.name || "N/A"}`);
            doc.text(`Service: ${booking.service.name || "N/A"}`);
            doc.text(`Provider: ${booking.provider.name || "N/A"}`);
            doc.text(`Date: ${new Date(booking.date).toLocaleDateString()}`);
            doc.text(`Status: ${booking.status}`);
            doc.text(`Total Amount: $${booking.amount || "N/A"}`);
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Create Invoice
const createInvoice = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate("customer", "name email")
            .populate("service", "name")
            .populate("provider", "name");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const invoicePath = await generateInvoicePDF(booking);

        const invoice = new Invoice({
            booking: booking._id,
            customer: booking.customer._id,
            provider: booking.provider._id,
            service: booking.service._id,
            amount: booking.amount,
            pdfUrl: `/invoices/invoice_${booking._id}.pdf`,
        });

        await invoice.save();
        await sendInvoiceEmail(booking.customer.email, invoicePath);

        res.status(201).json({ message: "Invoice created and sent successfully", invoice });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch Invoices
const getCustomerInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ customer: req.user.id }).populate("service provider");
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getProviderInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ provider: req.user.id }).populate("service customer");
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Fetch All Invoices (Admin)
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate("service customer provider");
        res.status(200).json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Export all functions
module.exports = {
    createInvoice,
    getCustomerInvoices,
    getProviderInvoices,
    getAllInvoices
};



