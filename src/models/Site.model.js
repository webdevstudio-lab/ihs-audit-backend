import mongoose from "mongoose";
import {
  SITE_STATUS,
  SITE_ACCESS,
  KEY_LOCATION,
  CONTACT_TYPE,
  ZONES,
  CLIENTS,
  SITE_TYPOLOGY,
  SITE_CONFIGURATION,
  SITE_TYPE,
  SITE_PRIORITY,
} from "../config/constants.js";

const contactSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(CONTACT_TYPE) },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    phone2: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const coordinatesSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

const siteSchema = new mongoose.Schema(
  {
    // ── IDENTITE ─────────────────────────────────────────────
    code: {
      type: String,
      required: [true, "Code site obligatoire"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Nom site obligatoire"],
      trim: true,
    },

    // ── LOCALISATION ─────────────────────────────────────────
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

    coordinates: coordinatesSchema,

    address: {
      type: String,
      trim: true,
    },

    // ── CLIENTS ──────────────────────────────────────────────
    clients: {
      type: [{ type: String, enum: CLIENTS }],
      required: [true, "Au moins un client requis"],
      validate: {
        validator: (v) => v && v.length > 0,
        message: "Au moins un client requis",
      },
    },

    // ── CLASSIFICATION ───────────────────────────────────────
    typology: {
      type: String,
      enum: Object.values(SITE_TYPOLOGY),
    },

    configuration: {
      type: String,
      enum: Object.values(SITE_CONFIGURATION),
    },

    siteType: {
      type: String,
      enum: Object.values(SITE_TYPE),
    },

    priority: {
      type: String,
      enum: Object.values(SITE_PRIORITY),
      default: SITE_PRIORITY.MEDIUM,
    },

    // ── STATUT ───────────────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(SITE_STATUS),
      default: SITE_STATUS.PENDING,
      index: true,
    },

    // ── ACCES ────────────────────────────────────────────────
    accessLevel: {
      type: String,
      enum: Object.values(SITE_ACCESS),
    },

    accessNotes: {
      type: String,
      trim: true,
    },

    keyLocation: {
      type: String,
      enum: Object.values(KEY_LOCATION),
    },

    keyNotes: {
      type: String,
      trim: true,
    },

    // ── CONTACTS ─────────────────────────────────────────────
    contacts: [contactSchema],

    // ── AUDIT ────────────────────────────────────────────────
    lastAuditDate: {
      type: Date,
    },

    lastAuditScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── NOTES ────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index composés pour les requêtes fréquentes
siteSchema.index({ zone: 1, status: 1 });
siteSchema.index({ clients: 1 });
siteSchema.index({ priority: 1, status: 1 });
siteSchema.index({ typology: 1 });

export const Site = mongoose.model("Site", siteSchema);
