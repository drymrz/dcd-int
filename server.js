require("dotenv").config();
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const loadModel = require("./services/loadModel");
const { predict } = require("./services/inferenceService");
const firestoreService = require("./services/firestoreService");
const cors = require("cors");

const app = express();

app.use(cors());

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
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    const buffer = req.file.buffer;
    console.log("Buffer received:", buffer); // Log buffer untuk memastikan file diterima

    const { confidenceScore, label, suggestion } = await predict(model, buffer);
    console.log("Prediction result:", { confidenceScore, label, suggestion });

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
    console.log("Data saved to Firestore:", data);

    return res.status(201).json({
      status: "success",
      message: "Model is predicted successfully",
      data,
    });
  } catch (error) {
    console.error("Error during prediction:", error); // Log detail error
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

app.get("/predict/histories", async (req, res) => {
  try {
    const histories = await firestoreService.getPredictionHistories();

    res.status(200).json({
      status: "success",
      data: histories,
    });
  } catch (error) {
    console.error("Error fetching histories:", error);
    res.status(500).json({
      status: "fail",
      message: "Terjadi kesalahan saat mengambil data riwayat prediksi.",
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
const HOST = "0.0.0.0"; // Ganti localhost menjadi 0.0.0.0

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
