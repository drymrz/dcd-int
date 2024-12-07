require("dotenv").config();
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const loadModel = require("./services/loadModel");
const { predict } = require("./services/inferenceService");
const firestoreService = require("./services/firestoreService");

const app = express();

// Konfigurasi multer untuk upload gambar
const upload = multer({
  limits: { fileSize: 1000000 }, // Max size 1MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File must be an image"));
    }
    cb(null, true);
  },
});

let model = null;

// Middleware untuk load model hanya sekali
app.use(async (req, res, next) => {
  if (!model) {
    try {
      model = await loadModel();
      console.log("Model loaded successfully.");
    } catch (error) {
      console.error("Failed to load model:", error);
      return res.status(500).json({
        status: "fail",
        message: "Failed to load model",
      });
    }
  }
  next();
});

// Endpoint untuk prediksi
app.post("/predict", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    const buffer = req.file.buffer;
    const { confidenceScore, label, suggestion } = await predict(model, buffer);

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
      id,
      result: label,
      suggestion,
      confidenceScore,
      createdAt,
    };

    // Simpan ke Firestore
    await firestoreService.savePrediction(data);

    return res.status(201).json({
      status: "success",
      message: "Model is predicted successfully",
      data,
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes("File too large")) {
      return res.status(413).json({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
    }
    return res.status(400).json({
      status: "fail",
      message: "Terjadi kesalahan dalam melakukan prediksi",
    });
  }
});

// Middleware Error Handler untuk Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handling jika file terlalu besar
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        status: "fail",
        message: "Payload content length greater than maximum allowed: 1000000",
      });
    }
  }
  // Error umum lainnya
  res.status(400).json({
    status: "fail",
    message: err.message || "An unexpected error occurred",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
