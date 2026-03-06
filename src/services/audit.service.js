import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";
import { AUDIT_STATUS, SITE_STATUS } from "../config/constants.js";
import { getScoreSummary } from "../utils/scoreCalculator.js";
import { notifyAdmins, createNotification } from "./notification.service.js";
import {
  emitAuditStarted,
  emitAuditSubmitted,
  emitCriticalAlert,
  emitSiteUpdated,
} from "../lib/socket.js";

// ─── Démarrer ou reprendre un audit ──────────────────────────────────────────
export async function startAudit(siteCode, technicianId) {
  const site = await Site.findOne({ code: siteCode });
  if (!site) throw new Error("Site introuvable — vérifiez le code.");

  const validated = await Audit.findOne({
    site: site._id,
    status: "validated",
  });
  if (validated) {
    throw new Error(
      "Ce site possède déjà un audit validé. Contactez un superviseur.",
    );
  }

  const submitted = await Audit.findOne({
    site: site._id,
    status: "submitted",
  });
  if (submitted) {
    throw new Error(
      "Un audit est déjà soumis et en attente de validation pour ce site.",
    );
  }

  const existing = await Audit.findOne({
    site: site._id,
    status: { $in: [AUDIT_STATUS.DRAFT, AUDIT_STATUS.IN_PROGRESS] },
  });

  if (existing) {
    existing.technician = technicianId;
    existing.status = AUDIT_STATUS.IN_PROGRESS;
    existing.corrections = null;
    existing.updatedAt = new Date();
    await existing.save();
    await Site.findByIdAndUpdate(site._id, { status: SITE_STATUS.IN_PROGRESS });
    return existing;
  }

  const audit = new Audit({
    site: site._id,
    technician: technicianId,
    status: AUDIT_STATUS.IN_PROGRESS,
    visitDate: new Date(),
  });
  await audit.save();
  await Site.findByIdAndUpdate(site._id, { status: SITE_STATUS.IN_PROGRESS });

  await notifyAdmins({
    type: "audit_started",
    title: "🔧 Audit démarré",
    message: `Audit démarré sur le site ${site.name} (${siteCode})`,
    priority: "low",
    refModel: "Audit",
    refId: audit._id,
    sender: technicianId,
  });

  emitAuditStarted({ auditId: audit._id, site, technicianId });
  return audit;
}

// ─── Récupérer un audit par ID ────────────────────────────────────────────────
export async function getAuditById(auditId) {
  const audit = await Audit.findById(auditId)
    .populate("site")
    .populate("technician", "name techCode zone")
    .populate("generator")
    .populate("rectifier")
    .populate("solar")
    .populate("battery")
    .populate("compteurCIE")
    .populate("earthing")
    .populate("fuelTank")
    .populate("clientLoads")
    .populate("photos")
    .populate("validatedBy", "name email")
    .populate("rejectedBy", "name email");

  if (!audit) throw new Error("Audit introuvable");
  return audit;
}

// ─── Lister les audits ────────────────────────────────────────────────────────
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

  if (zone) {
    const sites = await Site.find({ zone }).select("_id");
    filter.site = { $in: sites.map((s) => s._id) };
  }

  const [audits, total] = await Promise.all([
    Audit.find(filter)
      .populate("site", "name code city zone")
      .populate("technician", "name techCode")
      .skip(skip || 0)
      .limit(limit || 50)
      .sort({ createdAt: -1 }),
    Audit.countDocuments(filter),
  ]);

  return { audits, total };
}

// ─── Mes audits (technicien) ──────────────────────────────────────────────────
export async function getMyAudits(technicianId) {
  return Audit.find({ technician: technicianId })
    .populate("site", "name code city zone status")
    .sort({ updatedAt: -1 });
}

// ─── Mettre à jour section générale (commentaires + infos site) ───────────────
export async function updateGeneralSection(auditId, technicianId, body) {
  const audit = await Audit.findOne({
    _id: auditId,
    technician: technicianId,
    status: { $in: [AUDIT_STATUS.IN_PROGRESS, AUDIT_STATUS.DRAFT] },
  });
  if (!audit) throw new Error("Audit introuvable ou non modifiable");

  const { comments = {}, siteUpdate = {}, technicianNotes } = body;

  // 1. Commentaires audit
  if (comments.general !== undefined) audit.comments.general = comments.general;
  if (comments.urgent !== undefined) audit.comments.urgent = comments.urgent;
  if (comments.access !== undefined) audit.comments.access = comments.access;
  if (comments.generator !== undefined)
    audit.comments.generator = comments.generator;
  if (comments.rectifier !== undefined)
    audit.comments.rectifier = comments.rectifier;
  if (comments.battery !== undefined) audit.comments.battery = comments.battery;
  if (comments.solar !== undefined) audit.comments.solar = comments.solar;
  if (comments.earthing !== undefined)
    audit.comments.earthing = comments.earthing;
  if (comments.fuelTank !== undefined)
    audit.comments.fuelTank = comments.fuelTank;
  if (technicianNotes !== undefined) audit.technicianNotes = technicianNotes;

  await audit.save();

  // 2. Mise à jour site
  if (audit.site && Object.keys(siteUpdate).length > 0) {
    const site = await Site.findById(audit.site);
    if (site) {
      // GPS
      if (siteUpdate.lat && siteUpdate.lng) {
        site.coordinates = {
          lat: parseFloat(siteUpdate.lat),
          lng: parseFloat(siteUpdate.lng),
        };
      }
      // Accès
      if (siteUpdate.accessLevel) site.accessLevel = siteUpdate.accessLevel;
      if (siteUpdate.keyLocation) site.keyLocation = siteUpdate.keyLocation;
      if (siteUpdate.accessNotes) site.accessNotes = siteUpdate.accessNotes;
      // Clients & type
      if (siteUpdate.clients?.length) site.clients = siteUpdate.clients;
      if (siteUpdate.siteType) site.siteType = siteUpdate.siteType;
      // Contact — upsert index 0
      if (siteUpdate.contactName || siteUpdate.contactPhone) {
        const contact = {
          type: siteUpdate.contactType || "other",
          name: siteUpdate.contactName || "",
          phone: siteUpdate.contactPhone || "",
        };
        if (!site.contacts) site.contacts = [];
        if (site.contacts.length > 0) {
          site.contacts.set(0, contact);
        } else {
          site.contacts.push(contact);
        }
      }
      await site.save();
    }
  }

  return audit;
}

// ─── Calculer le score ────────────────────────────────────────────────────────
export async function computeAuditScore(auditId) {
  const audit = await getAuditById(auditId);
  const { score, level, label } = getScoreSummary(audit);

  await Audit.findByIdAndUpdate(auditId, {
    globalScore: score,
    criticalityLevel: level,
  });

  await Site.findByIdAndUpdate(audit.site._id, {
    lastAuditScore: score,
    lastAuditDate: new Date(),
  });

  if (level === "critical" || level === "high") {
    emitCriticalAlert({ auditId, site: audit.site, score, level, label });
    await notifyAdmins({
      type: "alert_critical",
      title: `⚠️ Alerte ${level === "critical" ? "CRITIQUE" : "HAUTE"} — ${audit.site.code}`,
      message: `Score ${score}/100 sur le site ${audit.site.code} — ${audit.site.name}. Intervention requise.`,
      priority: level === "critical" ? "critical" : "high",
      refModel: "Audit",
      refId: auditId,
    });
  }

  return { score, level, label };
}

// ─── Soumettre un audit ───────────────────────────────────────────────────────
export async function submitAudit(auditId, technicianId, notes) {
  const audit = await Audit.findOne({
    _id: auditId,
    technician: technicianId,
    status: { $in: [AUDIT_STATUS.IN_PROGRESS, AUDIT_STATUS.DRAFT] },
  });
  if (!audit) throw new Error("Audit introuvable ou déjà soumis");

  if (notes) audit.technicianNotes = notes;
  audit.status = AUDIT_STATUS.SUBMITTED;
  audit.submittedAt = new Date();
  audit.corrections = null;
  await audit.save();

  await Site.findByIdAndUpdate(audit.site, { status: SITE_STATUS.COMPLETED });

  const populated = await Audit.findById(auditId)
    .populate("site", "name code zone city")
    .populate("technician", "name techCode zone");

  await notifyAdmins({
    type: "audit_submitted",
    title: "📋 Audit soumis — validation requise",
    message: `${populated.technician.name} (${populated.technician.techCode}) a soumis l'audit du site ${populated.site.code} — ${populated.site.name} (${populated.site.city})`,
    priority: "high",
    refModel: "Audit",
    refId: audit._id,
    sender: technicianId,
  });

  emitAuditSubmitted(populated);
  emitSiteUpdated({ siteId: audit.site, status: SITE_STATUS.COMPLETED });

  return audit;
}

// ─── Valider un audit ─────────────────────────────────────────────────────────
export async function validateAudit(auditId, validatorId) {
  const audit = await Audit.findOneAndUpdate(
    { _id: auditId, status: AUDIT_STATUS.SUBMITTED },
    {
      $set: {
        status: AUDIT_STATUS.VALIDATED,
        validatedAt: new Date(),
        validatedBy: validatorId,
        corrections: null,
      },
    },
    { returnDocument: "after" }, // ← Mongoose 7+
  );
  if (!audit) throw new Error("Audit introuvable ou non soumis");

  await Site.findByIdAndUpdate(audit.site, {
    status: SITE_STATUS.COMPLETED,
    $inc: { auditCount: 1 },
  });

  const populated = await Audit.findById(auditId)
    .populate("site", "name code city")
    .populate("technician", "name techCode");

  await createNotification({
    recipient: populated.technician._id,
    type: "audit_validated",
    title: "✅ Audit validé",
    message: `Votre audit du site ${populated.site.code} — ${populated.site.name} a été validé`,
    priority: "medium",
    refModel: "Audit",
    refId: auditId,
    sender: validatorId,
  });

  emitSiteUpdated({ siteId: audit.site, status: SITE_STATUS.COMPLETED });
  return audit;
}

// ─── Refuser un audit ─────────────────────────────────────────────────────────
export async function rejectAudit(auditId, adminId, corrections) {
  if (!corrections?.trim())
    throw new Error("Vous devez indiquer les corrections à effectuer");

  const audit = await Audit.findOne({
    _id: auditId,
    status: AUDIT_STATUS.SUBMITTED,
  });
  if (!audit) throw new Error("Audit introuvable ou non soumis");

  audit.status = AUDIT_STATUS.IN_PROGRESS;
  audit.corrections = corrections;
  audit.rejectedAt = new Date();
  audit.rejectedBy = adminId;
  await audit.save();

  await Site.findByIdAndUpdate(audit.site, { status: SITE_STATUS.IN_PROGRESS });

  const populated = await Audit.findById(auditId)
    .populate("site", "name code city")
    .populate("technician", "name techCode");

  await createNotification({
    recipient: populated.technician._id,
    type: "audit_rejected",
    title: "❌ Audit refusé — corrections requises",
    message: `Votre audit du site ${populated.site.code} — ${populated.site.name} a été refusé. Corrections : ${corrections}`,
    priority: "high",
    refModel: "Audit",
    refId: auditId,
    sender: adminId,
  });

  emitSiteUpdated({ siteId: audit.site, status: SITE_STATUS.IN_PROGRESS });
  return audit;
}

// ─── Supprimer un audit (admin) ───────────────────────────────────────────────
export async function deleteAudit(auditId) {
  const audit = await Audit.findById(auditId).populate("site");
  if (!audit) throw new Error("Audit introuvable");

  const mongoose = await import("mongoose");
  const collections = [
    "Generator",
    "Rectifier",
    "Battery",
    "SolarSystem",
    "FuelTank",
    "Earthing",
    "CompteurCIE",
    "ClientLoad",
    "Photo",
  ];

  await Promise.all(
    collections.map((modelName) => {
      try {
        const Model = mongoose.default.model(modelName);
        return Model.deleteMany({ audit: auditId });
      } catch (e) {
        return Promise.resolve();
      }
    }),
  );

  await Site.findByIdAndUpdate(audit.site._id, { status: SITE_STATUS.PENDING });
  const siteCode = audit.site?.code;
  await Audit.findByIdAndDelete(auditId);

  return { deleted: true, siteCode };
}

// ─── Réouvrir un audit (admin) ────────────────────────────────────────────────
export async function reopenAudit(auditId, adminId, reason) {
  const audit = await Audit.findOne({
    _id: auditId,
    status: AUDIT_STATUS.VALIDATED,
  });
  if (!audit) throw new Error("Seul un audit validé peut être réouvert");

  audit.status = AUDIT_STATUS.IN_PROGRESS;
  audit.isReopened = true;
  audit.reopenedBy = adminId;
  audit.reopenedAt = new Date();
  audit.reopenReason = reason;
  await audit.save();

  await Site.findByIdAndUpdate(audit.site, { status: SITE_STATUS.IN_PROGRESS });
  return audit;
}
