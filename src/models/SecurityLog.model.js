import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: [
        "login_success",
        "login_failed",
        "logout",
        "logout_all",
        "token_refresh",
        "token_revoked",
        "account_locked",
        "unauthorized_access",
        "suspicious_activity",
        "rate_limit_hit",
        "ddos_blocked",
      ],
      required: true,
    },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: { type: String },
    userAgent: { type: String },
    method: { type: String },
    path: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
  },
  { timestamps: true },
);

// Suppression automatique apres 90 jours
securityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
securityLogSchema.index({ event: 1 });
securityLogSchema.index({ ip: 1 });
securityLogSchema.index({ severity: 1 });
securityLogSchema.index({ user: 1 });

export const SecurityLog = mongoose.model("SecurityLog", securityLogSchema);
