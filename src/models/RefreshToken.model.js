import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // On stocke uniquement le hash — jamais le token brut
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    // Informations appareil
    deviceInfo: {
      userAgent: String,
      ip: String,
      platform: String, // 'mobile' | 'web'
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },

    revokedAt: { type: Date },
    revokedReason: {
      type: String,
      enum: ["logout", "security", "expired", "replaced"],
    },

    // Pour tracer la chaine de rotation
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefreshToken",
    },
  },
  { timestamps: true },
);

// Suppression automatique apres expiration
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
