const tf = require("@tensorflow/tfjs-node");

const predict = async (model, imageBuffer) => {
  const tensor = tf.node
    .decodeImage(imageBuffer)
    .resizeNearestNeighbor([224, 224])
    .expandDims()
    .toFloat();

  const prediction = model.predict(tensor);
  const score = await prediction.data();

  const confidenceScore = score[0];
  const label = confidenceScore > 0.5 ? "Cancer" : "Non-cancer";
  const suggestion =
    confidenceScore > 0.5
      ? "Segera periksa ke dokter!"
      : "Penyakit kanker tidak terdeteksi.";

  return { label, suggestion };
};

module.exports = { predict };
