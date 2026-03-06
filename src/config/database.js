// src/config/database.js
import mongoose from "mongoose";
import { ENV } from "./env.js";

const OPTIONS = {
  dbName: ENV.MONGODB_DB_NAME,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  heartbeatFrequencyMS: 30000,
  tlsInsecure: true, // ← fix bug Bun + mongodb+srv
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB : connexion perdue");
});
mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB : reconnecté");
});
mongoose.connection.on("error", (err) => {
  if (err?.message?.includes("subject")) return;
  if (err?.message?.includes("certificate")) return;
  console.error("❌ MongoDB erreur :", err.message);
});

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(ENV.MONGODB_URI, OPTIONS);
    console.log(`✅ MongoDB connecté : ${ENV.MONGODB_DB_NAME}`);
  } catch (err) {
    if (
      err?.message?.includes("subject") ||
      err?.message?.includes("certificate") ||
      err?.message?.includes("TLS")
    ) {
      console.warn("⚠ Erreur TLS — retry dans 2s...");
      await new Promise((r) => setTimeout(r, 2000));
      return connectDB();
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("MongoDB déconnecté");
}
