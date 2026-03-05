import { Audit } from "../models/Audit.model.js";
import { Generator } from "../models/Generator.model.js";
import { Rectifier } from "../models/Rectifier.model.js";
import { Battery } from "../models/Battery.model.js";
import { SolarSystem } from "../models/SolarSystem.model.js";
import { Earthing } from "../models/Earthing.model.js";
import { FuelTank } from "../models/FuelTank.model.js";
import { ClientLoad } from "../models/ClientLoad.model.js";
import { AUDIT_STATUS } from "../config/constants.js";

// Map nom equipement => Model Mongoose correspondant
const EQUIPMENT_MODELS = {
  generator: Generator,
  rectifier: Rectifier,
  battery: Battery,
  solar: SolarSystem,
  earthing: Earthing,
  fuelTank: FuelTank,
};

/**
 * Verifie que l'audit existe et est modifiable par ce technicien
 */
async function getEditableAudit(auditId, technicianId) {
  const audit = await Audit.findOne({
    _id: auditId,
    technician: technicianId,
    status: AUDIT_STATUS.IN_PROGRESS,
  });

  if (!audit) {
    throw new Error("Audit introuvable ou non modifiable");
  }

  return audit;
}

/**
 * Sauvegarde ou met a jour un equipement sur un audit
 * Fonctionne pour tous les types d'equipements
 *
 * @param {string} auditId      - ID de l'audit
 * @param {string} technicianId - ID du technicien connecte
 * @param {string} type         - Type : 'generator' | 'rectifier' | 'battery' | 'solar' | 'earthing' | 'fuelTank'
 * @param {Object} data         - Donnees de l'equipement (validees par Zod)
 */
export async function saveEquipment(auditId, technicianId, type, data) {
  const Model = EQUIPMENT_MODELS[type];
  if (!Model) throw new Error(`Type equipement inconnu : ${type}`);

  const audit = await getEditableAudit(auditId, technicianId);

  let equipment;

  // Si l'equipement existe deja on le met a jour
  if (audit[type]) {
    equipment = await Model.findByIdAndUpdate(
      audit[type],
      { $set: data },
      { new: true, runValidators: true },
    );
  } else {
    // Sinon on le cree et on lie l'audit
    equipment = await Model.create({ ...data, audit: auditId });

    // Lie l'equipement a l'audit
    audit[type] = equipment._id;
    await audit.save();
  }

  return equipment;
}

/**
 * Recupere un equipement d'un audit
 */
export async function getEquipment(auditId, type) {
  const Model = EQUIPMENT_MODELS[type];
  if (!Model) throw new Error(`Type equipement inconnu : ${type}`);

  const equipment = await Model.findOne({ audit: auditId }).populate("photos");

  return equipment;
}

/**
 * Sauvegarde la charge d'un client sur un site
 * Un audit peut avoir plusieurs ClientLoad (un par client)
 */
export async function saveClientLoad(auditId, technicianId, data) {
  const audit = await getEditableAudit(auditId, technicianId);

  // Cherche si ce client a deja une entree sur cet audit
  const existing = await ClientLoad.findOne({
    audit: auditId,
    client: data.client,
  });

  let clientLoad;

  if (existing) {
    clientLoad = await ClientLoad.findByIdAndUpdate(
      existing._id,
      { $set: data },
      { new: true },
    );
  } else {
    clientLoad = await ClientLoad.create({ ...data, audit: auditId });

    // Ajoute a la liste clientLoads de l'audit
    audit.clientLoads.push(clientLoad._id);
    await audit.save();
  }

  return clientLoad;
}

/**
 * Recupere toutes les charges clients d'un audit
 */
export async function getClientLoads(auditId) {
  return ClientLoad.find({ audit: auditId });
}
