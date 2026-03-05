import {
  isIpBlocked,
  checkDdos,
  detectAttack,
  sanitizeMongo,
  logSecurityEvent,
  getLockTimeRemaining,
} from "../lib/security.js";

export const securityMiddleware = (app) =>
  app.onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;

    // Ignore WebSocket
    if (path.startsWith("/ws")) return;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const method = request.method;

    // 1. Anti-DDoS
    const ddos = checkDdos(ip, "global");
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
      throw new Error(`Trop de requetes — reessayez dans ${ddos.resetIn}s`);
    }

    // 2. IP bloquee
    if (isIpBlocked(ip)) {
      const remaining = getLockTimeRemaining(ip);
      await logSecurityEvent({
        event: "account_locked",
        ip,
        severity: "high",
        details: { remaining },
      });
      set.status = 429;
      throw new Error(`IP bloquee — reessayez dans ${remaining}s`);
    }

    // 3. Detection attaques URL
    const fullUrl = path + new URL(request.url).search;
    const urlAttack = detectAttack(fullUrl);
    if (urlAttack.detected) {
      console.log("🔴 Attaque détectée:", urlAttack.type, "| URL:", fullUrl);
      await logSecurityEvent({
        event: "suspicious_activity",
        ip,
        userAgent,
        method,
        path,
        severity: "critical",
        details: { type: urlAttack.type, source: "url" },
      });
      set.status = 400;
      throw new Error("Requete invalide");
    }

    // 4. Headers securite
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=()";
    set.headers["X-Powered-By"] = "IPT-PowerTech";
    set.headers["X-RateLimit-Limit"] = String(ddos.limit);
    set.headers["X-RateLimit-Remaining"] = String(ddos.remaining);
  });

export const sanitizeMiddleware = (app) =>
  app.onBeforeHandle(async ({ request, body, set }) => {
    const path = new URL(request.url).pathname;

    // Ignore WebSocket
    if (path.startsWith("/ws")) return;

    if (!body || typeof body !== "object") return;

    const cleaned = sanitizeMongo(body);
    const bodyAttack = detectAttack(JSON.stringify(cleaned));

    if (bodyAttack.detected) {
      console.log("🔴 Body attaque détectée:", bodyAttack.type);
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      await logSecurityEvent({
        event: "suspicious_activity",
        ip,
        severity: "critical",
        details: { type: bodyAttack.type, source: "body" },
      });
      set.status = 400;
      throw new Error("Donnees invalides");
    }
  });

export const routeRateLimit = (type) => (app) =>
  app.onRequest(async ({ request, set }) => {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/ws")) return;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
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
      throw new Error(`Limite atteinte — reessayez dans ${ddos.resetIn}s`);
    }
  });
