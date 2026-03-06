import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";
import { User } from "../models/User.model.js";
import {
  AUDIT_STATUS,
  SITE_STATUS,
  ZONES,
  CLIENTS,
  SITE_PRIORITY,
  SITE_TYPOLOGY,
} from "../config/constants.js";

/**
 * Statistiques globales pour le dashboard principal
 */
export async function getGlobalStats() {
  const [
    totalSites,
    completedAudits,
    inProgressAudits,
    submittedAudits,
    criticalSites,
    pendingSites,
    totalTechnicians,
    activeTechnicians,
  ] = await Promise.all([
    Site.countDocuments(),
    Audit.countDocuments({ status: AUDIT_STATUS.VALIDATED }),
    Audit.countDocuments({ status: AUDIT_STATUS.IN_PROGRESS }),
    Audit.countDocuments({ status: AUDIT_STATUS.SUBMITTED }),
    Site.countDocuments({ status: SITE_STATUS.CRITICAL }),
    Site.countDocuments({ status: SITE_STATUS.PENDING }),
    User.countDocuments({ role: "technician", isActive: true }),
    Audit.distinct("technician", { status: AUDIT_STATUS.IN_PROGRESS }),
  ]);

  const progressPercent =
    totalSites > 0 ? Math.round((completedAudits / totalSites) * 100) : 0;

  return {
    totalSites,
    completedAudits,
    inProgressAudits,
    submittedAudits,
    criticalSites,
    pendingSites,
    totalTechnicians,
    activeTechniciansCount: activeTechnicians.length,
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
      const sites = await Site.find({ zone }).select("_id status lastScore");
      const siteIds = sites.map((s) => s._id);
      const total = sites.length;

      const [completed, inProgress, critical, pending] = await Promise.all([
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
        Site.countDocuments({
          _id: { $in: siteIds },
          status: SITE_STATUS.PENDING,
        }),
      ]);

      const scores = sites.map((s) => s.lastScore).filter((s) => s != null);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        zone,
        total,
        completed,
        inProgress,
        critical,
        pending,
        progress,
        avgScore,
      };
    }),
  );

  return stats;
}

/**
 * Statistiques par client (MTN / Orange / Moov)
 */
export async function getStatsByClient() {
  const stats = await Promise.all(
    CLIENTS.map(async (client) => {
      const sites = await Site.find({ clients: client }).select(
        "_id status lastScore",
      );
      const siteIds = sites.map((s) => s._id);
      const total = sites.length;

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

      const scores = sites.map((s) => s.lastScore).filter((s) => s != null);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        client,
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
 * Statistiques par priorité de site
 */
export async function getStatsByPriority() {
  const priorities = Object.values(SITE_PRIORITY);

  const stats = await Promise.all(
    priorities.map(async (priority) => {
      const [total, completed, critical] = await Promise.all([
        Site.countDocuments({ priority }),
        Site.countDocuments({ priority, status: SITE_STATUS.COMPLETED }),
        Site.countDocuments({ priority, status: SITE_STATUS.CRITICAL }),
      ]);

      return { priority, total, completed, critical };
    }),
  );

  return stats;
}

/**
 * Statistiques par typologie de site
 */
export async function getStatsByTypology() {
  const typologies = Object.values(SITE_TYPOLOGY);

  const stats = await Promise.all(
    typologies.map(async (typology) => {
      const [total, completed, critical] = await Promise.all([
        Site.countDocuments({ typology }),
        Site.countDocuments({ typology, status: SITE_STATUS.COMPLETED }),
        Site.countDocuments({ typology, status: SITE_STATUS.CRITICAL }),
      ]);

      if (total === 0) return null;

      return { typology, total, completed, critical };
    }),
  );

  return stats.filter(Boolean);
}

/**
 * Matrice de criticité
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
 * Activité récente — derniers audits et événements
 */
export async function getRecentActivity(limit = 20) {
  const recentAudits = await Audit.find()
    .populate("site", "name code zone city")
    .populate("technician", "name techCode")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select(
      "status globalScore criticalityLevel visitDate updatedAt submittedAt",
    );

  return recentAudits;
}

/**
 * Évolution des audits sur les N derniers jours
 */
export async function getAuditTrend(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const audits = await Audit.find({
    createdAt: { $gte: startDate },
  }).select("status createdAt submittedAt");

  // Groupe par jour
  const byDay = {};

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    byDay[key] = { date: key, started: 0, submitted: 0, validated: 0 };
  }

  for (const audit of audits) {
    const dayKey = audit.createdAt.toISOString().split("T")[0];
    if (byDay[dayKey]) byDay[dayKey].started++;

    if (audit.status === AUDIT_STATUS.SUBMITTED && audit.submittedAt) {
      const submitKey = audit.submittedAt.toISOString().split("T")[0];
      if (byDay[submitKey]) byDay[submitKey].submitted++;
    }

    if (audit.status === AUDIT_STATUS.VALIDATED) {
      const validateKey = audit.createdAt.toISOString().split("T")[0];
      if (byDay[validateKey]) byDay[validateKey].validated++;
    }
  }

  return Object.values(byDay);
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

  const recent = await Audit.find({ technician: technicianId })
    .populate("site", "name code city zone")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("status globalScore criticalityLevel visitDate site");

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, inProgress, submitted, completionRate, recent };
}

/**
 * Sites critiques à traiter en priorité
 */
export async function getCriticalSites(limit = 10) {
  return Site.find({ status: SITE_STATUS.CRITICAL })
    .populate("lastAudit", "globalScore criticalityLevel visitDate")
    .sort({ priority: 1, lastScore: 1 })
    .limit(limit)
    .select("name code city zone clients lastScore status priority typology");
}

/**
 * Dashboard complet — un seul appel pour tout charger
 */
export async function getDashboard() {
  const [
    global,
    zones,
    clients,
    criticality,
    activity,
    criticalSites,
    trend,
    priority,
  ] = await Promise.all([
    getGlobalStats(),
    getStatsByZone(),
    getStatsByClient(),
    getCriticalityMatrix(),
    getRecentActivity(10),
    getCriticalSites(5),
    getAuditTrend(14),
    getStatsByPriority(),
  ]);

  return {
    global,
    zones,
    clients,
    criticality,
    activity,
    criticalSites,
    trend,
    priority,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Statistiques des équipements (groupes, redresseurs, batteries, solaire)
 */
export async function getEquipmentStats() {
  const { Generator } = await import("../models/Generator.model.js");
  const { Rectifier } = await import("../models/Rectifier.model.js");
  const { Battery } = await import("../models/Battery.model.js");
  const { SolarSystem } = await import("../models/SolarSystem.model.js");

  const OBSOLETE_YEAR = new Date().getFullYear() - 10; // installé avant 10 ans

  const [generators, rectifiers, batteries, solar] = await Promise.all([
    // ── GROUPES ÉLECTROGÈNES ──
    Promise.all([
      Generator.countDocuments(),
      Generator.countDocuments({ isOperational: true }),
      Generator.countDocuments({ isOperational: false }),
      Generator.countDocuments({ hasOilLeak: true }),
      Generator.aggregate([
        { $match: { brand: { $exists: true, $ne: null, $ne: "" } } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Generator.aggregate([
        { $match: { condition: { $exists: true } } },
        { $group: { _id: "$condition", count: { $sum: 1 } } },
      ]),
      Generator.countDocuments({
        yearOfManufacture: { $lte: OBSOLETE_YEAR },
      }),
    ]).then(
      ([
        total,
        operational,
        nonOp,
        oilLeak,
        byBrand,
        byCondition,
        obsolete,
      ]) => ({
        total,
        operational,
        nonOperational: nonOp,
        withOilLeak: oilLeak,
        obsolete,
        byBrand: byBrand.map((b) => ({ brand: b._id, count: b.count })),
        byCondition: byCondition.map((c) => ({
          condition: c._id,
          count: c.count,
        })),
      }),
    ),

    // ── REDRESSEURS ──
    Promise.all([
      Rectifier.countDocuments(),
      Rectifier.countDocuments({ isOperational: true }),
      Rectifier.countDocuments({ hasAlarmActive: true }),
      Rectifier.aggregate([
        { $match: { brand: { $exists: true, $ne: null, $ne: "" } } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Rectifier.aggregate([
        { $match: { condition: { $exists: true } } },
        { $group: { _id: "$condition", count: { $sum: 1 } } },
      ]),
    ]).then(([total, operational, withAlarm, byBrand, byCondition]) => ({
      total,
      operational,
      withAlarm,
      byBrand: byBrand.map((b) => ({ brand: b._id, count: b.count })),
      byCondition: byCondition.map((c) => ({
        condition: c._id,
        count: c.count,
      })),
    })),

    // ── BATTERIES ──
    Promise.all([
      Battery.countDocuments(),
      Battery.countDocuments({ isSwollen: true }),
      Battery.countDocuments({ hasLeak: true }),
      Battery.countDocuments({ hasSulfation: true }),
      Battery.countDocuments({ yearOfInstallation: { $lte: OBSOLETE_YEAR } }),
      Battery.aggregate([
        { $match: { brand: { $exists: true, $ne: null, $ne: "" } } },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Battery.aggregate([
        { $match: { type: { $exists: true } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Battery.aggregate([
        { $match: { condition: { $exists: true } } },
        { $group: { _id: "$condition", count: { $sum: 1 } } },
      ]),
    ]).then(
      ([
        total,
        swollen,
        withLeak,
        withSulfation,
        obsolete,
        byBrand,
        byType,
        byCondition,
      ]) => ({
        total,
        swollen,
        withLeak,
        withSulfation,
        obsolete,
        byBrand: byBrand.map((b) => ({ brand: b._id, count: b.count })),
        byType: byType.map((t) => ({ type: t._id, count: t.count })),
        byCondition: byCondition.map((c) => ({
          condition: c._id,
          count: c.count,
        })),
      }),
    ),

    // ── SOLAIRE ──
    Promise.all([
      SolarSystem.countDocuments(),
      SolarSystem.countDocuments({ isOperational: true }),
      SolarSystem.countDocuments({ hasBrokenPanel: true }),
      SolarSystem.countDocuments({ hasDirtyPanel: true }),
      SolarSystem.aggregate([
        { $match: { panelBrand: { $exists: true, $ne: null, $ne: "" } } },
        { $group: { _id: "$panelBrand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      SolarSystem.aggregate([
        { $match: { condition: { $exists: true } } },
        { $group: { _id: "$condition", count: { $sum: 1 } } },
      ]),
    ]).then(
      ([
        total,
        operational,
        withBrokenPanels,
        withDirtyPanels,
        byBrand,
        byCondition,
      ]) => ({
        total,
        operational,
        withBrokenPanels,
        withDirtyPanels,
        byBrand: byBrand.map((b) => ({ brand: b._id, count: b.count })),
        byCondition: byCondition.map((c) => ({
          condition: c._id,
          count: c.count,
        })),
      }),
    ),
  ]);

  return { generators, rectifiers, batteries, solar };
}

/**
 * Liste des sites utilisant un équipement spécifique (par type + marque/condition)
 */
export async function getSitesByEquipment({ type, brand, condition }) {
  const modelMap = {
    generator: (await import("../models/Generator.model.js")).Generator,
    rectifier: (await import("../models/Rectifier.model.js")).Rectifier,
    battery: (await import("../models/Battery.model.js")).Battery,
    solar: (await import("../models/SolarSystem.model.js")).SolarSystem,
  };

  const Model = modelMap[type];
  if (!Model) throw new Error("Type d'équipement invalide");

  const filter = {};
  if (brand)
    filter[type === "solar" ? "panelBrand" : "brand"] = new RegExp(brand, "i");
  if (condition) filter.condition = condition;

  const equipments = await Model.find(filter)
    .populate({
      path: "audit",
      select: "site status globalScore",
      populate: {
        path: "site",
        select: "name code city zone clients status lastAuditScore",
      },
    })
    .select("brand model condition isOperational panelBrand audit")
    .limit(100);

  // Dédoublonner par site
  const sitesMap = new Map();
  for (const eq of equipments) {
    const site = eq.audit?.site;
    if (!site?._id) continue;
    const key = site._id.toString();
    if (!sitesMap.has(key)) {
      sitesMap.set(key, {
        site: {
          _id: site._id,
          name: site.name,
          code: site.code,
          city: site.city,
          zone: site.zone,
          clients: site.clients,
          status: site.status,
          lastAuditScore: site.lastAuditScore,
        },
        equipment: {
          brand: eq.brand || eq.panelBrand,
          model: eq.model,
          condition: eq.condition,
          isOperational: eq.isOperational,
        },
      });
    }
  }

  return Array.from(sitesMap.values());
}
