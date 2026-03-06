import { Elysia } from "elysia";
import { siteController } from "../controllers/site.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createSiteSchema,
  updateSiteSchema,
} from "../validations/site.validation.js";
import { reopenAuditSchema } from "../validations/audit.validation.js";

const requireSupervisor = (ctx) => {
  const role = ctx.user?.role;
  if (!["admin", "supervisor"].includes(role)) {
    ctx.set.status = 403;
    throw new Error("Accès refusé — admin ou superviseur requis");
  }
};

const requireAdmin = (ctx) => {
  if (ctx.user?.role !== "admin") {
    ctx.set.status = 403;
    throw new Error("Accès refusé — admin requis");
  }
};

export const siteRoutes = new Elysia({ prefix: "/sites" })
  .use(authMiddleware)

  .get("/check/:code", (ctx) => siteController.checkStatus(ctx), {
    detail: {
      tags: ["Sites"],
      summary: "Verifie si un audit peut etre demarre sur ce site",
    },
  })

  .get("/code/:code", (ctx) => siteController.getByCode(ctx), {
    detail: { tags: ["Sites"], summary: "Recuperer un site par son code" },
  })

  .get("/", (ctx) => siteController.list(ctx), {
    detail: { tags: ["Sites"], summary: "Liste des sites telecom" },
  })

  .get("/:id", (ctx) => siteController.getOne(ctx), {
    detail: { tags: ["Sites"], summary: "Detail d un site" },
  })

  .post("/", (ctx) => siteController.create(ctx), {
    beforeHandle: [requireSupervisor, validate(createSiteSchema)],
    detail: { tags: ["Sites"], summary: "Creer un site telecom" },
  })

  .patch("/:id", (ctx) => siteController.update(ctx), {
    beforeHandle: [requireSupervisor, validate(updateSiteSchema)],
    detail: { tags: ["Sites"], summary: "Mettre a jour un site" },
  })

  .post("/:id/reopen", (ctx) => siteController.reopen(ctx), {
    beforeHandle: [requireSupervisor, validate(reopenAuditSchema)],
    detail: {
      tags: ["Sites"],
      summary: "Autoriser la reprise d un audit sur ce site",
    },
  })

  .delete("/:id", (ctx) => siteController.delete(ctx), {
    beforeHandle: [requireAdmin],
    detail: {
      tags: ["Sites"],
      summary: "Supprimer un site — admin uniquement",
    },
  });
