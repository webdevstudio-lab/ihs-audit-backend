import { Elysia, t } from "elysia";
import { photoController } from "../controllers/photo.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import { rateLimit } from "../middleware/ratelimit.middleware.js";

export const photoRoutes = new Elysia({ prefix: "/photos" })
  .use(authMiddleware)
  .use(allRoles)

  .get("/:auditId", (ctx) => photoController.list(ctx), {
    detail: { tags: ["Photos"], summary: "Liste des photos d'un audit" },
  })

  .delete("/:photoId", (ctx) => photoController.remove(ctx), {
    detail: { tags: ["Photos"], summary: "Supprimer une photo" },
  })

  .use(rateLimit("upload"))

  // ── type: "formdata" dit à Elysia d'exposer le body brut sans le consommer
  .post(
    "/:auditId",
    async (ctx) => {
      const raw = ctx.request;
      const file = ctx.body?.photo; // ← Elysia expose le File ici

      if (!file || typeof file === "string") {
        ctx.set.status = 400;
        return { success: false, message: "Champ 'photo' manquant" };
      }

      const MAX = 10 * 1024 * 1024;
      const ALLOWED = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/jpg",
      ];

      if (file.size > MAX) {
        ctx.set.status = 413;
        return {
          success: false,
          message: `Fichier trop volumineux (max 10 MB)`,
        };
      }
      if (!ALLOWED.includes(file.type)) {
        ctx.set.status = 415;
        return { success: false, message: `Type non accepté : ${file.type}` };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      console.log(
        "[UPLOAD] ok →",
        file.name,
        file.type,
        buffer.length,
        "bytes",
      );

      ctx.uploadedFile = {
        buffer,
        name: file.name || `photo_${Date.now()}.jpg`,
        mimeType: file.type || "image/jpeg",
        size: file.size,
      };

      // Récupère les autres champs
      ctx.body.category = ctx.body?.category || "general";
      ctx.body.caption = ctx.body?.caption || "";

      return photoController.upload(ctx);
    },
    {
      // ← CLÉ : dire à Elysia le schéma exact du formdata
      body: t.Object({
        photo: t.File(),
        category: t.Optional(t.String()),
        caption: t.Optional(t.String()),
        lat: t.Optional(t.String()),
        lng: t.Optional(t.String()),
      }),
      detail: { tags: ["Photos"], summary: "Uploader une photo pour un audit" },
    },
  );
