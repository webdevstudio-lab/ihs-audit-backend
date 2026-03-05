import { z } from "zod";

/**
 * Valide le body avec un schema Zod
 * Retourne une fonction directement utilisable dans beforeHandle
 */
export const validate =
  (schema) =>
  async ({ body, set }) => {
    if (!body) {
      set.status = 422;
      return {
        success: false,
        message: "Body manquant",
        code: 422,
      };
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      set.status = 422;

      const details = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return {
        success: false,
        message: "Validation echouee",
        code: 422,
        details,
      };
    }

    // Injecte les donnees validees dans le body
    Object.assign(body, result.data);
  };
