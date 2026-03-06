// src/lib/security.js
import { SecurityLog } from "../models/SecurityLog.model.js";

// ── CONFIG ────────────────────────────────────────────────────
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES) || 30;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;
const IS_DEV = process.env.NODE_ENV !== "production";

const DDOS_CONFIG = {
  windowMs: 60 * 1000,
  maxGlobal: IS_DEV ? 99999 : 500, // pas de limite en dev
  maxAuth: IS_DEV ? 99999 : 20,
  maxUpload: IS_DEV ? 99999 : 50,
  maxIa: IS_DEV ? 99999 : 30,
};

// ── PATTERNS ATTAQUES ─────────────────────────────────────────
// & et ; sont des chars légitimes dans les URLs/query params — exclus
const ATTACK_PATTERNS = [
  {
    name: "SQLi",
    // Seulement si précédé d'un espace ou début — évite les faux positifs
    pattern:
      /(\bSELECT\s+\*|\bUNION\s+SELECT|\bDROP\s+TABLE|\bINSERT\s+INTO|\bDELETE\s+FROM|\bEXEC\s*\()/i,
  },
  {
    name: "NoSQLi",
    pattern: /\$where|\$gt|\$lt|\$ne|\$regex|\$or|\$and/,
  },
  {
    name: "PathTraversal",
    pattern: /\.\.[/\\]/,
  },
  {
    name: "XSS",
    pattern: /<script[\s>]|javascript\s*:|onerror\s*=|onload\s*=|eval\s*\(/i,
  },
  {
    // Retiré & et ; — légitimes dans query strings
    // Retiré | simple — peut apparaître dans des valeurs légitimes
    name: "CmdInjection",
    pattern: /`|\$\(|\|\||&&|%0[aA]|%00/,
  },
  {
    name: "XXE",
    pattern: /<!ENTITY|<!DOCTYPE\s+[^>]*\[/i,
  },
];

// ── LOGS ──────────────────────────────────────────────────────
export async function logSecurityEvent({
  event,
  user = null,
  ip = "unknown",
  userAgent = "",
  method = "",
  path = "",
  details = {},
  severity = "low",
}) {
  try {
    await SecurityLog.create({
      event,
      user,
      ip,
      userAgent,
      method,
      path,
      details,
      severity,
    });
  } catch {
    // Ne pas crasher si le log échoue
  }
}

// ── BRUTE FORCE ───────────────────────────────────────────────
const attempts = new Map();

export function isIpBlocked(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    attempts.delete(ip);
    return false;
  }
  return false;
}

export function recordFailedAttempt(ip) {
  const rec = attempts.get(ip) || { count: 0, first: Date.now() };
  rec.count++;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCK_MS;
    console.warn(`[Security] IP bloquée : ${ip} pour ${LOCK_MINUTES} min`);
  }
  attempts.set(ip, rec);
  return rec;
}

export function clearFailedAttempts(ip) {
  attempts.delete(ip);
}

export function getLockTimeRemaining(ip) {
  const rec = attempts.get(ip);
  if (!rec?.lockedUntil) return 0;
  return Math.ceil((rec.lockedUntil - Date.now()) / 1000);
}

// ── DDOS ──────────────────────────────────────────────────────
const requestCounts = new Map();

export function checkDdos(ip, route = "global") {
  const key = `${ip}:${route}`;
  const limit =
    DDOS_CONFIG[`max${route.charAt(0).toUpperCase() + route.slice(1)}`] ??
    DDOS_CONFIG.maxGlobal;
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, start: now };

  if (now - record.start > DDOS_CONFIG.windowMs) {
    record.count = 0;
    record.start = now;
  }

  record.count++;
  requestCounts.set(key, record);

  return {
    allowed: record.count <= limit,
    count: record.count,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetIn: Math.ceil((DDOS_CONFIG.windowMs - (now - record.start)) / 1000),
  };
}

// ── SANITISATION NOSQL ────────────────────────────────────────
export function sanitizeMongo(obj) {
  if (Array.isArray(obj)) return obj.map(sanitizeMongo);
  if (obj !== null && typeof obj === "object") {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        console.warn(`[Security] Clé suspecte bloquée : "${key}"`);
        continue;
      }
      clean[key] = sanitizeMongo(value);
    }
    return clean;
  }
  return obj;
}

// ── DETECTION ATTAQUES ────────────────────────────────────────
export function detectAttack(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  for (const { name, pattern } of ATTACK_PATTERNS) {
    if (pattern.test(str)) return { detected: true, type: name };
  }
  return { detected: false };
}

// ── UTILS ─────────────────────────────────────────────────────
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null // null = localhost/inconnu
  );
}

export function isLocalhost(ip) {
  return !ip || ip === "127.0.0.1" || ip === "::1";
}

// ── NETTOYAGE PÉRIODIQUE ──────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of attempts.entries()) {
    if (rec.lockedUntil && rec.lockedUntil < now) attempts.delete(ip);
  }
  for (const [key, rec] of requestCounts.entries()) {
    if (now - rec.start > DDOS_CONFIG.windowMs * 2) requestCounts.delete(key);
  }
}, 60 * 1000);
