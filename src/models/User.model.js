import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },

    // Email uniquement pour admin et superviseur
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // Mot de passe uniquement pour admin et superviseur
    password: {
      type: String,
      select: false,
    },

    // Code unique pour les techniciens (ex: TECH-007)
    techCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.TECHNICIAN,
    },

    zone: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index — on ne remet pas techCode ici car deja unique:true dans le schema
userSchema.index({ role: 1 });
userSchema.index({ zone: 1 });

// Cache le mot de passe dans les reponses JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model("User", userSchema);
