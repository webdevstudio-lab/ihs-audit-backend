import { Elysia } from "elysia";
import { corsPlugin } from "../plugins/cors.plugin.js";
import { jwtPlugin } from "../plugins/jwt.plugin.js";
import { swaggerPlugin } from "../plugins/swagger.plugin.js";
import { storagePlugin } from "../plugins/storage.plugin.js";
import { websocketPlugin } from "../plugins/websocket.plugin.js";
import { routes } from "../routes/index.js";
import { staticPlugin } from "@elysiajs/static";
import {
  securityMiddleware,
  sanitizeMiddleware,
} from "../middleware/security.middleware.js";
import { loggerMiddleware } from "../middleware/logger.middleware.js";

export function createApp() {
  const app = new Elysia()

    // ── SECURITE EN PREMIER ──────────────────────────────────
    .use(securityMiddleware)
    .use(sanitizeMiddleware)

    // ── PLUGINS ──────────────────────────────────────────────
    .use(corsPlugin)
    .use(jwtPlugin)
    .use(swaggerPlugin)
    .use(storagePlugin)
    .use(websocketPlugin)

    // ── FICHIERS STATIQUES (photos locales) ──────────────────
    .use(
      staticPlugin({
        assets: "uploads",
        prefix: "/uploads",
      }),
    )

    // ── LOGS ─────────────────────────────────────────────────
    .use(loggerMiddleware)

    // ── ROUTES ───────────────────────────────────────────────
    .use(routes)

    // ── HEALTH CHECK ─────────────────────────────────────────
    .get("/health", () => ({
      status: "ok",
      app: "IHS Audit API",
      version: "1.0.0",
      time: new Date().toISOString(),
    }))

    // ── ERREURS GLOBALES ─────────────────────────────────────
    .onError(({ code, error, set }) => {
      console.error(`[ERROR] ${code}:`, error.message);

      if (code === "NOT_FOUND") {
        set.status = 404;
        return { success: false, message: "Route introuvable", code: 404 };
      }

      if (code === "VALIDATION") {
        set.status = 422;
        return {
          success: false,
          message: "Donnees invalides",
          code: 422,
          details: error.message,
        };
      }

      set.status = 500;
      return {
        success: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Erreur serveur"
            : error.message,
        code: 500,
      };
    });

  return app;
}
