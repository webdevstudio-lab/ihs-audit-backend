import { z } from "zod";
import {
  ZONES,
  SITE_ACCESS,
  KEY_LOCATION,
  CONTACT_TYPE,
  CLIENTS,
  SITE_TYPOLOGY,
  SITE_CONFIGURATION,
  SITE_TYPE,
  SITE_PRIORITY,
} from "../config/constants.js";

const contactSchema = z.object({
  type: z.enum(Object.values(CONTACT_TYPE)).optional(),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  phone2: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createSiteSchema = z.object({
  // Identité
  code: z
    .string({ required_error: "Code site obligatoire" })
    .toUpperCase()
    .trim()
    .min(3, "Code trop court"),

  name: z
    .string({ required_error: "Nom site obligatoire" })
    .trim()
    .min(2, "Nom trop court"),

  // Localisation
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

  // Clients
  clients: z.array(z.enum(CLIENTS)).min(1, "Au moins un client requis"),

  // ── NOUVEAUX CHAMPS ──────────────────────────────────────

  typology: z
    .enum(Object.values(SITE_TYPOLOGY), {
      errorMap: () => ({ message: "Typologie invalide" }),
    })
    .optional(),

  configuration: z
    .enum(Object.values(SITE_CONFIGURATION), {
      errorMap: () => ({
        message: "Configuration invalide — outdoor ou indoor",
      }),
    })
    .optional(),

  siteType: z
    .enum(Object.values(SITE_TYPE), {
      errorMap: () => ({
        message: "Type de site invalide — rooftop ou greenfield",
      }),
    })
    .optional(),

  priority: z
    .enum(Object.values(SITE_PRIORITY), {
      errorMap: () => ({ message: "Priorité invalide" }),
    })
    .optional(),

  // ── ACCES ────────────────────────────────────────────────

  accessLevel: z
    .enum(Object.values(SITE_ACCESS), {
      errorMap: () => ({ message: "Niveau d'accès invalide" }),
    })
    .optional(),

  accessNotes: z.string().trim().optional(),

  keyLocation: z
    .enum(Object.values(KEY_LOCATION), {
      errorMap: () => ({ message: "Localisation clés invalide" }),
    })
    .optional(),

  keyNotes: z.string().trim().optional(),

  contacts: z.array(contactSchema).optional(),

  notes: z.string().trim().optional(),
});

export const updateSiteSchema = createSiteSchema.partial();
