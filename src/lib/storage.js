import fs from "fs";
import path from "path";
import { ENV } from "../config/env.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── buildFileKey — défini localement pour éviter l'import minio en mode local
export function buildFileKey(siteCode, auditId, category, filename) {
  const ext = path.extname(filename) || ".jpg";
  const basename = path
    .basename(filename, ext)
    .replace(/\s+/g, "_")
    .toLowerCase();
  const ts = Date.now();
  return `audits/${siteCode}/${auditId}/${category}/${basename}_${ts}${ext}`;
}

// ─── Stockage local ───────────────────────────────────────────────────────────
export async function uploadFileLocal(key, buffer) {
  const fullPath = path.join(UPLOAD_DIR, key);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, buffer);
  return `${ENV.API_URL || `http://localhost:${ENV.PORT}`}/uploads/${key}`;
}

export async function deleteFileLocal(key) {
  const fullPath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

// ─── Fonctions universelles ───────────────────────────────────────────────────
export async function uploadFile(key, buffer, mimeType = "image/jpeg") {
  if (ENV.STORAGE === "local") {
    return uploadFileLocal(key, buffer);
  }
  const { uploadFile: uploadToS3 } = await import("./minio.js");
  return uploadToS3(key, buffer, mimeType);
}

export async function deleteFile(key) {
  if (ENV.STORAGE === "local") {
    return deleteFileLocal(key);
  }
  const { deleteFile: deleteFromS3 } = await import("./minio.js");
  return deleteFromS3(key);
}
