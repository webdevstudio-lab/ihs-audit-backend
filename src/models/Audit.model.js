import mongoose from "mongoose";
import { AUDIT_STATUS } from "../config/constants.js";

const auditSchema = new mongoose.Schema(
  {
    // ── LIENS ────────────────────────────────────────────────
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: [true, "Site obligatoire"],
    },

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Technicien obligatoire"],
    },

    // ── STATUT ───────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(AUDIT_STATUS),
      default: AUDIT_STATUS.DRAFT,
    },

    visitDate: {
      type: Date,
      default: Date.now,
    },

    // ── SCORE ────────────────────────────────────────────────
    globalScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    criticalityLevel: {
      type: String,
      enum: ["excellent", "normal", "elevated", "high", "critical", "unknown"],
    },

    // ── EQUIPEMENTS ──────────────────────────────────────────
    generator: { type: mongoose.Schema.Types.ObjectId, ref: "Generator" },
    rectifier: { type: mongoose.Schema.Types.ObjectId, ref: "Rectifier" },
    solar: { type: mongoose.Schema.Types.ObjectId, ref: "SolarSystem" },
    battery: { type: mongoose.Schema.Types.ObjectId, ref: "Battery" },
    compteurCIE: { type: mongoose.Schema.Types.ObjectId, ref: "CompteurCIE" },
    earthing: { type: mongoose.Schema.Types.ObjectId, ref: "Earthing" },
    fuelTank: { type: mongoose.Schema.Types.ObjectId, ref: "FuelTank" },

    clientLoads: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClientLoad" }],

    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],

    // ── COMMENTAIRES TECHNICIEN ───────────────────────────────
    // Chaque section a sa propre zone de commentaire
    comments: {
      // Observations generales sur le site
      general: {
        type: String,
        trim: true,
      },

      // Problemes signales sur le generateur
      generator: {
        type: String,
        trim: true,
      },

      // Problemes signales sur le rectifier
      rectifier: {
        type: String,
        trim: true,
      },

      // Problemes signales sur les batteries
      battery: {
        type: String,
        trim: true,
      },

      // Problemes signales sur les panneaux solaires
      solar: {
        type: String,
        trim: true,
      },

      // Problemes signales sur la prise de terre
      earthing: {
        type: String,
        trim: true,
      },

      // Problemes signales sur le tank carburant
      fuelTank: {
        type: String,
        trim: true,
      },

      // Problemes d'acces au site (portail ferme, route coupee...)
      access: {
        type: String,
        trim: true,
      },

      // Signalement urgent — remonte immediatement au superviseur
      urgent: {
        type: String,
        trim: true,
      },
    },

    // ── ANALYSE IA ───────────────────────────────────────────
    iaAnalysis: {
      issues: [String],
      recommendations: [String],
      summary: String,
    },

    iaReport: {
      type: String,
    },

    // ── REPRISE D'AUDIT ──────────────────────────────────────
    isReopened: {
      type: Boolean,
      default: false,
    },

    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reopenedAt: {
      type: Date,
    },

    reopenReason: {
      type: String,
      trim: true,
    },

    compteurCIE: { type: String, trim: true },

    previousAudit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
    },

    // ── VALIDATION ───────────────────────────────────────────
    submittedAt: { type: Date },
    validatedAt: { type: Date },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index
auditSchema.index({ site: 1 });
auditSchema.index({ technician: 1 });
auditSchema.index({ status: 1 });
auditSchema.index({ visitDate: -1 });
auditSchema.index({ criticalityLevel: 1 });

export const Audit = mongoose.model("Audit", auditSchema);
