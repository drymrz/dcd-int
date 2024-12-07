const { Storage } = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");

const storage = new Storage();
const bucketName = process.env.MODEL_BUCKET_NAME;
const localModelPath = path.join(__dirname, "model/model.json");

const getModelPath = async () => {
  if (!fs.existsSync(localModelPath)) {
    const [file] = await storage
      .bucket(bucketName)
      .file("model/model.json")
      .download({
        destination: localModelPath,
      });
    console.log("Model downloaded from Cloud Storage");
  }
  return localModelPath;
};

module.exports = { getModelPath };
