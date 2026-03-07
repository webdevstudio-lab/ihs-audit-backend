// src/controllers/site.controller.js
import mongoose from "mongoose";
import { Audit } from "../models/Audit.model.js";
import { Site } from "../models/Site.model.js";

import {
  createSite,
  getSites,
  getSiteById,
  getSiteByCode,
  updateSite,
  checkSiteAuditStatus,
  reopenSiteAudit,
  deleteSite,
} from "../services/site.service.js";
import { getPagination } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const siteController = {
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const {
        zone,
        status,
        client,
        typology,
        configuration,
        siteType,
        priority,
        search,
      } = ctx.query;
      const { sites, total } = await getSites({
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
      });
      return paginated(sites, total, page, limit);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  async getOne(ctx) {
    try {
      const site = await getSiteById(ctx.params.id);
      return success(site);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  async getByCode(ctx) {
    try {
      const site = await getSiteByCode(ctx.params.code);
      return success(site);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  async checkStatus(ctx) {
    try {
      const result = await checkSiteAuditStatus(ctx.params.code);
      return success(result);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  async create(ctx) {
    try {
      const site = await createSite(ctx.body);
      ctx.set.status = 201;
      return success(site, "Site cree avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  async update(ctx) {
    try {
      const site = await updateSite(ctx.params.id, ctx.body);
      return success(site, "Site mis a jour");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  async reopen(ctx) {
    try {
      const userId = ctx.user?._id || ctx.user?.id;
      const reason = ctx.body?.reason;
      const site = await reopenSiteAudit(ctx.params.id, userId, reason);
      return success(site, "Site rouvert");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  async delete(ctx) {
    try {
      const result = await deleteSite(ctx.params.id);
      return success(result, "Site supprimé avec succès");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /sites/equipment-filter?equipmentType=battery&brand=Enersys&condition=fair
  async filterByEquipment({ query, set }) {
    try {
      const { equipmentType, brand, condition } = query;

      if (!equipmentType) {
        return { success: true, data: [], count: 0 };
      }

      const MODEL_MAP = {
        battery: "Battery",
        generator: "Generator",
        rectifier: "Rectifier",
        solar: "SolarSystem",
        fuelTank: "FuelTank",
        earthing: "Earthing",
        compteurCIE: "CompteurCIE",
      };

      const modelName = MODEL_MAP[equipmentType];
      if (!modelName) {
        set.status = 400;
        return { success: false, message: "Type d'équipement invalide" };
      }

      // Filtre dynamique
      const equipFilter = {};
      if (brand && brand !== "all") equipFilter.brand = brand;
      if (condition && condition !== "all") equipFilter.condition = condition;

      const Equipment = mongoose.model(modelName);

      // 1. Équipements matchant les critères
      const equipments = await Equipment.find(equipFilter)
        .select("audit brand condition")
        .lean();

      if (equipments.length === 0) {
        return { success: true, data: [], count: 0 };
      }

      const auditIds = [...new Set(equipments.map((e) => e.audit.toString()))];

      // 2. Audits → siteIds
      const audits = await Audit.find({ _id: { $in: auditIds } })
        .select("site")
        .lean();

      if (audits.length === 0) {
        return { success: true, data: [], count: 0 };
      }

      const siteIds = [...new Set(audits.map((a) => a.site.toString()))];

      // 3. Sites avec coordonnées
      const sites = await Site.find({ _id: { $in: siteIds } })
        .select(
          "code name city zone status coordinates clients typology lastAuditScore",
        )
        .lean();

      return { success: true, data: sites, count: sites.length };
    } catch (err) {
      console.error("[filterByEquipment]", err.message);
      set.status = 500;
      return { success: false, message: err.message };
    }
  },
};
