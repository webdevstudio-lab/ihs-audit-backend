import { Site } from "../models/Site.model.js";
import { Audit } from "../models/Audit.model.js";
import { SITE_STATUS, AUDIT_STATUS } from "../config/constants.js";

/**
 * Cree un nouveau site
 */
export async function createSite(data) {
  const existing = await Site.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw new Error(`Le code site ${data.code} existe deja`);
  }

  const site = await Site.create({
    ...data,
    code: data.code.toUpperCase(),
  });

  return site;
}

/**
 * Liste les sites avec filtres et pagination
 */
export async function getSites({
  zone,
  status,
  client,
  typology,
  configuration,
  siteType,
  priority,
  search,
  page,
  limit,
  skip,
}) {
  const filter = {};

  if (zone) filter.zone = zone;
  if (status) filter.status = status;
  if (client) filter.clients = client;
  if (typology) filter.typology = typology;
  if (configuration) filter.configuration = configuration;
  if (siteType) filter.siteType = siteType;
  if (priority) filter.priority = priority;

  if (search) {
    filter.$or = [
      { code: new RegExp(search, "i") },
      { name: new RegExp(search, "i") },
      { city: new RegExp(search, "i") },
    ];
  }

  const [sites, total] = await Promise.all([
    Site.find(filter)
      .populate("assignedTechnician", "name techCode")
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 }),
    Site.countDocuments(filter),
  ]);

  return { sites, total };
}

/**
 * Recupere un site par son code
 */
export async function getSiteByCode(code) {
  const site = await Site.findOne({ code: code.toUpperCase() })
    .populate("assignedTechnician", "name techCode")
    .populate("photos"); // ← nouveau
  if (!site) throw new Error(`Site ${code} introuvable`);
  return site;
}

/**
 * Recupere un site par son ID
 */
export async function getSiteById(id) {
  const site = await Site.findById(id)
    .populate("assignedTechnician", "name techCode")
    .populate("photos"); // ← nouveau
  if (!site) throw new Error("Site introuvable");
  return site;
}

/**
 * Met a jour un site
 */
export async function updateSite(id, data) {
  const site = await Site.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!site) throw new Error("Site introuvable");
  return site;
}

/**
 * Verifie si un site peut etre audite
 */
export async function checkSiteAuditStatus(code) {
  const site = await getSiteByCode(code);

  const existingAudit = await Audit.findOne({
    site: site._id,
    status: {
      $in: [
        AUDIT_STATUS.DRAFT,
        AUDIT_STATUS.IN_PROGRESS,
        AUDIT_STATUS.SUBMITTED,
      ],
    },
  })
    .populate("technician", "name techCode")
    .sort({ createdAt: -1 });

  const lastValidated = await Audit.findOne({
    site: site._id,
    status: AUDIT_STATUS.VALIDATED,
  }).sort({ validatedAt: -1 });

  return {
    site,
    existingAudit,
    lastValidated,
    canAudit: !existingAudit || site.reopenedAt !== undefined,
  };
}

/**
 * Autorise la reprise d'un audit sur un site
 */
export async function reopenSiteAudit(siteId, userId, reason) {
  const site = await Site.findById(siteId);
  if (!site) throw new Error("Site introuvable");

  site.reopenedBy = userId;
  site.reopenedAt = new Date();
  site.status = SITE_STATUS.PENDING;
  await site.save();

  await Audit.updateMany(
    {
      site: siteId,
      status: { $in: [AUDIT_STATUS.SUBMITTED, AUDIT_STATUS.VALIDATED] },
    },
    {
      $set: {
        isReopened: true,
        reopenedBy: userId,
        reopenedAt: new Date(),
        reopenReason: reason,
      },
    },
  );

  return site;
}

/**
 * Supprime un site (admin uniquement)
 */
export async function deleteSite(id) {
  const site = await Site.findById(id);
  if (!site) throw new Error("Site introuvable");

  const activeAudit = await Audit.findOne({
    site: id,
    status: {
      $in: [
        AUDIT_STATUS.DRAFT,
        AUDIT_STATUS.IN_PROGRESS,
        AUDIT_STATUS.SUBMITTED,
      ],
    },
  });

  if (activeAudit) {
    throw new Error("Impossible de supprimer un site avec un audit en cours");
  }

  await Site.findByIdAndDelete(id);
  return { deleted: true, id };
}
