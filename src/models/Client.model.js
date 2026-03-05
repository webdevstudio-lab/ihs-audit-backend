import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nom client obligatoire"],
      unique: true,
      trim: true,
      enum: ["MTN", "Orange", "Moov"],
    },

    color: {
      type: String,
      default: "#ffffff",
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

export const Client = mongoose.model("Client", clientSchema);
