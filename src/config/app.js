// app.js — version corrigée
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

// ← SUPPRIMÉ : le app.use() orphelin qui causait "app is not defined"

export function createApp() {
  const app = new Elysia()
    .use(corsPlugin)
    .use(securityMiddleware)
    .use(sanitizeMiddleware)
    .use(jwtPlugin)
    .use(swaggerPlugin)
    .use(storagePlugin)
    .use(websocketPlugin)
    .use(
      staticPlugin({
        assets: "uploads",
        prefix: "/uploads",
      }),
    )
    .use(loggerMiddleware)
    .use(routes)
    .get("/health", () => ({
      status: "ok",
      app: "IHS Audit API",
      version: "1.0.0",
      ws: "ws://localhost:3000/ws",
      time: new Date().toISOString(),
    }))
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
