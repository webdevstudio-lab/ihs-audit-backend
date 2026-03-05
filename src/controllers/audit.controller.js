import {
  startAudit,
  getAuditById,
  getAudits,
  updateComments,
  submitAudit,
  validateAudit,
} from "../services/audit.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const auditController = {
  // POST /audits/start
  async start(ctx) {
    try {
      const { siteCode } = ctx.body;
      const audit = await startAudit(siteCode, ctx.user._id);
      ctx.set.status = 201;
      return success(audit, "Audit demarre");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /audits
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const { status, zone, technicianId, siteId } = ctx.query;

      const { audits, total } = await getAudits({
        status,
        zone,
        technicianId,
        siteId,
        page,
        limit,
        skip,
      });

      return paginated(audits, total, page, limit);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /audits/:id
  async getOne(ctx) {
    try {
      const audit = await getAuditById(ctx.params.id);
      return success(audit);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // PATCH /audits/:id/comments
  async updateComments(ctx) {
    try {
      const audit = await updateComments(ctx.params.id, ctx.user._id, ctx.body);
      return success(audit, "Commentaires mis a jour");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/submit
  async submit(ctx) {
    try {
      const audit = await submitAudit(
        ctx.params.id,
        ctx.user._id,
        ctx.body?.technicianNotes,
      );
      return success(audit, "Audit soumis avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/validate
  async validate(ctx) {
    try {
      const audit = await validateAudit(ctx.params.id, ctx.user._id);
      return success(audit, "Audit valide");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
