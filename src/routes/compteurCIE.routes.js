import { Elysia } from "elysia";
import { compteurCIEController } from "../controllers/compteurCIE.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  allRoles,
  adminOnly,
  supervisorOnly,
} from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCompteurCIESchema,
  updateCompteurCIESchema,
} from "../validations/compteurCIE.validation.js";

export const compteurCIERoutes = new Elysia({ prefix: "/compteur-cie" })

  .use(authMiddleware)
  .use(allRoles)

  // Récupérer le compteur d'un audit
  .get("/audit/:auditId", (ctx) => compteurCIEController.getByAudit(ctx), {
    detail: {
      tags: ["CompteurCIE"],
      summary: "Récupérer le compteur CIE d'un audit",
    },
  })

  // Créer — techniciens, superviseurs, admins
  .post("/", (ctx) => compteurCIEController.create(ctx), {
    beforeHandle: [validate(createCompteurCIESchema)],
    detail: {
      tags: ["CompteurCIE"],
      summary: "Créer un relevé compteur CIE",
    },
  })

  // Mettre à jour
  .patch("/:id", (ctx) => compteurCIEController.update(ctx), {
    beforeHandle: [validate(updateCompteurCIESchema)],
    detail: {
      tags: ["CompteurCIE"],
      summary: "Mettre à jour un compteur CIE",
    },
  })

  // Supprimer — admin uniquement
  .use(adminOnly)
  .delete("/:id", (ctx) => compteurCIEController.delete(ctx), {
    detail: {
      tags: ["CompteurCIE"],
      summary: "Supprimer un compteur CIE — admin uniquement",
    },
  });
