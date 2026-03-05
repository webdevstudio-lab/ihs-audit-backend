import { CompteurCIE } from "../models/CompteurCIE.model.js";
import { Audit } from "../models/Audit.model.js";
import { success, error } from "../utils/response.js";

export const compteurCIEController = {
  // GET /compteur-cie/audit/:auditId
  async getByAudit(ctx) {
    try {
      const compteur = await CompteurCIE.findOne({
        audit: ctx.params.auditId,
      }).populate("photos");

      if (!compteur) {
        ctx.set.status = 404;
        return error("Compteur CIE introuvable pour cet audit", 404);
      }

      return success(compteur);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /compteur-cie
  async create(ctx) {
    try {
      const { audit: auditId, ...data } = ctx.body;

      // Vérifie que l'audit existe
      const audit = await Audit.findById(auditId);
      if (!audit) throw new Error("Audit introuvable");

      // Un seul compteur CIE par audit
      const existing = await CompteurCIE.findOne({ audit: auditId });
      if (existing)
        throw new Error("Un compteur CIE existe déjà pour cet audit");

      const compteur = await CompteurCIE.create({ audit: auditId, ...data });

      // Lie le compteur à l'audit
      await Audit.findByIdAndUpdate(auditId, { compteurCIE: compteur._id });

      ctx.set.status = 201;
      return success(compteur, "Compteur CIE créé avec succès");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /compteur-cie/:id
  async update(ctx) {
    try {
      const compteur = await CompteurCIE.findByIdAndUpdate(
        ctx.params.id,
        { $set: ctx.body },
        { new: true, runValidators: true },
      );

      if (!compteur) throw new Error("Compteur CIE introuvable");

      return success(compteur, "Compteur CIE mis à jour");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // DELETE /compteur-cie/:id — admin uniquement
  async delete(ctx) {
    try {
      const compteur = await CompteurCIE.findById(ctx.params.id);
      if (!compteur) throw new Error("Compteur CIE introuvable");

      // Retire le lien dans l'audit
      await Audit.findByIdAndUpdate(compteur.audit, {
        $unset: { compteurCIE: 1 },
      });

      await CompteurCIE.findByIdAndDelete(ctx.params.id);

      return success({ deleted: true }, "Compteur CIE supprimé");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
