import {
  createAdmin,
  createTechnician,
  generateNextTechCode,
  getUsers,
  getUserById,
  updateUser,
  toggleUserActive,
} from "../services/user.service.js";
import { getPagination, getSort } from "../utils/pagination.js";
import { success, error, paginated } from "../utils/response.js";

export const userController = {
  // GET /users
  async list(ctx) {
    try {
      const { page, limit, skip } = getPagination(ctx.query);
      const { role, zone, isActive } = ctx.query;

      const { users, total } = await getUsers({
        role,
        zone,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        page,
        limit,
        skip,
      });

      return paginated(users, total, page, limit);
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /users/:id
  async getOne(ctx) {
    try {
      const user = await getUserById(ctx.params.id);
      return success(user);
    } catch (err) {
      ctx.set.status = 404;
      return error(err.message, 404);
    }
  },

  // POST /users/admin
  async createAdmin(ctx) {
    try {
      const user = await createAdmin(ctx.body);
      ctx.set.status = 201;
      return success(user, "Admin cree avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /users/technician
  async createTechnician(ctx) {
    try {
      const user = await createTechnician(ctx.body);
      ctx.set.status = 201;
      return success(user, "Technicien cree avec succes");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /users/next-tech-code
  async nextTechCode(ctx) {
    try {
      const code = await generateNextTechCode();
      return success({ code }, "Prochain code disponible");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /users/:id
  async update(ctx) {
    try {
      const user = await updateUser(ctx.params.id, ctx.body);
      return success(user, "Utilisateur mis a jour");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // PATCH /users/:id/toggle
  async toggle(ctx) {
    try {
      const user = await toggleUserActive(ctx.params.id);
      return success(
        user,
        user.isActive ? "Compte active" : "Compte desactive",
      );
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },
};
