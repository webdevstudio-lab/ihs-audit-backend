import { z } from "zod";
import {
  CONDITION,
  COMPTEUR_AMPERAGE,
  COMPTEUR_PHASE,
} from "../config/constants.js";

export const createCompteurCIESchema = z.object({
  audit: z.string({ required_error: "Audit obligatoire" }),

  // Identification
  brand: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),

  // Caractéristiques
  phaseType: z
    .enum(Object.values(COMPTEUR_PHASE), {
      errorMap: () => ({
        message: "Type de phase invalide — monophase ou triphase",
      }),
    })
    .optional(),

  amperage: z
    .enum(Object.values(COMPTEUR_AMPERAGE), {
      errorMap: () => ({
        message: "Ampérage invalide — valeurs: 5A 10A 15A 20A 30A 60A",
      }),
    })
    .optional(),

  // Relevé terrain
  indexValue: z.number().min(0, "Index invalide").optional(),
  measuredVoltage: z.number().optional(),
  measuredCurrent: z.number().optional(),

  // État
  condition: z
    .enum(Object.values(CONDITION), {
      errorMap: () => ({ message: "Condition invalide" }),
    })
    .optional(),

  isOperational: z.boolean().optional(),
  isSealIntact: z.boolean().optional(),
  hasAnomaly: z.boolean().optional(),

  notes: z.string().trim().optional(),
});

export const updateCompteurCIESchema = createCompteurCIESchema.partial();
