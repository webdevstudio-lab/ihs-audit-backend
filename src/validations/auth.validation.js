import { z } from "zod";

// Connexion admin / superviseur (email + password)
export const loginAdminSchema = z.object({
  email: z
    .string({ required_error: "Email obligatoire" })
    .email("Email invalide")
    .toLowerCase(),

  password: z
    .string({ required_error: "Mot de passe obligatoire" })
    .min(6, "Mot de passe trop court (6 caracteres min)"),
});

// Connexion technicien (nom + techCode)
export const loginTechSchema = z.object({
  name: z
    .string({ required_error: "Nom obligatoire" })
    .min(2, "Nom trop court"),

  techCode: z
    .string({ required_error: "Code technicien obligatoire" })
    .toUpperCase()
    .regex(/^TECH-\d{3}$/, "Format invalide — exemple attendu : TECH-007"),
});
