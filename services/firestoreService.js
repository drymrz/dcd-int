const { Firestore } = require("@google-cloud/firestore");

const firestore = new Firestore({
  projectId: process.env.FIRESTORE_PROJECT_ID,
  credentials: {
    private_key: process.env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIRESTORE_CLIENT_EMAIL,
  },
  databaseId: "mlgc-db", // Jika kamu menggunakan databaseId khusus
});

const savePrediction = async (data) => {
  const collection = firestore.collection("prediction");
  await collection.doc(data.id).set(data);
  console.log("Prediction saved to Firestore:", data);
};

const getPredictionHistories = async () => {
  const collection = firestore.collection("prediction");
  const snapshot = await collection.get();

  if (snapshot.empty) {
    return [];
  }

  const histories = [];
  snapshot.forEach((doc) => {
    histories.push({
      id: doc.id,
      history: doc.data(),
    });
  });

  return histories;
};

module.exports = { savePrediction, getPredictionHistories };
