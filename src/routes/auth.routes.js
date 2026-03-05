import { Elysia } from "elysia";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { routeRateLimit } from "../middleware/security.middleware.js";
import {
  loginAdminSchema,
  loginTechSchema,
} from "../validations/auth.validation.js";
import { z } from "zod";

const refreshSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token obligatoire" }),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const authRoutes = new Elysia({ prefix: "/auth" })

  // Rate limit strict sur les connexions
  .use(routeRateLimit("auth"))

  // POST /api/auth/login/admin
  .post("/login/admin", (ctx) => authController.loginAdmin(ctx), {
    beforeHandle: [validate(loginAdminSchema)],
    detail: {
      tags: ["Auth"],
      summary: "Connexion admin ou superviseur",
    },
  })

  // POST /api/auth/login/tech
  .post("/login/tech", (ctx) => authController.loginTech(ctx), {
    beforeHandle: [validate(loginTechSchema)],
    detail: {
      tags: ["Auth"],
      summary: "Connexion technicien (nom + code)",
    },
  })

  // POST /api/auth/refresh — renouveler le token
  .post("/refresh", (ctx) => authController.refresh(ctx), {
    beforeHandle: [validate(refreshSchema)],
    detail: {
      tags: ["Auth"],
      summary: "Renouveler le token avec le refresh token",
    },
  })

  // ── Routes protegees ────────────────────────────────────────
  .use(authMiddleware)

  // GET /api/auth/me
  .get("/me", (ctx) => authController.me(ctx), {
    detail: {
      tags: ["Auth"],
      summary: "Profil de l utilisateur connecte",
    },
  })

  // POST /api/auth/logout
  .post("/logout", (ctx) => authController.logout(ctx), {
    beforeHandle: [validate(logoutSchema)],
    detail: {
      tags: ["Auth"],
      summary: "Deconnexion",
    },
  })

  // POST /api/auth/logout-all
  .post("/logout-all", (ctx) => authController.logoutAll(ctx), {
    detail: {
      tags: ["Auth"],
      summary: "Deconnexion de tous les appareils",
    },
  });
