// const multer = require("multer");
// const path = require("path");

// // Configure storage for uploaded files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Save files in 'uploads' folder
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
//   },
// });

// // File filter (only images)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type. Only JPG, PNG, and JPEG allowed."), false);
//   }
// };

// // Multer upload middleware
// const upload = multer({ storage, fileFilter });

// module.exports = upload;
// // const multer = require("multer");
// // const path = require("path");

// // // Store in a temporary "uploads" folder
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/"); 
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, `${Date.now()}-${file.originalname}`);
// //   },
// // });

// // // Allow only images
// // const fileFilter = (req, file, cb) => {
// //   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
// //   if (allowedTypes.includes(file.mimetype)) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Invalid file type. Only JPG, PNG, JPEG allowed."), false);
// //   }
// // };

// // const upload = multer({ storage, fileFilter });
// // module.exports = upload;
// middleware/upload.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // temp folder
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
    return cb(new Error("Only images are allowed"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });