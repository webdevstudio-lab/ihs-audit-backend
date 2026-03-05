import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const rectifierSchema = new mongoose.Schema(
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
      // Ex: Eltek, Emerson, Huawei, ZTE, Delta
    },

    model: {
      type: String,
      trim: true,
    },

    serialNumber: {
      type: String,
      trim: true,
    },

    // ── CARACTERISTIQUES ────────────────────────────────────
    outputVoltage: {
      type: Number,
      // Tension de sortie en Volts (ex: 48V, 24V)
    },

    totalCapacityAmps: {
      type: Number,
      // Capacite totale en Amperes (ex: 200A, 400A)
    },

    modulesTotal: {
      type: Number,
      // Nombre total de modules installes
    },

    modulesOk: {
      type: Number,
      // Nombre de modules fonctionnels
    },

    // ── MESURES TERRAIN ─────────────────────────────────────
    measuredVoltage: {
      type: Number,
      // Tension mesuree au moment de l'audit (V DC)
    },

    measuredCurrent: {
      type: Number,
      // Courant mesure au moment de l'audit (A)
    },

    // ── ETAT ────────────────────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    isOperational: {
      type: Boolean,
    },

    hasAlarmActive: {
      type: Boolean,
      default: false,
      // Une alarme est-elle active sur le rectifier ?
    },

    hasDisplayFault: {
      type: Boolean,
      default: false,
      // L'ecran affiche-t-il une erreur ?
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

export const Rectifier = mongoose.model("Rectifier", rectifierSchema);
