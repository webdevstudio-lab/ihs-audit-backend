import { z } from "zod";
import { ROLES, ZONES } from "../config/constants.js";

// Creation d'un admin ou superviseur
export const createAdminSchema = z.object({
  name: z
    .string({ required_error: "Nom obligatoire" })
    .min(2, "Nom trop court")
    .trim(),

  email: z
    .string({ required_error: "Email obligatoire" })
    .email("Email invalide")
    .toLowerCase(),

  password: z
    .string({ required_error: "Mot de passe obligatoire" })
    .min(8, "Mot de passe trop court (8 caracteres min)"),

  role: z.enum([ROLES.ADMIN, ROLES.SUPERVISOR], {
    errorMap: () => ({ message: "Role invalide" }),
  }),

  zone: z
    .enum(Object.values(ZONES), {
      errorMap: () => ({ message: "Zone invalide" }),
    })
    .optional(),

  phone: z.string().trim().optional(),
});

// Creation d'un technicien (par admin ou superviseur)
export const createTechnicianSchema = z.object({
  name: z
    .string({ required_error: "Nom obligatoire" })
    .min(2, "Nom trop court")
    .trim(),

  techCode: z
    .string({ required_error: "Code technicien obligatoire" })
    .toUpperCase()
    .regex(/^TECH-\d{3}$/, "Format invalide — exemple attendu : TECH-007"),

  zone: z
    .enum(Object.values(ZONES), {
      errorMap: () => ({ message: "Zone invalide" }),
    })
    .optional(),

  phone: z.string().trim().optional(),
});

// Mise a jour d'un utilisateur
export const updateUserSchema = z.object({
  name: z.string().min(2, "Nom trop court").trim().optional(),

  phone: z.string().trim().optional(),

  zone: z.enum(Object.values(ZONES)).optional(),

  isActive: z.boolean().optional(),
});
