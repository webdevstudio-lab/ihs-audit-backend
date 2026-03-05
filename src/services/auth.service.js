import { User } from "../models/User.model.js";
import { RefreshToken } from "../models/RefreshToken.model.js";
import { comparePassword } from "../lib/bcrypt.js";
import { generateSecureToken, hashData } from "../lib/encryption.js";
import {
  recordFailedAttempt,
  clearFailedAttempts,
  isIpBlocked,
  getLockTimeRemaining,
  logSecurityEvent,
} from "../lib/security.js";
import { ROLES } from "../config/constants.js";
import { ENV } from "../config/env.js";

// ── CONNEXION ─────────────────────────────────────────────────

export async function loginAdmin(email, password, deviceInfo = {}) {
  const ip = deviceInfo.ip || "unknown";

  if (isIpBlocked(ip)) {
    throw new Error(`IP bloquee — reessayez dans ${getLockTimeRemaining(ip)}s`);
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    role: { $in: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  }).select("+password");

  // Meme message pour email inconnu ou mauvais mot de passe
  // Evite d'indiquer si l'email existe (user enumeration)
  if (!user || !user.isActive) {
    recordFailedAttempt(ip);
    await logSecurityEvent({
      event: "login_failed",
      ip,
      severity: "medium",
      details: { email, reason: "Utilisateur introuvable ou inactif" },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    const rec = recordFailedAttempt(ip);
    await logSecurityEvent({
      event: "login_failed",
      user: user._id,
      ip,
      severity: rec.count >= 3 ? "high" : "medium",
      details: { reason: "Mot de passe incorrect", attempts: rec.count },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  clearFailedAttempts(ip);
  user.lastLogin = new Date();
  await user.save();

  await logSecurityEvent({
    event: "login_success",
    user: user._id,
    ip,
    severity: "low",
    details: { role: user.role },
  });

  return user;
}

export async function loginTechnician(name, techCode, deviceInfo = {}) {
  const ip = deviceInfo.ip || "unknown";

  if (isIpBlocked(ip)) {
    throw new Error(`IP bloquee — reessayez dans ${getLockTimeRemaining(ip)}s`);
  }

  const user = await User.findOne({
    techCode: techCode.toUpperCase(),
    role: ROLES.TECHNICIAN,
  });

  if (!user || !user.isActive) {
    recordFailedAttempt(ip);
    await logSecurityEvent({
      event: "login_failed",
      ip,
      severity: "medium",
      details: { techCode, reason: "Code invalide ou compte inactif" },
    });
    throw new Error("Nom ou code technicien incorrect");
  }

  const nameMatch = user.name.toLowerCase().includes(name.toLowerCase().trim());

  if (!nameMatch) {
    const rec = recordFailedAttempt(ip);
    await logSecurityEvent({
      event: "login_failed",
      user: user._id,
      ip,
      severity: "medium",
      details: { reason: "Nom incorrect", attempts: rec.count },
    });
    throw new Error("Nom ou code technicien incorrect");
  }

  clearFailedAttempts(ip);
  user.lastLogin = new Date();
  await user.save();

  await logSecurityEvent({
    event: "login_success",
    user: user._id,
    ip,
    severity: "low",
  });

  return user;
}

// ── TOKENS ───────────────────────────────────────────────────

export async function generateTokenPair(user, jwt, deviceInfo = {}) {
  // 1. Access token court (15 min)
  const accessToken = await jwt.sign(buildTokenPayload(user));

  // 2. Refresh token long (30 jours) — stocke uniquement le hash
  const rawToken = generateSecureToken();
  const tokenHash = hashData(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Revoque les anciens tokens du meme appareil
  await RefreshToken.updateMany(
    {
      user: user._id,
      isRevoked: false,
      "deviceInfo.ip": deviceInfo.ip,
    },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: "replaced",
      },
    },
  );

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    deviceInfo,
    expiresAt,
  });

  return { accessToken, refreshToken: rawToken };
}

export async function refreshAccessToken(rawToken, jwt, deviceInfo = {}) {
  const tokenHash = hashData(rawToken);

  const stored = await RefreshToken.findOne({
    tokenHash,
    isRevoked: false,
  }).populate("user");

  if (!stored) {
    await logSecurityEvent({
      event: "token_revoked",
      ip: deviceInfo.ip,
      severity: "high",
      details: { reason: "Refresh token invalide" },
    });
    throw new Error("Session expiree — reconnectez-vous");
  }

  if (stored.expiresAt < new Date()) {
    stored.isRevoked = true;
    stored.revokedReason = "expired";
    await stored.save();
    throw new Error("Session expiree — reconnectez-vous");
  }

  if (!stored.user?.isActive) {
    throw new Error("Compte desactive");
  }

  // Rotation : nouveau token a chaque refresh
  const newRaw = generateSecureToken();
  const newHash = hashData(newRaw);

  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 30);

  // Revoque l'ancien
  stored.isRevoked = true;
  stored.revokedAt = new Date();
  stored.revokedReason = "replaced";
  await stored.save();

  // Cree le nouveau
  await RefreshToken.create({
    user: stored.user._id,
    tokenHash: newHash,
    deviceInfo,
    expiresAt: newExpiry,
    replacedBy: stored._id,
  });

  const accessToken = await jwt.sign(buildTokenPayload(stored.user));

  await logSecurityEvent({
    event: "token_refresh",
    user: stored.user._id,
    ip: deviceInfo.ip,
    severity: "low",
  });

  return {
    accessToken,
    refreshToken: newRaw,
    user: stored.user,
  };
}

export async function logout(rawToken, userId, ip = "unknown") {
  const tokenHash = hashData(rawToken);

  await RefreshToken.updateOne(
    { tokenHash, user: userId },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: "logout",
      },
    },
  );

  await logSecurityEvent({
    event: "logout",
    user: userId,
    ip,
    severity: "low",
  });
}

export async function logoutAllDevices(userId, ip = "unknown") {
  await RefreshToken.updateMany(
    { user: userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: "security",
      },
    },
  );

  await logSecurityEvent({
    event: "logout_all",
    user: userId,
    ip,
    severity: "medium",
  });
}

export function buildTokenPayload(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    techCode: user.techCode || null,
    zone: user.zone || null,
  };
}
