const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const ensureInvoiceDirectory = () => {
    const invoiceDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
    }
};

const generateInvoice = async (booking) => {
    return new Promise(async (resolve, reject) => {
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
            doc.text(`Date: ${booking.date}`);
            doc.text(`Status: ${booking.status}`);
            doc.text(`Total Amount: $${booking.service.price || "N/A"}`);
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// const sendInvoiceEmail = async (customerEmail, invoicePath) => {
//     await transporter.sendMail({
//         from: process.env.SMTP_USER,
//         to: customerEmail,
//         subject: "Your Booking Invoice",
//         text: "Attached is your invoice for the completed booking.",
//         attachments: [{ filename: path.basename(invoicePath), path: invoicePath }],
//     });
// };
const sendInvoiceEmail = async (email, invoicePath) => {
    try {
        console.log("📧 Sending email to:", email);
        console.log("📄 Attaching invoice:", invoicePath);

        // Your email sending logic (e.g., using nodemailer)
        await transporter.sendMail({
            from: "your-email@example.com",
            to: email,
            subject: "Your Service Invoice",
            text: "Please find your invoice attached.",
            attachments: [{ filename: "invoice.pdf", path: invoicePath }],
        });

        console.log("✅ Email sent successfully to:", email);
    } catch (error) {
        console.error("❌ Failed to send invoice email:", error);
    }
};


module.exports = { generateInvoice, sendInvoiceEmail };
