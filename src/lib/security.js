import crypto from "crypto";
import { SecurityLog } from "../models/SecurityLog.model.js";

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES) || 30;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;

// ── LOGS ─────────────────────────────────────────────────────

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
    console.error("[SecurityLog] Erreur ecriture log");
  }
}

// ── BRUTE FORCE ───────────────────────────────────────────────

const attempts = new Map();

export function isIpBlocked(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;

  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return true;

  // Deverrouille automatiquement
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
    console.warn(`[Security] IP bloquee : ${ip} pour ${LOCK_MINUTES} min`);
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

// Compteur de requetes par IP (fenetre glissante)
const requestCounts = new Map();

const DDOS_CONFIG = {
  windowMs: 60 * 1000, // fenetre 1 minute
  maxGlobal: 200, // max requetes/min par IP (toutes routes)
  maxAuth: 10, // max tentatives connexion/min
  maxUpload: 20, // max uploads/min
  maxIa: 15, // max appels IA/min
};

export function checkDdos(ip, route = "global") {
  const key = `${ip}:${route}`;
  const limit =
    DDOS_CONFIG[`max${route.charAt(0).toUpperCase() + route.slice(1)}`] ||
    DDOS_CONFIG.maxGlobal;
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, start: now };

  // Reset si fenetre expiree
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

/**
 * Supprime les operateurs MongoDB des inputs
 * Previent les injections NoSQL ($where, $gt, $ne...)
 */
export function sanitizeMongo(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongo);
  }

  if (obj !== null && typeof obj === "object") {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      // Refuse les cles avec $ ou .
      if (key.startsWith("$") || key.includes(".")) {
        console.warn(`[Security] Injection tentee : cle "${key}" bloquee`);
        continue;
      }
      clean[key] = sanitizeMongo(value);
    }
    return clean;
  }

  return obj;
}

/**
 * Nettoie les chaines contre XSS
 */
export function sanitizeXss(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ── DETECTION ATTAQUES ────────────────────────────────────────

const ATTACK_PATTERNS = [
  {
    name: "SQLi",
    pattern: /(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bEXEC\b)/i,
  },
  { name: "NoSQLi", pattern: /\$where|\$gt|\$lt|\$ne|\$in|\$regex|\$or|\$and/ },
  { name: "PathTraversal", pattern: /\.\.[/\\]/ },
  { name: "XSS", pattern: /<script|javascript:|onerror\s*=|onload\s*=/i },
  { name: "CmdInjection", pattern: /[;&|`]|\$\(|%0[aA]/ },
  { name: "XXE", pattern: /<!ENTITY|<!DOCTYPE/i },
];

export function detectAttack(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input);

  for (const { name, pattern } of ATTACK_PATTERNS) {
    if (pattern.test(str)) {
      return { detected: true, type: name };
    }
  }

  return { detected: false };
}

// Nettoyage periodique des maps
setInterval(() => {
  const now = Date.now();

  for (const [ip, rec] of attempts.entries()) {
    if (rec.lockedUntil && rec.lockedUntil < now) attempts.delete(ip);
  }

  for (const [key, rec] of requestCounts.entries()) {
    if (now - rec.start > DDOS_CONFIG.windowMs * 2) requestCounts.delete(key);
  }
}, 60 * 1000);
