import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";
import { User } from "../models/User.model.js";
import { AUDIT_STATUS, SITE_STATUS, ZONES } from "../config/constants.js";

/**
 * Statistiques globales pour le dashboard principal
 */
export async function getGlobalStats() {
  const [
    totalSites,
    completedAudits,
    inProgressAudits,
    criticalSites,
    pendingSites,
    totalTechnicians,
  ] = await Promise.all([
    Site.countDocuments({ isActive: true }),
    Audit.countDocuments({ status: AUDIT_STATUS.VALIDATED }),
    Audit.countDocuments({ status: AUDIT_STATUS.IN_PROGRESS }),
    Site.countDocuments({ status: SITE_STATUS.CRITICAL }),
    Site.countDocuments({ status: SITE_STATUS.PENDING }),
    User.countDocuments({ role: "technician", isActive: true }),
  ]);

  const progressPercent =
    totalSites > 0 ? Math.round((completedAudits / totalSites) * 100) : 0;

  return {
    totalSites,
    completedAudits,
    inProgressAudits,
    criticalSites,
    pendingSites,
    totalTechnicians,
    progressPercent,
  };
}

/**
 * Statistiques par zone
 */
export async function getStatsByZone() {
  const zones = Object.values(ZONES);

  const stats = await Promise.all(
    zones.map(async (zone) => {
      const sites = await Site.find({ zone, isActive: true }).select(
        "_id status lastScore",
      );

      const siteIds = sites.map((s) => s._id);

      const [completed, inProgress, critical] = await Promise.all([
        Audit.countDocuments({
          site: { $in: siteIds },
          status: AUDIT_STATUS.VALIDATED,
        }),
        Audit.countDocuments({
          site: { $in: siteIds },
          status: AUDIT_STATUS.IN_PROGRESS,
        }),
        Site.countDocuments({
          _id: { $in: siteIds },
          status: SITE_STATUS.CRITICAL,
        }),
      ]);

      const total = sites.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Score moyen de la zone
      const scores = sites
        .map((s) => s.lastScore)
        .filter((s) => s !== null && s !== undefined);

      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      return {
        zone,
        total,
        completed,
        inProgress,
        critical,
        progress,
        avgScore,
      };
    }),
  );

  return stats;
}

/**
 * Matrice de criticite — nombre de sites par niveau
 */
export async function getCriticalityMatrix() {
  const levels = [
    "excellent",
    "normal",
    "elevated",
    "high",
    "critical",
    "unknown",
  ];

  const counts = await Promise.all(
    levels.map(async (level) => {
      const count = await Audit.countDocuments({
        status: AUDIT_STATUS.VALIDATED,
        criticalityLevel: level,
      });
      return { level, count };
    }),
  );

  return counts;
}

/**
 * Activite recente — derniers audits et evenements
 */
export async function getRecentActivity(limit = 20) {
  const recentAudits = await Audit.find()
    .populate("site", "name code zone")
    .populate("technician", "name techCode")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select("status globalScore criticalityLevel visitDate updatedAt comments");

  return recentAudits;
}

/**
 * Statistiques d'un technicien
 */
export async function getTechnicianStats(technicianId) {
  const [total, completed, inProgress, submitted] = await Promise.all([
    Audit.countDocuments({ technician: technicianId }),
    Audit.countDocuments({
      technician: technicianId,
      status: AUDIT_STATUS.VALIDATED,
    }),
    Audit.countDocuments({
      technician: technicianId,
      status: AUDIT_STATUS.IN_PROGRESS,
    }),
    Audit.countDocuments({
      technician: technicianId,
      status: AUDIT_STATUS.SUBMITTED,
    }),
  ]);

  // Derniers audits du technicien
  const recent = await Audit.find({ technician: technicianId })
    .populate("site", "name code city")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("status globalScore visitDate site");

  return { total, completed, inProgress, submitted, recent };
}

/**
 * Sites critiques a traiter en priorite
 */
export async function getCriticalSites(limit = 10) {
  return Site.find({ status: SITE_STATUS.CRITICAL })
    .populate("lastAudit", "globalScore criticalityLevel visitDate iaAnalysis")
    .sort({ lastScore: -1 })
    .limit(limit)
    .select("name code city zone clients lastScore status");
}
