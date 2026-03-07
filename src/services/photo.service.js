import { Photo } from "../models/Photo.model.js";
import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";
import { Battery } from "../models/Battery.model.js";
import { Generator } from "../models/Generator.model.js";
import { Rectifier } from "../models/Rectifier.model.js";
import { SolarSystem } from "../models/SolarSystem.model.js";
import { FuelTank } from "../models/FuelTank.model.js";
import { Earthing } from "../models/Earthing.model.js";
import { CompteurCIE } from "../models/CompteurCIE.model.js";
import { uploadFile, deleteFile, buildFileKey } from "../lib/storage.js";
import {
  compressIfNeeded,
  generateThumbnail,
  getImageMetadata,
} from "../utils/fileHelper.js";
import { AUDIT_STATUS } from "../config/constants.js";

// Mapping catégorie photo → { modèle Mongoose, champ dans audit }
const CATEGORY_MODEL_MAP = {
  general: { Model: null, auditField: null }, // → Site
  generator: { Model: Generator, auditField: "generator" },
  rectifier: { Model: Rectifier, auditField: "rectifier" },
  battery: { Model: Battery, auditField: "battery" },
  solar: { Model: SolarSystem, auditField: "solar" },
  fuel_tank: { Model: FuelTank, auditField: "fuelTank" },
  earthing: { Model: Earthing, auditField: "earthing" },
  compteur: { Model: CompteurCIE, auditField: "compteurCIE" },
};

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
    }).populate("site", "code _id");

    if (!audit) throw new Error("Audit introuvable ou non modifiable");

    const siteCode = audit.site.code;

    // ── Compression + thumbnail ──
    const compressed = await compressIfNeeded(
      uploadedFile.buffer,
      uploadedFile.mimeType,
    );
    const thumbnail = await generateThumbnail(compressed);
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

    const [url, thumbnailUrl] = await Promise.all([
      uploadFile(fileKey, compressed, uploadedFile.mimeType),
      uploadFile(thumbKey, thumbnail, "image/jpeg"),
    ]);

    // ── Création du document Photo ──
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

    // ── Push dans audit.photos (toujours) ──
    await Audit.findByIdAndUpdate(auditId, { $push: { photos: photo._id } });

    // ── Push dans l'équipement ou le site selon la catégorie ──
    const mapping = CATEGORY_MODEL_MAP[category];

    if (category === "general") {
      // Photo du step général → liée au site
      await Site.findByIdAndUpdate(audit.site._id, {
        $push: { photos: photo._id },
      });
    } else if (mapping?.Model && mapping?.auditField) {
      // Photo équipement → liée au document équipement
      const equipId = audit[mapping.auditField];
      if (equipId) {
        await mapping.Model.findByIdAndUpdate(equipId, {
          $push: { photos: photo._id },
        });
      }
    }

    return photo;
  } catch (err) {
    console.error("[PHOTO SERVICE ERROR]", err.message, err.stack);
    throw err;
  }
}

export async function getAuditPhotos(auditId, category = null) {
  const filter = { audit: auditId };
  if (category) filter.category = category;
  return Photo.find(filter).sort({ takenAt: -1 });
}

export async function deletePhoto(photoId, technicianId) {
  const photo = await Photo.findOne({ _id: photoId, takenBy: technicianId });
  if (!photo) throw new Error("Photo introuvable");

  // Supprime fichiers stockage
  await Promise.all([
    deleteFile(photo.filename),
    photo.thumbnailUrl
      ? deleteFile(photo.filename.replace(/(\.\w+)$/, "_thumb$1"))
      : Promise.resolve(),
  ]);

  // Retire de audit.photos
  await Audit.findByIdAndUpdate(photo.audit, { $pull: { photos: photo._id } });

  // Retire de l'équipement ou du site
  const mapping = CATEGORY_MODEL_MAP[photo.category];
  if (photo.category === "general") {
    const audit = await Audit.findById(photo.audit).select("site");
    if (audit?.site) {
      await Site.findByIdAndUpdate(audit.site, {
        $pull: { photos: photo._id },
      });
    }
  } else if (mapping?.Model && mapping?.auditField) {
    const audit = await Audit.findById(photo.audit).select(mapping.auditField);
    const equipId = audit?.[mapping.auditField];
    if (equipId) {
      await mapping.Model.findByIdAndUpdate(equipId, {
        $pull: { photos: photo._id },
      });
    }
  }

  await photo.deleteOne();
  return { deleted: true };
}
