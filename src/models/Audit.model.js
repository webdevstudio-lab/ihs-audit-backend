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
      enum: ["draft", "in_progress", "submitted", "validated", "rejected"],
      default: AUDIT_STATUS.DRAFT,
    },
    visitDate: { type: Date, default: Date.now },

    // ── SCORE ────────────────────────────────────────────────
    globalScore: { type: Number, min: 0, max: 100 },
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

    // ── COMMENTAIRES PAR SECTION ─────────────────────────────
    comments: {
      general: { type: String, trim: true },
      generator: { type: String, trim: true },
      rectifier: { type: String, trim: true },
      battery: { type: String, trim: true },
      solar: { type: String, trim: true },
      earthing: { type: String, trim: true },
      fuelTank: { type: String, trim: true },
      access: { type: String, trim: true },
      urgent: { type: String, trim: true },
    },
    technicianNotes: { type: String, trim: true },

    // ── ANALYSE IA ───────────────────────────────────────────
    iaAnalysis: {
      issues: [String],
      recommendations: [String],
      summary: String,
    },
    iaReport: { type: String },

    // ── CORRECTIONS (refus admin) ─────────────────────────────
    corrections: { type: String, trim: true, default: null },
    rejectedAt: { type: Date, default: null },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── REPRISE D'AUDIT ──────────────────────────────────────
    isReopened: { type: Boolean, default: false },
    reopenedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reopenedAt: { type: Date },
    reopenReason: { type: String, trim: true },
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
  { timestamps: true },
);

auditSchema.index({ site: 1 });
auditSchema.index({ technician: 1 });
auditSchema.index({ status: 1 });
auditSchema.index({ visitDate: -1 });
auditSchema.index({ criticalityLevel: 1 });

export const Audit = mongoose.model("Audit", auditSchema);
