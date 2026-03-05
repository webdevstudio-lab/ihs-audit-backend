import mongoose from "mongoose";

const clientLoadSchema = new mongoose.Schema(
  {
    audit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
    },

    // Client concerne (MTN, Orange, Moov)
    client: {
      type: String,
      enum: ["MTN", "Orange", "Moov"],
      required: true,
    },

    // ── EQUIPEMENTS CLIENT ──────────────────────────────────
    // Nombre de BTS / antennes du client sur ce site
    btsCount: {
      type: Number,
      default: 0,
    },

    // Consommation mesuree du client en Amperes
    measuredCurrentAmps: {
      type: Number,
    },

    // Consommation estimee en Watts
    estimatedPowerW: {
      type: Number,
    },

    // ── ETAT EQUIPEMENTS CLIENT ─────────────────────────────
    hasEquipmentAlarm: {
      type: Boolean,
      default: false,
    },

    isOperational: {
      type: Boolean,
      default: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ClientLoad = mongoose.model("ClientLoad", clientLoadSchema);
