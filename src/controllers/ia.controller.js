import {
  runAuditAnalysis,
  generateAuditReport,
  chatWithAudit,
} from "../services/ia.service.js";
import { success, error } from "../utils/response.js";

export const iaController = {
  // POST /ia/:auditId/analyze
  async analyze(ctx) {
    try {
      const result = await runAuditAnalysis(ctx.params.auditId);
      return success(result, "Analyse IA terminee");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /ia/:auditId/report
  async report(ctx) {
    try {
      const report = await generateAuditReport(ctx.params.auditId);
      return success({ report }, "Rapport genere");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /ia/:auditId/chat
  async chat(ctx) {
    try {
      const { messages } = ctx.body;

      if (!messages || !Array.isArray(messages)) {
        ctx.set.status = 400;
        return error("messages doit etre un tableau");
      }

      const response = await chatWithAudit(
        ctx.params.auditId,
        messages,
        ctx.user.role,
      );

      return success({ response }, "Reponse IA");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
