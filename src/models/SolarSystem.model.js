import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const solarSystemSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // ── PANNEAUX ─────────────────────────────────────────────
    panelBrand: {
      type: String,
      trim: true,
    },

    panelModel: {
      type: String,
      trim: true,
    },

    panelCount: {
      type: Number,
      // Nombre total de panneaux installes
    },

    panelPowerWp: {
      type: Number,
      // Puissance unitaire en Watt-crete (ex: 250Wp, 400Wp)
    },

    totalPowerWp: {
      type: Number,
      // Puissance totale installee (panelCount x panelPowerWp)
    },

    panelCondition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    hasBrokenPanel: {
      type: Boolean,
      default: false,
    },

    brokenPanelCount: {
      type: Number,
      default: 0,
    },

    hasDirtyPanel: {
      type: Boolean,
      default: false,
      // Panneaux sales / poussiereux reduisant le rendement
    },

    // ── CONTROLEUR DE CHARGE ─────────────────────────────────
    controllerBrand: {
      type: String,
      trim: true,
      // Ex: Victron, Morningstar, EPSolar
    },

    controllerModel: {
      type: String,
      trim: true,
    },

    controllerType: {
      type: String,
      enum: ["MPPT", "PWM", "unknown"],
    },

    controllerCondition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    controllerHasAlarm: {
      type: Boolean,
      default: false,
    },

    // ── MESURES TERRAIN ─────────────────────────────────────
    measuredVoltage: {
      type: Number,
      // Tension mesuree en sortie panneau (V)
    },

    measuredCurrent: {
      type: Number,
      // Courant mesure (A)
    },

    // ── ETAT GENERAL ────────────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    isOperational: {
      type: Boolean,
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

// Calcul automatique puissance totale
solarSystemSchema.pre("save", function (next) {
  if (this.panelCount && this.panelPowerWp) {
    this.totalPowerWp = this.panelCount * this.panelPowerWp;
  }
  next();
});

export const SolarSystem = mongoose.model("SolarSystem", solarSystemSchema);
