import {
  getGlobalStats,
  getStatsByZone,
  getCriticalityMatrix,
  getRecentActivity,
  getTechnicianStats,
  getCriticalSites,
} from "../services/stats.service.js";
import { success, error } from "../utils/response.js";

export const statsController = {
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

  // GET /stats/activity
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

  // GET /stats/critical-sites
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
};
