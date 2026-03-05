import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const earthingSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // ── MESURE PRINCIPALE ───────────────────────────────────
    resistance: {
      type: Number,
      // Resistance de terre mesuree en Ohms
      // Norme : doit etre inferieure a 5 Ohms
    },

    // Appareil utilise pour la mesure
    measureDevice: {
      type: String,
      trim: true,
      // Ex: Fluke 1630, Megger DET2/2
    },

    // Conforme si resistance < 5 Ohms
    isCompliant: {
      type: Boolean,
      // Calcule automatiquement selon la resistance
    },

    // ── CONTROLES VISUELS ───────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    hasCorrosion: {
      type: Boolean,
      default: false,
      // Corrosion sur les conducteurs ou electrodes
    },

    hasBrokenConductor: {
      type: Boolean,
      default: false,
      // Conducteur de terre coupe ou endommage
    },

    hasLooseConnection: {
      type: Boolean,
      default: false,
      // Connexion desserree
    },

    // Nombre d'electrodes de terre installees
    electrodeCount: {
      type: Number,
    },

    // ── PHOTOS ──────────────────────────────────────────────
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
      },
    ],

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Calcul automatique de la conformite
earthingSchema.pre("save", function (next) {
  if (this.resistance !== undefined && this.resistance !== null) {
    this.isCompliant = this.resistance < 5;
  }
  next();
});

export const Earthing = mongoose.model("Earthing", earthingSchema);
