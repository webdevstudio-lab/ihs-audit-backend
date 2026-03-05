import { Elysia } from "elysia";
import { auditController } from "../controllers/audit.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { supervisorOnly, allRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  startAuditSchema,
  updateCommentsSchema,
  submitAuditSchema,
} from "../validations/audit.validation.js";

export const auditRoutes = new Elysia({ prefix: "/audits" })

  .use(authMiddleware)
  .use(allRoles)

  // Demarrer un audit — technicien saisit le code site
  .post("/start", (ctx) => auditController.start(ctx), {
    beforeHandle: [validate(startAuditSchema)],
    detail: {
      tags: ["Audits"],
      summary: "Demarrer un audit sur un site",
    },
  })

  // Liste des audits
  .get("/", (ctx) => auditController.list(ctx), {
    detail: {
      tags: ["Audits"],
      summary: "Liste des audits",
    },
  })

  // Detail d'un audit
  .get("/:id", (ctx) => auditController.getOne(ctx), {
    detail: {
      tags: ["Audits"],
      summary: "Detail complet d un audit",
    },
  })

  // Mettre a jour les commentaires
  .patch("/:id/comments", (ctx) => auditController.updateComments(ctx), {
    beforeHandle: [validate(updateCommentsSchema)],
    detail: {
      tags: ["Audits"],
      summary: "Mettre a jour les commentaires d un audit",
    },
  })

  // Soumettre un audit
  .post("/:id/submit", (ctx) => auditController.submit(ctx), {
    beforeHandle: [validate(submitAuditSchema)],
    detail: {
      tags: ["Audits"],
      summary: "Soumettre un audit pour validation",
    },
  })

  // Valider un audit — superviseurs et admins
  .use(supervisorOnly)
  .post("/:id/validate", (ctx) => auditController.validate(ctx), {
    detail: {
      tags: ["Audits"],
      summary: "Valider un audit soumis",
    },
  });
