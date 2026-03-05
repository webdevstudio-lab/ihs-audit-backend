import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const generatorSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // ── IDENTIFICATION ──────────────────────────────────────
    brand: {
      type: String,
      trim: true,
      // Ex: Perkins, Cummins, FG Wilson, Himoinsa, Sdmo
    },

    model: {
      type: String,
      trim: true,
    },

    serialNumber: {
      type: String,
      trim: true,
    },

    yearOfManufacture: {
      type: Number,
    },

    // ── CARACTERISTIQUES ────────────────────────────────────
    powerKva: {
      type: Number,
      // Puissance en KVA (ex: 100, 200, 500)
    },

    powerKw: {
      type: Number,
      // Puissance en KW
    },

    fuelType: {
      type: String,
      enum: ["diesel", "gasoline", "gas", "other"],
      default: "diesel",
    },

    // ── ETAT & FONCTIONNEMENT ───────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    isOperational: {
      type: Boolean,
      // Le groupe fonctionne-t-il ?
    },

    isAutoStart: {
      type: Boolean,
      // Demarrage automatique active ?
    },

    // Heures de fonctionnement sur le compteur horaire
    runningHours: {
      type: Number,
      min: 0,
    },

    // Seuil recommande pour la maintenance (ex: toutes les 500h)
    maintenanceIntervalHours: {
      type: Number,
      default: 500,
    },

    // Derniere maintenance effectuee (en heures compteur)
    lastMaintenanceHours: {
      type: Number,
    },

    // Date de la derniere maintenance
    lastMaintenanceDate: {
      type: Date,
    },

    // ── CONTROLES VISUELS ───────────────────────────────────
    hasOilLeak: {
      type: Boolean,
      default: false,
    },

    hasCoolantLeak: {
      type: Boolean,
      default: false,
    },

    hasFuelLeak: {
      type: Boolean,
      default: false,
    },

    hasExhaustIssue: {
      type: Boolean,
      default: false,
      // Fumee noire, bruit anormal...
    },

    batteryStarterCondition: {
      type: String,
      enum: Object.values(CONDITION),
      // Etat de la batterie de demarrage du groupe
    },

    // ── NIVEAUX ─────────────────────────────────────────────
    oilLevel: {
      type: String,
      enum: ["ok", "low", "critical", "unknown"],
    },

    coolantLevel: {
      type: String,
      enum: ["ok", "low", "critical", "unknown"],
    },

    // ── PHOTOS ──────────────────────────────────────────────
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
      },
    ],

    // ── COMMENTAIRE LIBRE ───────────────────────────────────
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Generator = mongoose.model("Generator", generatorSchema);
