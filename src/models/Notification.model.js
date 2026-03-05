import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ── DESTINATAIRE ─────────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── TYPE ─────────────────────────────────────────────────
    type: {
      type: String,
      required: true,
      enum: [
        "audit_started", // Technicien a démarré un audit
        "audit_submitted", // Audit soumis — en attente validation
        "audit_validated", // Audit validé par superviseur
        "audit_reopened", // Audit rouvert
        "alert_critical", // Alerte critique détectée
        "alert_anomaly", // Anomalie détectée (compteur, équipement)
        "site_created", // Nouveau site créé
        "site_updated", // Site mis à jour
        "technician_active", // Technicien actif sur le terrain
        "technician_inactive", // Technicien désactivé
        "system", // Message système
      ],
      index: true,
    },

    // ── CONTENU ──────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ── PRIORITÉ ─────────────────────────────────────────────
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },

    // ── LIENS CONTEXTUELS ────────────────────────────────────
    // Référence vers l'objet concerné
    refModel: {
      type: String,
      enum: ["Audit", "Site", "User", null],
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // ── ÉTAT ─────────────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },

    // ── ÉMETTEUR ─────────────────────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Index composés
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });

// TTL — supprime automatiquement après 90 jours
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export const Notification = mongoose.model("Notification", notificationSchema);
