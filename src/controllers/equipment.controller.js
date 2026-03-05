import {
  saveEquipment,
  getEquipment,
  saveClientLoad,
  getClientLoads,
} from "../services/equipment.service.js";
import { success, error } from "../utils/response.js";

const VALID_TYPES = [
  "generator",
  "rectifier",
  "battery",
  "solar",
  "earthing",
  "fuelTank",
  "compteurCIE",
];

export const equipmentController = {
  // POST /equipment/:auditId/:type
  async save(ctx) {
    try {
      const { auditId, type } = ctx.params;

      if (!VALID_TYPES.includes(type)) {
        ctx.set.status = 400;
        return error(
          `Type d'équipement invalide. Valeurs acceptées : ${VALID_TYPES.join(", ")}`,
        );
      }

      const equipment = await saveEquipment(
        auditId,
        ctx.user._id,
        type,
        ctx.body,
      );
      return success(equipment, `${type} sauvegardé`);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /equipment/:auditId/:type
  async getOne(ctx) {
    try {
      const { auditId, type } = ctx.params;

      if (!VALID_TYPES.includes(type)) {
        ctx.set.status = 400;
        return error(`Type d'équipement invalide`);
      }

      const equipment = await getEquipment(auditId, type);
      return success(equipment);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // POST /equipment/:auditId/client-load
  async saveClientLoad(ctx) {
    try {
      const clientLoad = await saveClientLoad(
        ctx.params.auditId,
        ctx.user._id,
        ctx.body,
      );
      return success(clientLoad, "Charge client sauvegardée");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /equipment/:auditId/client-loads
  async getClientLoads(ctx) {
    try {
      const loads = await getClientLoads(ctx.params.auditId);
      return success(loads);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
