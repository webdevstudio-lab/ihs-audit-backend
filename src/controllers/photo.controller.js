import {
  uploadPhoto,
  getAuditPhotos,
  deletePhoto,
} from "../services/photo.service.js";
import { success, error } from "../utils/response.js";

export const photoController = {
  // POST /photos/:auditId
  async upload(ctx) {
    try {
      const { auditId } = ctx.params;
      const { category, caption } = ctx.body || {};
      const { uploadedFile } = ctx;

      // Coordonnees GPS optionnelles
      const coordinates =
        ctx.body?.lat && ctx.body?.lng
          ? { lat: parseFloat(ctx.body.lat), lng: parseFloat(ctx.body.lng) }
          : null;

      if (!uploadedFile) {
        ctx.set.status = 400;
        return error("Aucun fichier recu");
      }

      const photo = await uploadPhoto(
        auditId,
        ctx.user._id,
        uploadedFile,
        category || "general",
        caption || "",
        coordinates,
      );

      ctx.set.status = 201;
      return success(photo, "Photo uploadee avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /photos/:auditId
  async list(ctx) {
    try {
      const { auditId } = ctx.params;
      const { category } = ctx.query;

      const photos = await getAuditPhotos(auditId, category);
      return success(photos);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // DELETE /photos/:photoId
  async remove(ctx) {
    try {
      const result = await deletePhoto(ctx.params.photoId, ctx.user._id);
      return success(result, "Photo supprimee");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
