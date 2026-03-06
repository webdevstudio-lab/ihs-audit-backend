import { config } from "dotenv";

config();

export const ENV = {
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_NAME: process.env.APP_NAME || "IHS Audit API",

  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ihs_audit",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "ihs_audit",

  JWT_SECRET: process.env.JWT_SECRET || "change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  STORAGE: process.env.STORAGE || "local",

  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minioadmin",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "minioadmin123",
  MINIO_BUCKET: process.env.MINIO_BUCKET || "ihs-audit-photos",
  MINIO_PUBLIC_URL:
    process.env.MINIO_PUBLIC_URL || "http://localhost:9000/ihs-audit-photos",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",
};

// Validation des variables critiques au demarrage
const REQUIRED = ["JWT_SECRET", "MONGODB_URI"];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.warn(`⚠ Warning: ${key} non defini dans .env`);
  }
}
