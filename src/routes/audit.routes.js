import Elysia from "elysia";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import { auditController } from "../controllers/audit.controller.js";

// Guard admin/superviseur — utilisé en beforeHandle pour éviter le bug Elysia de cascade
const requireSupervisor = (ctx) => {
  const role = ctx.user?.role;
  if (!["admin", "supervisor"].includes(role)) {
    ctx.set.status = 403;
    throw new Error("Accès refusé — admin ou superviseur requis");
  }
};

export const auditRoutes = new Elysia({ prefix: "/audits" })
  .use(authMiddleware)
  .use(allRoles)

  // ── Accessible à tous les rôles authentifiés ──────────────
  .get("/", (ctx) => auditController.list(ctx))
  .get("/mine", (ctx) => auditController.mine(ctx))
  .get("/:id", (ctx) => auditController.getOne(ctx))
  .post("/start", (ctx) => auditController.start(ctx))
  .patch("/:id/comments", (ctx) => auditController.updateComments(ctx))
  .post("/:id/submit", (ctx) => auditController.submit(ctx))

  // ── Admin / Superviseur uniquement ────────────────────────
  .post("/:id/validate", (ctx) => auditController.validate(ctx), {
    beforeHandle: [requireSupervisor],
  })
  .post("/:id/reject", (ctx) => auditController.reject(ctx), {
    beforeHandle: [requireSupervisor],
  })
  .post("/:id/reopen", (ctx) => auditController.reopen(ctx), {
    beforeHandle: [requireSupervisor],
  })
  .post("/:id/score", (ctx) => auditController.computeScore(ctx), {
    beforeHandle: [requireSupervisor],
  })
  .delete("/:id", (ctx) => auditController.remove(ctx), {
    beforeHandle: [requireSupervisor],
  });
