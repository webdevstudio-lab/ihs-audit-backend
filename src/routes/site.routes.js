import { Elysia } from "elysia";
import { siteController } from "../controllers/site.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { supervisorOnly, allRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSiteSchema,
  updateSiteSchema,
} from "../validations/site.validation.js";
import { reopenAuditSchema } from "../validations/audit.validation.js";

export const siteRoutes = new Elysia({ prefix: "/sites" })

  .use(authMiddleware)
  .use(allRoles)

  // Verification statut audit par code — technicien
  .get("/check/:code", (ctx) => siteController.checkStatus(ctx), {
    detail: {
      tags: ["Sites"],
      summary: "Verifie si un audit peut etre demarre sur ce site",
    },
  })

  // Recuperer un site par son code
  .get("/code/:code", (ctx) => siteController.getByCode(ctx), {
    detail: {
      tags: ["Sites"],
      summary: "Recuperer un site par son code",
    },
  })

  // Liste des sites
  .get("/", (ctx) => siteController.list(ctx), {
    detail: {
      tags: ["Sites"],
      summary: "Liste des sites telecom",
    },
  })

  // Detail d'un site
  .get("/:id", (ctx) => siteController.getOne(ctx), {
    detail: {
      tags: ["Sites"],
      summary: "Detail d un site",
    },
  })

  // Creation — superviseurs et admins
  .use(supervisorOnly)
  .post("/", (ctx) => siteController.create(ctx), {
    beforeHandle: [validate(createSiteSchema)],
    detail: {
      tags: ["Sites"],
      summary: "Creer un site telecom",
    },
  })

  // Mise a jour
  .patch("/:id", (ctx) => siteController.update(ctx), {
    beforeHandle: [validate(updateSiteSchema)],
    detail: {
      tags: ["Sites"],
      summary: "Mettre a jour un site",
    },
  })

  // Reouverture audit
  .post("/:id/reopen", (ctx) => siteController.reopen(ctx), {
    beforeHandle: [validate(reopenAuditSchema)],
    detail: {
      tags: ["Sites"],
      summary: "Autoriser la reprise d un audit sur ce site",
    },
  });
