import {
  startAudit,
  getAuditById,
  getAudits,
  getMyAudits,
  updateGeneralSection, // ← remplace updateComments
  submitAudit,
  validateAudit,
  rejectAudit,
  deleteAudit,
  reopenAudit,
  computeAuditScore,
} from "../services/audit.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const auditController = {
  // POST /audits/start
  async start(ctx) {
    try {
      const { siteCode } = ctx.body;
      if (!siteCode) {
        ctx.set.status = 400;
        return error("siteCode requis");
      }
      const audit = await startAudit(siteCode, ctx.user._id);
      ctx.set.status = 201;
      return success(audit, "Audit démarré");
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

  // GET /audits/mine
  async mine(ctx) {
    try {
      const audits = await getMyAudits(ctx.user._id);
      return success(audits);
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
  // Sauvegarde les commentaires + met à jour les infos du site
  async updateComments(ctx) {
    try {
      const result = await updateGeneralSection(
        ctx.params.id,
        ctx.user._id,
        ctx.body,
      );
      return success(result, "Section générale mise à jour");
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
      return success(audit, "Audit soumis avec succès");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/validate
  async validate(ctx) {
    try {
      const audit = await validateAudit(ctx.params.id, ctx.user._id);
      return success(audit, "Audit validé avec succès");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/reject
  async reject(ctx) {
    try {
      const { corrections } = ctx.body;
      if (!corrections?.trim()) {
        ctx.set.status = 400;
        return error("Les corrections à effectuer sont obligatoires");
      }
      const audit = await rejectAudit(ctx.params.id, ctx.user._id, corrections);
      return success(audit, "Audit refusé — technicien notifié");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // DELETE /audits/:id
  async remove(ctx) {
    try {
      const result = await deleteAudit(ctx.params.id);
      return success(result, "Audit supprimé — site repassé en attente");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/reopen
  async reopen(ctx) {
    try {
      const { reason } = ctx.body;
      if (!reason?.trim()) {
        ctx.set.status = 400;
        return error("La raison de réouverture est obligatoire");
      }
      const audit = await reopenAudit(ctx.params.id, ctx.user._id, reason);
      return success(audit, "Audit réouvert");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /audits/:id/score
  async computeScore(ctx) {
    try {
      const result = await computeAuditScore(ctx.params.id);
      return success(result, "Score calculé");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
