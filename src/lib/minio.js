import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../config/env.js";

// Instance unique du client S3/MinIO
const s3 = new S3Client({
  endpoint: ENV.MINIO_ENDPOINT,
  region: "us-east-1", // requis par le SDK meme pour MinIO
  credentials: {
    accessKeyId: ENV.MINIO_ACCESS_KEY,
    secretAccessKey: ENV.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // obligatoire pour MinIO
});

const BUCKET = ENV.MINIO_BUCKET;

/**
 * Upload un fichier sur MinIO
 * @param {string} key      - Nom du fichier dans le bucket (ex: audits/ABJ-001/photo.jpg)
 * @param {Buffer} body     - Contenu du fichier
 * @param {string} mimeType - Type MIME (ex: image/jpeg)
 */
export async function uploadFile(key, body, mimeType = "image/jpeg") {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: mimeType,
  });

  await s3.send(command);

  // Retourne l'URL publique
  return `${ENV.MINIO_PUBLIC_URL}/${key}`;
}

/**
 * Supprime un fichier du bucket
 * @param {string} key - Nom du fichier
 */
export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3.send(command);
}

/**
 * Genere une URL signee temporaire pour acces prive
 * @param {string} key       - Nom du fichier
 * @param {number} expiresIn - Duree en secondes (defaut: 1 heure)
 */
export async function getSignedFileUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Genere une cle unique pour stocker une photo
 * @param {string} siteCode   - Code du site (ex: ABJ-001)
 * @param {string} auditId    - ID de l'audit
 * @param {string} category   - Categorie (generator, battery...)
 * @param {string} filename   - Nom original du fichier
 */
export function buildFileKey(siteCode, auditId, category, filename) {
  const timestamp = Date.now();
  const ext = filename.split(".").pop();
  return `audits/${siteCode}/${auditId}/${category}/${timestamp}.${ext}`;
}

export default s3;
