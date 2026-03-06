import mongoose from "mongoose";
import {
  CONDITION,
  BATTERY_TYPE,
  BATTERY_VOLTAGE,
} from "../config/constants.js";

const batterySchema = new mongoose.Schema(
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
      // Ex: Enersys, Fiamm, Sonnenschein, Hoppecke, Narada
    },

    model: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: Object.values(BATTERY_TYPE),
      // VRLA, lithium, OPzV, OPzS, water_2v, water_12v
    },

    nominalVoltage: {
      type: Number,
      enum: Object.values(BATTERY_VOLTAGE),
      // Tension par element : 2V ou 12V
    },

    // ── CONFIGURATION ───────────────────────────────────────
    capacityAh: {
      type: Number,
      // Capacite nominale en Ampere-heure (ex: 200Ah, 500Ah)
    },

    numberOfStrings: {
      type: Number,
      // Nombre de chaines de batteries (strings)
      default: 1,
    },

    numberOfElementsPerString: {
      type: Number,
      // Nombre d'elements par chaine
      // Ex: pour du 48V avec elements 2V => 24 elements par string
    },

    totalElements: {
      type: Number,
      // Calcule automatiquement : strings x elementsParString
    },

    yearOfInstallation: {
      type: Number,
    },

    // ── ETAT GENERAL ────────────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    // ── CONTROLES VISUELS ───────────────────────────────────
    isSwollen: {
      type: Boolean,
      default: false,
      // Une ou plusieurs batteries gonflees ?
    },

    swollenCount: {
      type: Number,
      default: 0,
      // Nombre d'elements gonfles
    },

    hasLeak: {
      type: Boolean,
      default: false,
      // Fuite d'acide detectee ?
    },

    hasSulfation: {
      type: Boolean,
      default: false,
      // Sulfatation visible sur les bornes ?
    },

    hasCorrosion: {
      type: Boolean,
      default: false,
      // Corrosion sur les connexions ?
    },

    // Pour les batteries a eau uniquement
    waterLevel: {
      type: String,
      enum: ["ok", "low", "critical", "unknown", "not_applicable"],
      default: "not_applicable",
      // Niveau d'eau distillee
    },

    lastWaterRefillDate: {
      type: Date,
      // Derniere date de remplissage eau distillee
    },

    // ── MESURES TERRAIN ─────────────────────────────────────
    measuredVoltageTotal: {
      type: Number,
      // Tension totale du banc de batteries mesuree (V)
    },

    measuredVoltagePerElement: {
      type: Number,
      // Tension par element mesuree (V)
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

// Calcul automatique du nombre total d'elements avant sauvegarde
batterySchema.pre("save", function (next) {
  if (this.numberOfStrings && this.numberOfElementsPerString) {
    this.totalElements = this.numberOfStrings * this.numberOfElementsPerString;
  }
});

export const Battery = mongoose.model("Battery", batterySchema);
