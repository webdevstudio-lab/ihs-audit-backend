import { ROLES } from "../config/constants.js";

/**
 * Verifie que l'utilisateur a le bon role
 * Usage : .use(requireRole([ROLES.ADMIN, ROLES.SUPERVISOR]))
 * @param {Array} roles - Roles autorises
 */
export const requireRole =
  (roles = []) =>
  (app) =>
    app.derive(({ user, set }) => {
      if (!user) {
        set.status = 401;
        throw new Error("Non authentifie");
      }

      if (!roles.includes(user.role)) {
        set.status = 403;
        throw new Error(`Acces refuse — roles autorises : ${roles.join(", ")}`);
      }

      return {};
    });

// Raccourcis pratiques

// Reservé aux admins uniquement
export const adminOnly = requireRole([ROLES.ADMIN]);

// Reservé aux admins et superviseurs
export const supervisorOnly = requireRole([ROLES.ADMIN, ROLES.SUPERVISOR]);

// Accessible a tous les utilisateurs connectes
export const allRoles = requireRole([
  ROLES.ADMIN,
  ROLES.SUPERVISOR,
  ROLES.TECHNICIAN,
]);
