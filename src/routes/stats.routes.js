import { Elysia } from "elysia";
import { statsController } from "../controllers/stats.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { supervisorOnly, allRoles } from "../middleware/role.middleware.js";

export const statsRoutes = new Elysia({ prefix: "/stats" })

  .use(authMiddleware)

  // Stats globales — superviseurs et admins (dashboard)
  .use(supervisorOnly)
  .get("/global", (ctx) => statsController.global(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "KPIs globaux du dashboard",
    },
  })

  .get("/zones", (ctx) => statsController.zones(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques par zone",
    },
  })

  .get("/criticality", (ctx) => statsController.criticality(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Matrice de criticite",
    },
  })

  .get("/activity", (ctx) => statsController.activity(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Activite recente terrain",
    },
  })

  .get("/critical-sites", (ctx) => statsController.criticalSites(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Sites critiques prioritaires",
    },
  })

  // Stats technicien — accessible a tous
  .use(allRoles)
  .get("/technician/:id", (ctx) => statsController.technician(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques d un technicien",
    },
  });
