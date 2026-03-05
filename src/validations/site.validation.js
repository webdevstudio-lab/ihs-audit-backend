import { z } from "zod";
import {
  ZONES,
  SITE_ACCESS,
  KEY_LOCATION,
  CONTACT_TYPE,
  CLIENTS,
} from "../config/constants.js";

// Schema contact sur site
const contactSchema = z.object({
  type: z.enum(Object.values(CONTACT_TYPE)).optional(),

  name: z.string().trim().optional(),

  phone: z.string().trim().optional(),

  phone2: z.string().trim().optional(),

  notes: z.string().trim().optional(),
});

// Creation d'un site
export const createSiteSchema = z.object({
  code: z
    .string({ required_error: "Code site obligatoire" })
    .toUpperCase()
    .trim()
    .min(3, "Code trop court"),

  name: z
    .string({ required_error: "Nom site obligatoire" })
    .trim()
    .min(2, "Nom trop court"),

  city: z.string({ required_error: "Ville obligatoire" }).trim(),

  region: z.string().trim().optional(),

  zone: z
    .enum(Object.values(ZONES), {
      errorMap: () => ({ message: "Zone invalide" }),
    })
    .optional(),

  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),

  address: z.string().trim().optional(),

  clients: z.array(z.enum(CLIENTS)).min(1, "Au moins un client requis"),

  accessLevel: z.enum(Object.values(SITE_ACCESS)).optional(),

  accessNotes: z.string().trim().optional(),

  keyLocation: z.enum(Object.values(KEY_LOCATION)).optional(),

  keyNotes: z.string().trim().optional(),

  contacts: z.array(contactSchema).optional(),

  notes: z.string().trim().optional(),
});

// Mise a jour d'un site (tous les champs optionnels)
export const updateSiteSchema = createSiteSchema.partial();
