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
  search,
  page,
  limit,
  skip,
}) {
  const filter = { isActive: true };

  if (zone) filter.zone = zone;
  if (status) filter.status = status;
  if (client) filter.clients = client;

  if (search) {
    filter.$or = [
      { code: new RegExp(search, "i") },
      { name: new RegExp(search, "i") },
      { city: new RegExp(search, "i") },
    ];
  }

  const [sites, total] = await Promise.all([
    Site.find(filter)
      .populate("lastAudit", "status globalScore visitDate")
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
  const site = await Site.findOne({ code: code.toUpperCase() }).populate(
    "lastAudit",
  );

  if (!site) throw new Error(`Site ${code} introuvable`);
  return site;
}

/**
 * Recupere un site par son ID
 */
export async function getSiteById(id) {
  const site = await Site.findById(id).populate("lastAudit");
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
 * Retourne le statut et l'audit existant si present
 */
export async function checkSiteAuditStatus(code) {
  const site = await getSiteByCode(code);

  // Cherche un audit en cours ou soumis sur ce site
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

  // Cherche le dernier audit valide
  const lastValidated = await Audit.findOne({
    site: site._id,
    status: AUDIT_STATUS.VALIDATED,
  }).sort({ validatedAt: -1 });

  return {
    site,
    existingAudit, // audit en cours (bloque si present)
    lastValidated, // dernier audit valide (historique)
    canAudit: !existingAudit || site.reopenedAt !== undefined,
  };
}

/**
 * Autorise la reprise d'un audit sur un site
 * Reservé aux admins et superviseurs
 */
export async function reopenSiteAudit(siteId, userId, reason) {
  const site = await Site.findById(siteId);
  if (!site) throw new Error("Site introuvable");

  site.reopenedBy = userId;
  site.reopenedAt = new Date();
  site.status = SITE_STATUS.PENDING;
  await site.save();

  // Marque aussi l'audit existant comme reouvert
  await Audit.updateMany(
    {
      site: siteId,
      status: {
        $in: [AUDIT_STATUS.SUBMITTED, AUDIT_STATUS.VALIDATED],
      },
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
