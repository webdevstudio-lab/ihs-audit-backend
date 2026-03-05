import mongoose from "mongoose";
import {
  SITE_STATUS,
  ZONES,
  SITE_ACCESS,
  KEY_LOCATION,
  CONTACT_TYPE,
} from "../config/constants.js";

const siteContactSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CONTACT_TYPE),
    },

    name: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    phone2: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const siteSchema = new mongoose.Schema(
  {
    // ── IDENTIFICATION ──────────────────────────────────────
    code: {
      type: String,
      required: [true, "Code site obligatoire"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, "Nom site obligatoire"],
      trim: true,
    },

    // ── LOCALISATION ────────────────────────────────────────
    city: {
      type: String,
      required: [true, "Ville obligatoire"],
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    zone: {
      type: String,
      enum: Object.values(ZONES),
    },

    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    address: {
      type: String,
      trim: true,
    },

    // ── CLIENTS ─────────────────────────────────────────────
    clients: [
      {
        type: String,
        enum: ["MTN", "Orange", "Moov"],
      },
    ],

    // ── STATUT & SCORE ──────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(SITE_STATUS),
      default: SITE_STATUS.PENDING,
    },

    lastScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    lastAudit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
    },

    auditCount: {
      type: Number,
      default: 0,
    },

    // ── ACCES AU SITE ────────────────────────────────────────
    accessLevel: {
      type: String,
      enum: Object.values(SITE_ACCESS),
    },

    accessNotes: {
      type: String,
      trim: true,
    },

    // ── CLES DU SITE ─────────────────────────────────────────
    keyLocation: {
      type: String,
      enum: Object.values(KEY_LOCATION),
    },

    keyNotes: {
      type: String,
      trim: true,
    },

    // ── CONTACTS SUR SITE ────────────────────────────────────
    contacts: [siteContactSchema],

    // ── REPRISE D'AUDIT ──────────────────────────────────────
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reopenedAt: {
      type: Date,
    },

    // ── NOTES GENERALES ──────────────────────────────────────
    notes: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index — on ne remet pas code ici car deja unique:true dans le schema
siteSchema.index({ zone: 1 });
siteSchema.index({ status: 1 });
siteSchema.index({ clients: 1 });
siteSchema.index({ accessLevel: 1 });
siteSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });

export const Site = mongoose.model("Site", siteSchema);
