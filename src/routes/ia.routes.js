import { Elysia } from "elysia";
import { iaController } from "../controllers/ia.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import { rateLimit } from "../middleware/ratelimit.middleware.js";

export const iaRoutes = new Elysia({ prefix: "/ia" })

  .use(authMiddleware)
  .use(allRoles)

  // Limite les appels IA (couteux en tokens)
  .use(rateLimit("default"))

  // Lancer l'analyse IA d'un audit
  .post("/:auditId/analyze", (ctx) => iaController.analyze(ctx), {
    detail: {
      tags: ["IA"],
      summary: "Lancer l analyse IA d un audit",
    },
  })

  // Generer le rapport complet
  .post("/:auditId/report", (ctx) => iaController.report(ctx), {
    detail: {
      tags: ["IA"],
      summary: "Generer le rapport Markdown complet",
    },
  })

  // Chat contextuel sur un audit
  .post("/:auditId/chat", (ctx) => iaController.chat(ctx), {
    detail: {
      tags: ["IA"],
      summary: "Chat IA contextuel sur un audit",
    },
  });
