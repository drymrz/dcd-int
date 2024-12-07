const tf = require("@tensorflow/tfjs-node");

const predict = async (model, imageBuffer) => {
  try {
    const tensor = tf.node
      .decodeImage(imageBuffer)
      .resizeNearestNeighbor([224, 224]) // Sesuaikan ukuran input model
      .expandDims()
      .toFloat();

    const prediction = model.predict(tensor);
    const score = await prediction.data();
    const confidenceScore = score[0]; // Skor pertama untuk binary classification

    let label, suggestion;

    if (confidenceScore > 0.5) {
      label = "Cancer";
      suggestion = "Segera periksa ke dokter!";
    } else {
      label = "Non-cancer";
      suggestion = "Penyakit kanker tidak terdeteksi.";
    }

    return { confidenceScore: confidenceScore * 100, label, suggestion };
  } catch (error) {
    console.error("Error during prediction:", error);
    throw new Error("Terjadi kesalahan dalam melakukan prediksi.");
  }
};

module.exports = { predict };
