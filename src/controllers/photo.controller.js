import {
  uploadPhoto,
  getAuditPhotos,
  deletePhoto,
} from "../services/photo.service.js";
import { success, error } from "../utils/response.js";

export const photoController = {
  async upload(ctx) {
    try {
      const { auditId } = ctx.params;
      const uploadedFile = ctx.uploadedFile; // ← injecté par la route
      const category = ctx.body?.category || "general";
      const caption = ctx.body?.caption || "";

      const coordinates =
        ctx.body?.lat && ctx.body?.lng
          ? { lat: parseFloat(ctx.body.lat), lng: parseFloat(ctx.body.lng) }
          : null;

      if (!uploadedFile) {
        ctx.set.status = 400;
        return error("Aucun fichier reçu");
      }

      const photo = await uploadPhoto(
        auditId,
        ctx.user._id,
        uploadedFile,
        category,
        caption,
        coordinates,
      );

      ctx.set.status = 201;
      return success(photo, "Photo uploadée avec succès");
    } catch (err) {
      console.error("[PHOTO UPLOAD ERROR]", err.message, err.stack);
      ctx.set.status = err.message?.includes("introuvable") ? 404 : 500;
      return error(err.message);
    }
  },

  async list(ctx) {
    try {
      const photos = await getAuditPhotos(
        ctx.params.auditId,
        ctx.query?.category,
      );
      return success(photos);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  async remove(ctx) {
    try {
      const result = await deletePhoto(ctx.params.photoId, ctx.user._id);
      return success(result, "Photo supprimée");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
