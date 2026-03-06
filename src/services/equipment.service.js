import { Audit } from "../models/Audit.model.js";
import { Generator } from "../models/Generator.model.js";
import { Rectifier } from "../models/Rectifier.model.js";
import { Battery } from "../models/Battery.model.js";
import { SolarSystem } from "../models/SolarSystem.model.js";
import { Earthing } from "../models/Earthing.model.js";
import { FuelTank } from "../models/FuelTank.model.js";
import { ClientLoad } from "../models/ClientLoad.model.js";
import { CompteurCIE } from "../models/CompteurCIE.model.js";
import { AUDIT_STATUS } from "../config/constants.js";

// Map nom equipement => Model Mongoose
const EQUIPMENT_MODELS = {
  generator: Generator,
  rectifier: Rectifier,
  battery: Battery,
  solar: SolarSystem,
  earthing: Earthing,
  fuelTank: FuelTank,
  compteurCIE: CompteurCIE, // ← AJOUT
};

/**
 * Vérifie que l'audit existe et est modifiable par ce technicien
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
 * Sauvegarde ou met à jour un équipement sur un audit
 *
 * @param {string} auditId      - ID de l'audit
 * @param {string} technicianId - ID du technicien connecté
 * @param {string} type         - Type d'équipement
 * @param {Object} data         - Données validées par Zod
 */
export async function saveEquipment(auditId, technicianId, type, data) {
  const Model = EQUIPMENT_MODELS[type];
  if (!Model) throw new Error(`Type équipement inconnu : ${type}`);

  const audit = await getEditableAudit(auditId, technicianId);

  let equipment;

  if (audit[type]) {
    // Mise à jour
    equipment = await Model.findByIdAndUpdate(
      audit[type],
      { $set: data },
      { returnDocument: "after", runValidators: true },
    );
  } else {
    // Création + liaison audit
    equipment = await Model.create({ ...data, audit: auditId });
    audit[type] = equipment._id;
    await audit.save();
  }

  return equipment;
}

/**
 * Récupère un équipement d'un audit avec ses photos
 */
export async function getEquipment(auditId, type) {
  const Model = EQUIPMENT_MODELS[type];
  if (!Model) throw new Error(`Type équipement inconnu : ${type}`);

  const equipment = await Model.findOne({ audit: auditId }).populate("photos");
  return equipment;
}

/**
 * Sauvegarde la charge d'un client sur un audit
 */
export async function saveClientLoad(auditId, technicianId, data) {
  const audit = await getEditableAudit(auditId, technicianId);

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
    audit.clientLoads.push(clientLoad._id);
    await audit.save();
  }

  return clientLoad;
}

/**
 * Récupère toutes les charges clients d'un audit
 */
export async function getClientLoads(auditId) {
  return ClientLoad.find({ audit: auditId });
}
