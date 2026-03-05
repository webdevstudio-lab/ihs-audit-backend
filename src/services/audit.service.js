import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";
import { AUDIT_STATUS, SITE_STATUS } from "../config/constants.js";
import { getScoreSummary } from "../utils/scoreCalculator.js";
import {
  emitAuditStarted,
  emitAuditSubmitted,
  emitCriticalAlert,
  emitSiteUpdated,
} from "../lib/socket.js";

/**
 * Demarre un nouvel audit
 * Le technicien saisit le code site depuis l'application mobile
 */
export async function startAudit(siteCode, technicianId) {
  const site = await Site.findOne({ code: siteCode.toUpperCase() });
  if (!site) throw new Error(`Site ${siteCode} introuvable`);

  // Verifie qu'il n'y a pas deja un audit en cours
  const existing = await Audit.findOne({
    site: site._id,
    status: { $in: [AUDIT_STATUS.DRAFT, AUDIT_STATUS.IN_PROGRESS] },
  });

  if (existing && !site.reopenedAt) {
    throw new Error(
      "Un audit est deja en cours sur ce site — contactez votre superviseur pour le reouverture",
    );
  }

  // Cherche l'audit precedent pour l'historique
  const previousAudit = await Audit.findOne({ site: site._id }).sort({
    createdAt: -1,
  });

  // Cree le nouvel audit
  const audit = await Audit.create({
    site: site._id,
    technician: technicianId,
    status: AUDIT_STATUS.IN_PROGRESS,
    visitDate: new Date(),
    previousAudit: previousAudit?._id || null,
    isReopened: !!site.reopenedAt,
    reopenedBy: site.reopenedBy || null,
    reopenedAt: site.reopenedAt || null,
  });

  // Met a jour le statut du site
  await Site.findByIdAndUpdate(site._id, {
    status: SITE_STATUS.IN_PROGRESS,
    reopenedAt: null,
    reopenedBy: null,
  });

  // Notifie le dashboard en temps reel
  const populated = await audit.populate([
    { path: "site", select: "name code zone" },
    { path: "technician", select: "name techCode" },
  ]);

  emitAuditStarted(populated);

  return audit;
}

/**
 * Recupere un audit par son ID avec tous les equipements
 */
export async function getAuditById(auditId) {
  const audit = await Audit.findById(auditId)
    .populate("site")
    .populate("technician", "name techCode zone")
    .populate("generator")
    .populate("rectifier")
    .populate("solar")
    .populate("battery")
    .populate("earthing")
    .populate("fuelTank")
    .populate("clientLoads")
    .populate("photos")
    .populate("validatedBy", "name email");

  if (!audit) throw new Error("Audit introuvable");
  return audit;
}

/**
 * Liste les audits avec filtres
 */
export async function getAudits({
  status,
  zone,
  technicianId,
  siteId,
  page,
  limit,
  skip,
}) {
  const filter = {};

  if (status) filter.status = status;
  if (technicianId) filter.technician = technicianId;
  if (siteId) filter.site = siteId;

  // Filtre par zone via le site
  if (zone) {
    const sites = await Site.find({ zone }).select("_id");
    filter.site = { $in: sites.map((s) => s._id) };
  }

  const [audits, total] = await Promise.all([
    Audit.find(filter)
      .populate("site", "name code city zone")
      .populate("technician", "name techCode")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Audit.countDocuments(filter),
  ]);

  return { audits, total };
}

/**
 * Met a jour les commentaires d'un audit
 */
export async function updateComments(auditId, technicianId, data) {
  const audit = await Audit.findOne({
    _id: auditId,
    technician: technicianId,
    status: AUDIT_STATUS.IN_PROGRESS,
  });

  if (!audit) {
    throw new Error("Audit introuvable ou non modifiable");
  }

  if (data.comments) audit.comments = { ...audit.comments, ...data.comments };
  if (data.technicianNotes) audit.technicianNotes = data.technicianNotes;

  await audit.save();

  return audit;
}

/**
 * Calcule et sauvegarde le score d'un audit
 */
export async function computeAuditScore(auditId) {
  const audit = await getAuditById(auditId);

  const { score, level, label } = getScoreSummary(audit);

  await Audit.findByIdAndUpdate(auditId, {
    globalScore: score,
    criticalityLevel: level,
  });

  // Met a jour le score sur le site
  await Site.findByIdAndUpdate(audit.site._id, {
    lastScore: score,
    lastAudit: auditId,
  });

  // Si critique : alerte temps reel
  if (level === "critical" || level === "high") {
    emitCriticalAlert({
      auditId,
      site: audit.site,
      score,
      level,
      label,
    });
  }

  return { score, level, label };
}

/**
 * Soumet un audit pour validation
 */
export async function submitAudit(auditId, technicianId, notes) {
  const audit = await Audit.findOne({
    _id: auditId,
    technician: technicianId,
    status: AUDIT_STATUS.IN_PROGRESS,
  });

  if (!audit) {
    throw new Error("Audit introuvable ou deja soumis");
  }

  if (notes) audit.technicianNotes = notes;

  audit.status = AUDIT_STATUS.SUBMITTED;
  audit.submittedAt = new Date();

  await audit.save();

  // Met a jour le site
  await Site.findByIdAndUpdate(audit.site, {
    status: SITE_STATUS.COMPLETED,
  });

  // Notifie le dashboard
  const populated = await audit.populate([
    { path: "site", select: "name code zone" },
    { path: "technician", select: "name techCode" },
  ]);

  emitAuditSubmitted(populated);
  emitSiteUpdated({ siteId: audit.site, status: SITE_STATUS.COMPLETED });

  return audit;
}

/**
 * Valide un audit (admin ou superviseur)
 */
export async function validateAudit(auditId, validatorId) {
  const audit = await Audit.findOneAndUpdate(
    { _id: auditId, status: AUDIT_STATUS.SUBMITTED },
    {
      $set: {
        status: AUDIT_STATUS.VALIDATED,
        validatedAt: new Date(),
        validatedBy: validatorId,
      },
    },
    { new: true },
  );

  if (!audit) {
    throw new Error("Audit introuvable ou non soumis");
  }

  // Incremente le compteur d'audits du site
  await Site.findByIdAndUpdate(audit.site, {
    $inc: { auditCount: 1 },
  });

  return audit;
}
