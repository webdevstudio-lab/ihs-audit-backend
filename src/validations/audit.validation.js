import { z } from "zod";

// Demarrer un audit — le technicien saisit le code du site
export const startAuditSchema = z.object({
  siteCode: z
    .string({ required_error: "Code site obligatoire" })
    .toUpperCase()
    .trim()
    .min(3, "Code site invalide"),
});

// Mettre a jour les commentaires d'un audit
export const updateCommentsSchema = z.object({
  comments: z
    .object({
      general: z.string().trim().optional(),
      generator: z.string().trim().optional(),
      rectifier: z.string().trim().optional(),
      battery: z.string().trim().optional(),
      solar: z.string().trim().optional(),
      earthing: z.string().trim().optional(),
      fuelTank: z.string().trim().optional(),
      access: z.string().trim().optional(),
      urgent: z.string().trim().optional(),
    })
    .optional(),

  technicianNotes: z.string().trim().optional(),
});

// Soumettre un audit (validation finale)
export const submitAuditSchema = z.object({
  technicianNotes: z.string().trim().optional(),
});

// Reouverture d'un audit (admin ou superviseur uniquement)
export const reopenAuditSchema = z.object({
  reason: z
    .string({ required_error: "Raison de reouverture obligatoire" })
    .trim()
    .min(10, "Raison trop courte (10 caracteres min)"),
});
