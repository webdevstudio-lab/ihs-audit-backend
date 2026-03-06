import { Photo } from "../models/Photo.model.js";
import { Audit } from "../models/Audit.model.js";
import { uploadFile, deleteFile, buildFileKey } from "../lib/storage.js";
import {
  compressIfNeeded,
  generateThumbnail,
  getImageMetadata,
} from "../utils/fileHelper.js";
import { AUDIT_STATUS } from "../config/constants.js";

/**
 * Upload une photo et la lie a un audit
 *
 * @param {string} auditId      - ID de l'audit
 * @param {string} technicianId - ID du technicien
 * @param {Object} uploadedFile - { buffer, name, mimeType, size }
 * @param {string} category     - Categorie (generator, battery...)
 * @param {string} caption      - Description courte
 * @param {Object} coordinates  - { lat, lng } optionnel
 */
// photo.service.js — dans uploadPhoto(), remplacez le bloc principal par :
export async function uploadPhoto(
  auditId,
  technicianId,
  uploadedFile,
  category,
  caption = "",
  coordinates = null,
) {
  try {
    const audit = await Audit.findOne({
      _id: auditId,
      technician: technicianId,
      status: { $in: [AUDIT_STATUS.IN_PROGRESS, AUDIT_STATUS.DRAFT] },
    }).populate("site", "code");

    if (!audit) throw new Error("Audit introuvable ou non modifiable");

    console.log("[PHOTO] audit ok →", audit._id);
    console.log("[PHOTO] uploadedFile →", {
      name: uploadedFile?.name,
      mimeType: uploadedFile?.mimeType,
      size: uploadedFile?.size,
      hasBuffer: !!uploadedFile?.buffer,
      bufferLen: uploadedFile?.buffer?.length,
    });

    const siteCode = audit.site.code;
    const compressed = await compressIfNeeded(
      uploadedFile.buffer,
      uploadedFile.mimeType,
    );
    console.log("[PHOTO] compressed ok →", compressed?.length, "bytes");

    const thumbnail = await generateThumbnail(compressed);
    console.log("[PHOTO] thumbnail ok");

    const meta = await getImageMetadata(compressed);
    const fileKey = buildFileKey(
      siteCode,
      auditId,
      category,
      uploadedFile.name,
    );
    const thumbKey = buildFileKey(
      siteCode,
      auditId,
      `${category}_thumb`,
      uploadedFile.name,
    );

    console.log("[PHOTO] uploading to storage →", fileKey);
    const [url, thumbnailUrl] = await Promise.all([
      uploadFile(fileKey, compressed, uploadedFile.mimeType),
      uploadFile(thumbKey, thumbnail, "image/jpeg"),
    ]);
    console.log("[PHOTO] storage ok →", url);

    const photo = await Photo.create({
      audit: auditId,
      takenBy: technicianId,
      filename: fileKey,
      url,
      thumbnailUrl,
      sizeBytes: meta.sizeBytes,
      mimeType: uploadedFile.mimeType,
      category,
      caption,
      coordinates,
      takenAt: new Date(),
    });

    await Audit.findByIdAndUpdate(auditId, { $push: { photos: photo._id } });
    return photo;
  } catch (err) {
    // ← CE LOG VA APPARAÎTRE DANS VOTRE TERMINAL SERVEUR
    console.error("[PHOTO SERVICE ERROR]", err.message);
    console.error(err.stack);
    throw err;
  }
}
/**
 * Recupere toutes les photos d'un audit
 * Peut filtrer par categorie
 */
export async function getAuditPhotos(auditId, category = null) {
  const filter = { audit: auditId };
  if (category) filter.category = category;

  return Photo.find(filter).sort({ takenAt: -1 });
}

/**
 * Supprime une photo
 */
export async function deletePhoto(photoId, technicianId) {
  const photo = await Photo.findOne({
    _id: photoId,
    takenBy: technicianId,
  });

  if (!photo) throw new Error("Photo introuvable");

  // Supprime les fichiers sur MinIO
  await Promise.all([
    deleteFile(photo.filename),
    photo.thumbnailUrl
      ? deleteFile(photo.filename.replace(/(\.\w+)$/, "_thumb$1"))
      : Promise.resolve(),
  ]);

  // Supprime la reference dans l'audit
  await Audit.findByIdAndUpdate(photo.audit, {
    $pull: { photos: photo._id },
  });

  // Supprime le document
  await photo.deleteOne();

  return { deleted: true };
}
