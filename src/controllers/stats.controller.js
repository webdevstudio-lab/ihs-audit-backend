import {
  getGlobalStats,
  getStatsByZone,
  getStatsByClient,
  getCriticalityMatrix,
  getRecentActivity,
  getTechnicianStats,
  getCriticalSites,
  getAuditTrend,
  getStatsByPriority,
  getStatsByTypology,
  getDashboard,
} from "../services/stats.service.js";
import { success, error } from "../utils/response.js";

export const statsController = {
  // GET /stats/dashboard — tout en un seul appel
  async dashboard(ctx) {
    try {
      const data = await getDashboard();
      return success(data);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/global
  async global(ctx) {
    try {
      const stats = await getGlobalStats();
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/zones
  async zones(ctx) {
    try {
      const stats = await getStatsByZone();
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/clients
  async clients(ctx) {
    try {
      const stats = await getStatsByClient();
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/priority
  async priority(ctx) {
    try {
      const stats = await getStatsByPriority();
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/typology
  async typology(ctx) {
    try {
      const stats = await getStatsByTypology();
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/criticality
  async criticality(ctx) {
    try {
      const matrix = await getCriticalityMatrix();
      return success(matrix);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/activity?limit=20
  async activity(ctx) {
    try {
      const limit = parseInt(ctx.query?.limit) || 20;
      const activity = await getRecentActivity(limit);
      return success(activity);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/trend?days=30
  async trend(ctx) {
    try {
      const days = parseInt(ctx.query?.days) || 30;
      const data = await getAuditTrend(days);
      return success(data);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/critical-sites?limit=10
  async criticalSites(ctx) {
    try {
      const limit = parseInt(ctx.query?.limit) || 10;
      const sites = await getCriticalSites(limit);
      return success(sites);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/technician/:id
  async technician(ctx) {
    try {
      const stats = await getTechnicianStats(ctx.params.id);
      return success(stats);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/equipment
  async equipment(ctx) {
    try {
      const { getEquipmentStats } =
        await import("../services/stats.service.js");
      const data = await getEquipmentStats();
      return success(data);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /stats/equipment/search?type=rectifier&brand=Delta&condition=poor
  async equipmentSearch(ctx) {
    try {
      const { type, brand, condition } = ctx.query;
      if (!type) {
        ctx.set.status = 400;
        return error(
          "Le paramètre 'type' est obligatoire (generator|rectifier|battery|solar)",
        );
      }
      const { getSitesByEquipment } =
        await import("../services/stats.service.js");
      const sites = await getSitesByEquipment({ type, brand, condition });
      return success(sites);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
