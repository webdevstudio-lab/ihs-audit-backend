import {
  saveEquipment,
  getEquipment,
  saveClientLoad,
  getClientLoads,
} from "../services/equipment.service.js";
import { success, error } from "../utils/response.js";

export const equipmentController = {
  // POST /equipment/:auditId/:type
  async save(ctx) {
    try {
      const { auditId, type } = ctx.params;
      const equipment = await saveEquipment(
        auditId,
        ctx.user._id,
        type,
        ctx.body,
      );
      return success(equipment, `${type} sauvegarde`);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /equipment/:auditId/:type
  async getOne(ctx) {
    try {
      const { auditId, type } = ctx.params;
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
      return success(clientLoad, "Charge client sauvegardee");
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
