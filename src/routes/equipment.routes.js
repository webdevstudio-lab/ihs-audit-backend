import { Elysia } from "elysia";
import { equipmentController } from "../controllers/equipment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allRoles } from "../middleware/role.middleware.js";
import {
  generatorSchema,
  rectifierSchema,
  batterySchema,
  solarSchema,
  earthingSchema,
  fuelTankSchema,
  compteurCIESchema, // ← AJOUT
} from "../validations/equipment.validation.js";

// Map type => schema de validation
const SCHEMAS = {
  generator: generatorSchema,
  rectifier: rectifierSchema,
  battery: batterySchema,
  solar: solarSchema,
  earthing: earthingSchema,
  fuelTank: fuelTankSchema,
  compteurCIE: compteurCIESchema, // ← AJOUT
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
        summary: "Charges clients d'un audit",
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
        summary: "Sauvegarder la charge d'un client",
      },
    },
  )

  // GET /equipment/:auditId/:type
  // type: generator | rectifier | battery | solar | earthing | fuelTank | compteurCIE
  .get("/:auditId/:type", (ctx) => equipmentController.getOne(ctx), {
    detail: {
      tags: ["Equipment"],
      summary: "Récupérer un équipement d'un audit",
    },
  })

  // POST /equipment/:auditId/:type
  .post(
    "/:auditId/:type",
    (ctx) => {
      const schema = SCHEMAS[ctx.params.type];

      if (!schema) {
        ctx.set.status = 400;
        return {
          success: false,
          message: `Type invalide. Valeurs acceptées : ${Object.keys(SCHEMAS).join(", ")}`,
        };
      }

      const result = schema.safeParse(ctx.body);
      if (!result.success) {
        ctx.set.status = 422;
        return {
          success: false,
          message: "Données invalides",
          errors: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        };
      }

      ctx.body = result.data;
      return equipmentController.save(ctx);
    },
    {
      detail: {
        tags: ["Equipment"],
        summary:
          "Sauvegarder un équipement (generator, rectifier, battery, solar, earthing, fuelTank, compteurCIE)",
      },
    },
  );
