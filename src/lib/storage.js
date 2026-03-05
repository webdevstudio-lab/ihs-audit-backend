import fs from "fs";
import path from "path";
import { ENV } from "../config/env.js";

// Dossier de sauvegarde local
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Cree le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Sauvegarde un fichier en local
 * @param {string} key    - Chemin relatif (ex: audits/ABJ-001/photo.jpg)
 * @param {Buffer} buffer - Contenu du fichier
 * @returns {string}      - URL publique
 */
export async function uploadFileLocal(key, buffer) {
  // Cree les sous-dossiers si necessaire
  const fullPath = path.join(UPLOAD_DIR, key);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Ecrit le fichier sur disque
  fs.writeFileSync(fullPath, buffer);

  // Retourne l'URL locale accessible via le serveur
  return `http://localhost:${ENV.PORT}/uploads/${key}`;
}

/**
 * Supprime un fichier local
 */
export async function deleteFileLocal(key) {
  const fullPath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Fonction universelle — choisit local ou MinIO selon .env
 */
export async function uploadFile(key, buffer, mimeType = "image/jpeg") {
  if (ENV.STORAGE === "local") {
    return uploadFileLocal(key, buffer);
  }

  // Sinon MinIO / R2
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

export { buildFileKey } from "./minio.js";
