// const Service = require("../models/Service");
// const cloudinary = require("../config/cloudinary");
// const fs = require("fs");


// // ✅ Create a new service (only providers can add services)
// const createService = async (req, res) => {
//   try {
//     const { name, description, price, category } = req.body;

//     if (req.user.role !== "provider") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "Image is required" });
//     }

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: "services",
//     });

//     // Delete local temp file
//     fs.unlinkSync(req.file.path);

//     const service = await Service.create({
//       name,
//       description,
//       price,
//       category,
//       provider: req.user.id,
//       image: result.secure_url, // Cloudinary URL
//     });

//     res.status(201).json(service);
//   } catch (error) {
//     console.error("Error creating service:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



// // ✅ Get services by provider (Only provider can access)
// const getServicesByProvider = async (req, res) => {
//     try {
//         if (req.user.role !== "provider") {
//             return res.status(403).json({ message: "Access denied" });
//         }

//         const services = await Service.find({ provider: req.user.id });
//         res.json(services);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//     }
// };

// // ✅ Get a single service by ID (Public)
// const getServiceById = async (req, res) => {
//     try {
//         const service = await Service.findById(req.params.id).populate("provider", "name email");
//         if (!service) {
//             return res.status(404).json({ message: "Service not found" });
//         }
//         res.json(service);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//     }
// };

// // ✅ Delete a service (Only provider who created it can delete)
// const deleteService = async (req, res) => {
//     try {
//         const service = await Service.findById(req.params.id);
//         if (!service) {
//             return res.status(404).json({ message: "Service not found" });
//         }

//         // ✅ Fixed condition for better authorization check
//         if (service.provider.toString() !== req.user.id && req.user.role !== "provider") {
//             return res.status(403).json({ message: "Unauthorized" });
//         }

//         await service.deleteOne();
//         res.json({ message: "Service deleted" });
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error });
//     }
// };
// const  getAllServices = async (req, res) => {
//     try {
//         console.log("🔄 Fetching all services...");
//         const services = await Service.find().populate("provider", "name email");

//         if (!services || services.length === 0) {
//             console.warn("⚠️ No services found");
//         }

//         // ✅ Fix: Handle null image properly
//         const updatedServices = services.map(service => ({
//             ...service._doc,
//             image: service.image 
//                 ? (service.image.startsWith("http") ? service.image : `${req.protocol}://${req.get("host")}${service.image}`)
//                 : null, // ✅ Set to null if no image
//         }));

//         res.json(updatedServices);
//     } catch (error) {
//         console.error("❌ Error fetching services:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// module.exports = {
//     createService,
//     getAllServices,
//     getServicesByProvider,
//     getServiceById,
//     deleteService
// };





const Service = require("../models/Service");
const cloudinary = require("../config/cloudinary");

// ✅ Create a new service (always upload to Cloudinary)
const createService = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (req.user.role !== "provider") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "services",
    });

    // ✅ Store only the Cloudinary URL
    const newService = new Service({
      name,
      description,
      price,
      category,
      image: result.secure_url, // ✅ Always Cloudinary URL
      provider: req.user._id,
    });

    await newService.save();

    res.status(201).json(newService);
  } catch (err) {
    console.error("❌ Error creating service:", err);
    res.status(500).json({ message: "Failed to create service", error: err.message });
  }
};

// ✅ Get all services (Cloudinary URLs are already saved)
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate("provider", "name email");
    res.json(services);
  } catch (err) {
    console.error("❌ Error fetching services:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get services by provider
const getServicesByProvider = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "provider") {
      return res.status(403).json({ message: "Access denied" });
    }

    const services = await Service.find({ provider: req.user.id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get single service
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("provider", "name email");
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.provider.toString() !== req.user.id && req.user.role !== "provider") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await service.deleteOne();
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createService,
  getAllServices,
  getServicesByProvider,
  getServiceById,
  deleteService,
};