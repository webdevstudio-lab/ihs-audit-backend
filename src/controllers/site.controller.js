import {
  createSite,
  getSites,
  getSiteByCode,
  getSiteById,
  updateSite,
  checkSiteAuditStatus,
  reopenSiteAudit,
} from "../services/site.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const siteController = {
  // GET /sites
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const { zone, status, client, search } = ctx.query;

      const { sites, total } = await getSites({
        zone,
        status,
        client,
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

  // GET /sites/check/:code
  // Le technicien saisit le code site — verifie si audit possible
  async checkStatus(ctx) {
    try {
      const result = await checkSiteAuditStatus(ctx.params.code);
      return success(result);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // POST /sites/:id/reopen
  // Admin ou superviseur autorise la reprise d'un audit
  async reopen(ctx) {
    try {
      const site = await reopenSiteAudit(
        ctx.params.id,
        ctx.user._id,
        ctx.body.reason,
      );
      return success(site, "Site reouvert pour nouvel audit");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
