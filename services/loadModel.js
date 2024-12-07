const tf = require("@tensorflow/tfjs-node");

let model = null;

async function loadModel() {
  if (!model) {
    try {
      console.log("Loading model from:", process.env.MODEL_URL);
      model = await tf.loadGraphModel(process.env.MODEL_URL);
      console.log("Model loaded successfully");
    } catch (error) {
      console.error("Error loading model:", error);
      throw new Error("Failed to load model");
    }
  }
  return model;
}

module.exports = loadModel;
