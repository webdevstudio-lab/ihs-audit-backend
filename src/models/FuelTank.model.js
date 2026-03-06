import mongoose from "mongoose";
import { CONDITION } from "../config/constants.js";

const fuelTankSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // ── CARACTERISTIQUES ────────────────────────────────────
    capacityLiters: {
      type: Number,
      // Capacite totale du tank en litres
    },

    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      // Niveau de carburant en pourcentage (0-100%)
    },

    fuelLevelLiters: {
      type: Number,
      // Niveau en litres (calcule depuis fuelLevel x capacityLiters)
    },

    fuelType: {
      type: String,
      enum: ["diesel", "gasoline", "other"],
      default: "diesel",
    },

    // ── CONTROLES VISUELS ───────────────────────────────────
    condition: {
      type: String,
      enum: Object.values(CONDITION),
    },

    hasLeak: {
      type: Boolean,
      default: false,
    },

    hasCorrosion: {
      type: Boolean,
      default: false,
    },

    hasWaterInFuel: {
      type: Boolean,
      default: false,
      // Presence d'eau dans le carburant
    },

    isFuelFiltered: {
      type: Boolean,
      default: false,
      // Filtre a carburant present et en bon etat
    },

    // ── DERNIERE LIVRAISON ──────────────────────────────────
    lastRefillDate: {
      type: Date,
    },

    lastRefillLiters: {
      type: Number,
      // Quantite livree lors du dernier remplissage
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

// Calcul automatique du niveau en litres
fuelTankSchema.pre("save", function () {
  // ← supprimer "next"
  if (this.capacityLiters && this.fuelLevel !== undefined) {
    this.fuelLevelLiters = Math.round(
      (this.fuelLevel / 100) * this.capacityLiters,
    );
  }
});

export const FuelTank = mongoose.model("FuelTank", fuelTankSchema);
