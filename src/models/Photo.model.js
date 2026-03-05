import mongoose from "mongoose";
import { PHOTO_CATEGORY } from "../config/constants.js";

const photoSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // Qui a pris la photo
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── FICHIER ─────────────────────────────────────────────
    // Nom du fichier stocke sur MinIO
    filename: {
      type: String,
      required: true,
    },

    // URL publique pour affichage
    url: {
      type: String,
      required: true,
    },

    // URL miniature (generee automatiquement)
    thumbnailUrl: {
      type: String,
    },

    // Taille en octets
    sizeBytes: {
      type: Number,
    },

    mimeType: {
      type: String,
      default: "image/jpeg",
    },

    // ── CATEGORIE ───────────────────────────────────────────
    category: {
      type: String,
      enum: Object.values(PHOTO_CATEGORY),
      default: PHOTO_CATEGORY.GENERAL,
    },

    // Description courte de ce que montre la photo
    caption: {
      type: String,
      trim: true,
      // Ex: "Compteur horaire generateur", "Batterie gonflee string 2"
    },

    // Coordonnees GPS au moment de la prise
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Date/heure de la prise de vue
    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

photoSchema.index({ audit: 1 });
photoSchema.index({ category: 1 });

export const Photo = mongoose.model("Photo", photoSchema);
