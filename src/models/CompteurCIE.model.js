import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const compteurCIESchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // ── IDENTIFICATION ───────────────────────────────────────
    brand: {
      type: String,
      trim: true,
    },

    serialNumber: {
      type: String,
      trim: true,
    },

    // ── CARACTÉRISTIQUES ─────────────────────────────────────
    phaseType: {
      type: String,
      enum: ["monophase", "triphase"],
    },

    amperage: {
      type: String,
      enum: ["5A", "10A", "15A", "20A", "30A", "60A"],
    },

    // ── RELEVÉ TERRAIN ───────────────────────────────────────
    indexValue: {
      type: Number,
      min: 0,
      // Index relevé sur le compteur (kWh)
    },

    measuredVoltage: {
      type: Number,
      // Tension mesurée en Volts
    },

    measuredCurrent: {
      type: Number,
      // Courant mesuré en Ampères
    },

    // ── ÉTAT ─────────────────────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    isOperational: {
      type: Boolean,
    },

    isSealIntact: {
      type: Boolean,
      default: true,
      // Le plomb / scellé CIE est-il intact ?
    },

    hasAnomaly: {
      type: Boolean,
      default: false,
      // Anomalie détectée (compteur défaillant, fraude, etc.)
    },

    // ── PHOTOS ───────────────────────────────────────────────
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

export const CompteurCIE = mongoose.model("CompteurCIE", compteurCIESchema);
