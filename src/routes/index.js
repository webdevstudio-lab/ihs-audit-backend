import { Elysia } from "elysia";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { siteRoutes } from "./site.routes.js";
import { auditRoutes } from "./audit.routes.js";
import { equipmentRoutes } from "./equipment.routes.js";
import { photoRoutes } from "./photo.routes.js";
import { iaRoutes } from "./ia.routes.js";
import { statsRoutes } from "./stats.routes.js";
import { compteurCIERoutes } from "./compteurCIE.routes.js";
import { notificationRoutes } from "./notification.routes.js";

export const routes = new Elysia({ prefix: "/api" })
  .use(authRoutes)
  .use(userRoutes)
  .use(siteRoutes)
  .use(auditRoutes)
  .use(equipmentRoutes)
  .use(photoRoutes)
  .use(iaRoutes)
  .use(statsRoutes)
  .use(notificationRoutes)
  .use(compteurCIERoutes);
