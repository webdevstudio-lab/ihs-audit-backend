import { Elysia } from "elysia";
import { photoController } from "../controllers/photo.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import { rateLimit } from "../middleware/ratelimit.middleware.js";

export const photoRoutes = new Elysia({ prefix: "/photos" })

  .use(authMiddleware)
  .use(allRoles)

  // Liste des photos d'un audit
  .get("/:auditId", (ctx) => photoController.list(ctx), {
    detail: {
      tags: ["Photos"],
      summary: "Liste des photos d un audit",
    },
  })

  // Upload photo — limite rate + validation fichier
  .use(rateLimit("upload"))
  .use(uploadMiddleware)
  .post("/:auditId", (ctx) => photoController.upload(ctx), {
    detail: {
      tags: ["Photos"],
      summary: "Uploader une photo pour un audit",
    },
  })

  // Supprimer une photo
  .delete("/:photoId", (ctx) => photoController.remove(ctx), {
    detail: {
      tags: ["Photos"],
      summary: "Supprimer une photo",
    },
  });
