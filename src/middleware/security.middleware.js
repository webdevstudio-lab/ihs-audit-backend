// src/middleware/security.middleware.js
import {
  isIpBlocked,
  checkDdos,
  detectAttack,
  sanitizeMongo,
  logSecurityEvent,
  getLockTimeRemaining,
  getClientIp,
  isLocalhost,
} from "../lib/security.js";

const IS_DEV = process.env.NODE_ENV !== "production";

// Paths qui bypass totalement le middleware
const BYPASS_PATHS = ["/ws", "/uploads", "/docs", "/health"];

function shouldBypass(path) {
  return BYPASS_PATHS.some((p) => path.startsWith(p));
}

// Headers de sécurité appliqués à toutes les réponses
function applySecurityHeaders(set) {
  set.headers["X-Content-Type-Options"] = "nosniff";
  set.headers["X-Frame-Options"] = "DENY";
  set.headers["X-XSS-Protection"] = "1; mode=block";
  set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  set.headers["Permissions-Policy"] =
    "camera=(), microphone=(), geolocation=()";
  set.headers["X-Powered-By"] = "IPT-PowerTech";
  if (!IS_DEV) {
    set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
  }
}

// ── MIDDLEWARE PRINCIPAL ──────────────────────────────────────
export const securityMiddleware = (app) =>
  app.onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;

    // 1. Bypass total pour certains paths
    if (shouldBypass(path)) return;

    // 2. Headers de sécurité sur toutes les requêtes
    applySecurityHeaders(set);

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    // 3. Localhost bypass rate limit en dev
    if (isLocalhost(ip)) {
      // En dev on vérifie quand même les attaques URL pour détecter les bugs
      if (IS_DEV) {
        const fullUrl = path + new URL(request.url).search;
        const urlAttack = detectAttack(fullUrl);
        if (urlAttack.detected) {
          console.warn(
            `[Security-DEV] Pattern suspect détecté : ${urlAttack.type} | ${fullUrl}`,
          );
          // En dev on warn mais on ne bloque PAS — pour ne pas gêner le développement
        }
      }
      return;
    }

    // 4. Anti-DDoS (production uniquement)
    const ddos = checkDdos(ip, "global");
    set.headers["X-RateLimit-Limit"] = String(ddos.limit);
    set.headers["X-RateLimit-Remaining"] = String(ddos.remaining);

    if (!ddos.allowed) {
      await logSecurityEvent({
        event: "ddos_blocked",
        ip,
        userAgent,
        method,
        path,
        severity: "critical",
        details: { count: ddos.count, limit: ddos.limit },
      });
      set.status = 429;
      set.headers["Retry-After"] = String(ddos.resetIn);
      throw new Error(`Trop de requêtes — réessayez dans ${ddos.resetIn}s`);
    }

    // 5. IP bloquée (brute force)
    if (isIpBlocked(ip)) {
      const remaining = getLockTimeRemaining(ip);
      await logSecurityEvent({
        event: "account_locked",
        ip,
        severity: "high",
        details: { remaining },
      });
      set.status = 429;
      throw new Error(`IP bloquée — réessayez dans ${remaining}s`);
    }

    // 6. Détection attaques dans l'URL
    const fullUrl = path + new URL(request.url).search;
    const urlAttack = detectAttack(fullUrl);
    if (urlAttack.detected) {
      console.warn(
        `[Security] Attaque détectée : ${urlAttack.type} | ${fullUrl} | IP: ${ip}`,
      );
      await logSecurityEvent({
        event: "suspicious_activity",
        ip,
        userAgent,
        method,
        path,
        severity: "critical",
        details: { type: urlAttack.type, source: "url", url: fullUrl },
      });
      set.status = 400;
      throw new Error("Requête invalide");
    }
  });

// ── MIDDLEWARE SANITISATION BODY ──────────────────────────────
export const sanitizeMiddleware = (app) =>
  app.onBeforeHandle(async ({ request, body, set }) => {
    const path = new URL(request.url).pathname;

    if (shouldBypass(path)) return;
    if (!body || typeof body !== "object") return;

    // Sanitise les clés MongoDB
    const cleaned = sanitizeMongo(body);
    const bodyAttack = detectAttack(JSON.stringify(cleaned));

    if (bodyAttack.detected) {
      const ip = getClientIp(request) || "localhost";
      console.warn(`[Security] Attaque body : ${bodyAttack.type} | IP: ${ip}`);
      await logSecurityEvent({
        event: "suspicious_activity",
        ip,
        severity: "critical",
        details: { type: bodyAttack.type, source: "body" },
      });
      set.status = 400;
      throw new Error("Données invalides");
    }
  });

// ── RATE LIMIT PAR ROUTE ──────────────────────────────────────
// Usage : .use(routeRateLimit("auth"))  ou  .use(routeRateLimit("upload"))
export const routeRateLimit = (type) => (app) =>
  app.onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;
    if (shouldBypass(path)) return;

    const ip = getClientIp(request);
    if (isLocalhost(ip)) return; // pas de limite en local

    const ddos = checkDdos(ip, type);
    if (!ddos.allowed) {
      await logSecurityEvent({
        event: "rate_limit_hit",
        ip,
        severity: "medium",
        details: { type, count: ddos.count },
      });
      set.status = 429;
      set.headers["Retry-After"] = String(ddos.resetIn);
      throw new Error(`Limite atteinte — réessayez dans ${ddos.resetIn}s`);
    }
  });
