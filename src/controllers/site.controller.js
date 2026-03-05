import {
  createSite,
  getSites,
  getSiteById,
  getSiteByCode,
  updateSite,
  checkSiteAuditStatus,
  reopenSiteAudit,
  deleteSite,
} from "../services/site.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const siteController = {
  // GET /sites
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const {
        zone,
        status,
        client,
        typology,
        configuration,
        siteType,
        priority,
        search,
      } = ctx.query;

      const { sites, total } = await getSites({
        zone,
        status,
        client,
        typology,
        configuration,
        siteType,
        priority,
        search,
        page,
        limit,
        skip,
      });

      return paginated(sites, total, page, limit);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /sites/:id
  async getOne(ctx) {
    try {
      const site = await getSiteById(ctx.params.id);
      return success(site);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // GET /sites/code/:code
  async getByCode(ctx) {
    try {
      const site = await getSiteByCode(ctx.params.code);
      return success(site);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // GET /sites/check/:code
  async checkStatus(ctx) {
    try {
      const result = await checkSiteAuditStatus(ctx.params.code);
      return success(result);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // POST /sites
  async create(ctx) {
    try {
      const site = await createSite(ctx.body);
      ctx.set.status = 201;
      return success(site, "Site cree avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /sites/:id
  async update(ctx) {
    try {
      const site = await updateSite(ctx.params.id, ctx.body);
      return success(site, "Site mis a jour");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /sites/:id/reopen
  async reopen(ctx) {
    try {
      const userId = ctx.user?._id || ctx.user?.id;
      const reason = ctx.body?.reason;
      const site = await reopenSiteAudit(ctx.params.id, userId, reason);
      return success(site, "Site rouvert");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
  // DELETE /sites/:id
  async delete(ctx) {
    try {
      const result = await deleteSite(ctx.params.id);
      return success(result, "Site supprimé avec succès");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
