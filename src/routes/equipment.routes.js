import { Elysia } from "elysia";
import { equipmentController } from "../controllers/equipment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  generatorSchema,
  rectifierSchema,
  batterySchema,
  solarSchema,
  earthingSchema,
  fuelTankSchema,
} from "../validations/equipment.validation.js";

// Map type => schema de validation
const SCHEMAS = {
  generator: generatorSchema,
  rectifier: rectifierSchema,
  battery: batterySchema,
  solar: solarSchema,
  earthing: earthingSchema,
  fuelTank: fuelTankSchema,
};

export const equipmentRoutes = new Elysia({ prefix: "/equipment" })

  .use(authMiddleware)
  .use(allRoles)

  // GET /equipment/:auditId/client-loads
  .get(
    "/:auditId/client-loads",
    (ctx) => equipmentController.getClientLoads(ctx),
    {
      detail: {
        tags: ["Equipment"],
        summary: "Charges clients d un audit",
      },
    },
  )

  // POST /equipment/:auditId/client-load
  .post(
    "/:auditId/client-load",
    (ctx) => equipmentController.saveClientLoad(ctx),
    {
      detail: {
        tags: ["Equipment"],
        summary: "Sauvegarder la charge d un client",
      },
    },
  )

  // GET /equipment/:auditId/:type
  .get("/:auditId/:type", (ctx) => equipmentController.getOne(ctx), {
    detail: {
      tags: ["Equipment"],
      summary: "Recuperer un equipement d un audit",
    },
  })

  // POST /equipment/:auditId/:type
  .post(
    "/:auditId/:type",
    (ctx) => {
      // Validation dynamique selon le type d'equipement
      const schema = SCHEMAS[ctx.params.type];
      if (schema) {
        const result = schema.safeParse(ctx.body);
        if (!result.success) {
          ctx.set.status = 422;
          return {
            success: false,
            message: "Donnees invalides",
            details: result.error.errors,
          };
        }
        ctx.body = result.data;
      }
      return equipmentController.save(ctx);
    },
    {
      detail: {
        tags: ["Equipment"],
        summary: "Sauvegarder un equipement (generator, rectifier, battery...)",
      },
    },
  );
