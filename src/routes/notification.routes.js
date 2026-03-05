import { Elysia } from "elysia";
import { notificationController } from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";

export const notificationRoutes = new Elysia({ prefix: "/notifications" })

  .use(authMiddleware)
  .use(allRoles)

  // Nombre de notifications non lues — léger, appelé fréquemment
  .get("/unread-count", (ctx) => notificationController.unreadCount(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Nombre de notifications non lues",
    },
  })

  // Liste des notifications
  .get("/", (ctx) => notificationController.list(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Liste des notifications — ?unreadOnly=true pour filtrer",
    },
  })

  // Marquer toutes comme lues
  .patch("/read-all", (ctx) => notificationController.markAllRead(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Marquer toutes les notifications comme lues",
    },
  })

  // Supprimer les notifications lues
  .delete("/read", (ctx) => notificationController.deleteRead(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Supprimer toutes les notifications lues",
    },
  })

  // Marquer une notification comme lue
  .patch("/:id/read", (ctx) => notificationController.markRead(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Marquer une notification comme lue",
    },
  })

  // Supprimer une notification
  .delete("/:id", (ctx) => notificationController.delete(ctx), {
    detail: {
      tags: ["Notifications"],
      summary: "Supprimer une notification",
    },
  });
