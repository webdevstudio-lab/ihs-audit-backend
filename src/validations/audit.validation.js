import { z } from "zod";

export const startAuditSchema = z.object({
  siteCode: z
    .string({ required_error: "Code site obligatoire" })
    .toUpperCase()
    .trim()
    .min(3, "Code site invalide"),
});

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

  // ← AJOUT : infos site depuis section générale mobile
  siteUpdate: z
    .object({
      lat: z.string().optional(),
      lng: z.string().optional(),
      accessLevel: z.string().optional(),
      keyLocation: z.string().optional(),
      accessNotes: z.string().optional(),
      contactType: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      clients: z.array(z.string()).optional(),
      siteType: z.string().optional(),
    })
    .optional(),
});

export const submitAuditSchema = z.object({
  technicianNotes: z.string().trim().optional(),
});

export const rejectAuditSchema = z.object({
  corrections: z
    .string({ required_error: "Les corrections sont obligatoires" })
    .trim()
    .min(10, "Décrivez les corrections (10 caractères minimum)"),
});

export const reopenAuditSchema = z.object({
  reason: z
    .string({ required_error: "Raison de réouverture obligatoire" })
    .trim()
    .min(10, "Raison trop courte (10 caractères minimum)"),
});
