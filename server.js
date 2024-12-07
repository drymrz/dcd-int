require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const loadModel = require("./services/loadModel");
const { predict } = require("./services/inferenceService");
const firestoreService = require("./services/firestoreService");

const app = express();

// Aktifkan CORS
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
    } catch (error) {
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

// Endpoint untuk mengambil riwayat prediksi
app.get("/predict/histories", async (req, res) => {
  try {
    const histories = await firestoreService.getPredictionHistories();

    res.status(200).json({
      status: "success",
      data: histories,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: "Terjadi kesalahan saat mengambil data riwayat prediksi.",
    });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
