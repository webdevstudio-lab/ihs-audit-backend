import {
  isIpBlocked,
  checkDdos,
  detectAttack,
  sanitizeMongo,
  logSecurityEvent,
  getLockTimeRemaining,
} from "../lib/security.js";

/**
 * Middleware securite global — applique sur toutes les routes
 * Ordre : DDoS → IP bloquee → Detection attaque → Headers securite
 */
export const securityMiddleware = (app) =>
  app.onRequest(async ({ request, set }) => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const path = new URL(request.url).pathname;
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

    // 2. IP bloquee (brute force)
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

    // 3. Detection attaques sur l'URL
    const urlAttack = detectAttack(path + new URL(request.url).search);
    if (urlAttack.detected) {
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

    // 4. Headers de securite
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=()";
    set.headers["X-Powered-By"] = "IPT-PowerTech";

    // Ajoute les headers DDoS info
    set.headers["X-RateLimit-Limit"] = String(ddos.limit);
    set.headers["X-RateLimit-Remaining"] = String(ddos.remaining);
  });

/**
 * Middleware sanitisation — nettoie le body avant validation
 */
export const sanitizeMiddleware = (app) =>
  app.onBeforeHandle(async ({ request, body, set }) => {
    if (!body || typeof body !== "object") return;

    // Sanitise contre NoSQL injection
    const cleaned = sanitizeMongo(body);

    // Detection attaque dans le body
    const bodyAttack = detectAttack(JSON.stringify(cleaned));
    if (bodyAttack.detected) {
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

/**
 * Middleware rate limit specifique par route
 * Usage : .use(routeRateLimit('auth'))
 */
export const routeRateLimit = (type) => (app) =>
  app.onRequest(async ({ request, set }) => {
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
