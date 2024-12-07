const tf = require("@tensorflow/tfjs-node");

const predict = async (model, imageBuffer) => {
  try {
    console.log("Loading image buffer into tensor...");
    const tensor = tf.node
      .decodeImage(imageBuffer)
      .resizeNearestNeighbor([224, 224]) // Resize sesuai model
      .expandDims()
      .toFloat();

    console.log("Tensor created:", tensor.shape);

    const prediction = model.predict(tensor);
    const score = await prediction.data();
    console.log("Raw prediction score:", score);

    const confidenceScore = score[0];
    let label, suggestion;

    if (confidenceScore > 0.5) {
      label = "Cancer";
      suggestion = "Segera periksa ke dokter!";
    } else {
      label = "Non-cancer";
      suggestion = "Penyakit kanker tidak terdeteksi.";
    }

    console.log("Prediction result:", { confidenceScore, label, suggestion });
    return { confidenceScore: confidenceScore * 100, label, suggestion };
  } catch (error) {
    console.error("Error during tensor processing or prediction:", error);
    throw new Error("Prediction failed");
  }
};

module.exports = { predict };
