import { Elysia } from "elysia";
import { statsController } from "../controllers/stats.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { supervisorOnly, allRoles } from "../middleware/role.middleware.js";

export const statsRoutes = new Elysia({ prefix: "/stats" })

  .use(authMiddleware)
  .use(supervisorOnly)

  // ── DASHBOARD COMPLET ────────────────────────────────────
  .get("/dashboard", (ctx) => statsController.dashboard(ctx), {
    detail: {
      tags: ["Stats"],
      summary:
        "Dashboard complet — global + zones + clients + criticité + tendance",
    },
  })

  // ── KPIs GLOBAUX ─────────────────────────────────────────
  .get("/global", (ctx) => statsController.global(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "KPIs globaux du dashboard",
    },
  })

  // ── PAR ZONE ─────────────────────────────────────────────
  .get("/zones", (ctx) => statsController.zones(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques par zone géographique",
    },
  })

  // ── PAR CLIENT ───────────────────────────────────────────
  .get("/clients", (ctx) => statsController.clients(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques par client (MTN / Orange / Moov)",
    },
  })

  // ── PAR PRIORITÉ ─────────────────────────────────────────
  .get("/priority", (ctx) => statsController.priority(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques par priorité de site",
    },
  })

  // ── PAR TYPOLOGIE ────────────────────────────────────────
  .get("/typology", (ctx) => statsController.typology(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques par typologie énergétique",
    },
  })

  // ── MATRICE CRITICITÉ ────────────────────────────────────
  .get("/criticality", (ctx) => statsController.criticality(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Matrice de criticité des audits",
    },
  })

  // ── ACTIVITÉ RÉCENTE ─────────────────────────────────────
  .get("/activity", (ctx) => statsController.activity(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Activité récente terrain — ?limit=20",
    },
  })

  // ── TENDANCE AUDITS ──────────────────────────────────────
  .get("/trend", (ctx) => statsController.trend(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Évolution des audits — ?days=30",
    },
  })

  // ── SITES CRITIQUES ──────────────────────────────────────
  .get("/critical-sites", (ctx) => statsController.criticalSites(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Sites critiques prioritaires — ?limit=10",
    },
  })

  // ── STATS TECHNICIEN — tous rôles ────────────────────────
  .use(allRoles)
  .get("/technician/:id", (ctx) => statsController.technician(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Statistiques d'un technicien",
    },
  })

  // ── STATS ÉQUIPEMENTS ─────────────────────────────────
  .get("/equipment", (ctx) => statsController.equipment(ctx), {
    detail: {
      tags: ["Stats"],
      summary: "Stats équipements par marque/condition",
    },
  })

  // ── SITES PAR ÉQUIPEMENT ──────────────────────────────
  .get("/equipment/search", (ctx) => statsController.equipmentSearch(ctx), {
    detail: {
      tags: ["Stats"],
      summary:
        "Sites utilisant un équipement spécifique — ?type=rectifier&brand=Delta",
    },
  });
