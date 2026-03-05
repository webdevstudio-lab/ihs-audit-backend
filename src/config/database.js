import mongoose from "mongoose";
import { ENV } from "./env.js";

export async function connectDB() {
  try {
    await mongoose.connect(ENV.MONGODB_URI, {
      dbName: ENV.MONGODB_DB_NAME,
    });
    console.log(`✅ MongoDB connecte : ${ENV.MONGODB_DB_NAME}`);
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("MongoDB deconnecte");
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB : connexion perdue");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB : reconnecte");
});
