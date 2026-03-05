import { Elysia } from "elysia";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminOnly, supervisorOnly } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createAdminSchema,
  createTechnicianSchema,
  updateUserSchema,
} from "../validations/user.validation.js";

export const userRoutes = new Elysia({ prefix: "/users" })

  .use(authMiddleware)

  // Prochain code technicien disponible
  // Accessible aux admins et superviseurs
  .use(supervisorOnly)
  .get("/next-tech-code", (ctx) => userController.nextTechCode(ctx), {
    detail: {
      tags: ["Users"],
      summary: "Genere le prochain code technicien disponible",
    },
  })

  // Liste des utilisateurs
  .get("/", (ctx) => userController.list(ctx), {
    detail: {
      tags: ["Users"],
      summary: "Liste des utilisateurs",
    },
  })

  // Detail d'un utilisateur
  .get("/:id", (ctx) => userController.getOne(ctx), {
    detail: {
      tags: ["Users"],
      summary: "Detail d un utilisateur",
    },
  })

  // Mise a jour
  .patch("/:id", (ctx) => userController.update(ctx), {
    beforeHandle: [validate(updateUserSchema)],
    detail: {
      tags: ["Users"],
      summary: "Mettre a jour un utilisateur",
    },
  })

  // Activer / Desactiver
  .patch("/:id/toggle", (ctx) => userController.toggle(ctx), {
    detail: {
      tags: ["Users"],
      summary: "Activer ou desactiver un compte",
    },
  })

  // Creation admin — reservee aux admins uniquement
  .use(adminOnly)
  .post("/admin", (ctx) => userController.createAdmin(ctx), {
    beforeHandle: [validate(createAdminSchema)],
    detail: {
      tags: ["Users"],
      summary: "Creer un admin ou superviseur",
    },
  })

  // Creation technicien — admins et superviseurs
  .post("/technician", (ctx) => userController.createTechnician(ctx), {
    beforeHandle: [validate(createTechnicianSchema)],
    detail: {
      tags: ["Users"],
      summary: "Creer un technicien",
    },
  });
