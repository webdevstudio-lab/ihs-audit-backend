import {
  loginAdmin,
  loginTechnician,
  generateTokenPair,
  refreshAccessToken,
  logout,
  logoutAllDevices,
} from "../services/auth.service.js";
import { success, error } from "../utils/response.js";

export const authController = {
  // POST /api/auth/login/admin
  async loginAdmin(ctx) {
    try {
      const { email, password } = ctx.body;
      const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = ctx.request.headers.get("user-agent") || "";

      const user = await loginAdmin(email, password, {
        ip,
        userAgent,
        platform: "web",
      });

      const { accessToken, refreshToken } = await generateTokenPair(
        user,
        ctx.jwt,
        { ip, userAgent, platform: "web" },
      );

      return success({ accessToken, refreshToken, user }, "Connexion reussie");
    } catch (err) {
      ctx.set.status = 401;
      return error(err.message, 401);
    }
  },

  // POST /api/auth/login/tech
  async loginTech(ctx) {
    try {
      const { name, techCode } = ctx.body;
      const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = ctx.request.headers.get("user-agent") || "";

      const user = await loginTechnician(name, techCode, {
        ip,
        userAgent,
        platform: "mobile",
      });

      const { accessToken, refreshToken } = await generateTokenPair(
        user,
        ctx.jwt,
        { ip, userAgent, platform: "mobile" },
      );

      return success({ accessToken, refreshToken, user }, "Connexion reussie");
    } catch (err) {
      ctx.set.status = 401;
      return error(err.message, 401);
    }
  },

  // POST /api/auth/refresh
  async refresh(ctx) {
    try {
      const { refreshToken } = ctx.body;

      if (!refreshToken) {
        ctx.set.status = 400;
        return error("Refresh token manquant", 400);
      }

      const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";
      const userAgent = ctx.request.headers.get("user-agent") || "";

      const result = await refreshAccessToken(refreshToken, ctx.jwt, {
        ip,
        userAgent,
      });

      return success(result, "Token renouvele");
    } catch (err) {
      ctx.set.status = 401;
      return error(err.message, 401);
    }
  },

  // POST /api/auth/logout
  async logout(ctx) {
    try {
      const { refreshToken } = ctx.body || {};
      const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";

      if (refreshToken) {
        await logout(refreshToken, ctx.user._id, ip);
      }

      return success(null, "Deconnexion reussie");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // POST /api/auth/logout-all
  async logoutAll(ctx) {
    try {
      const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";
      await logoutAllDevices(ctx.user._id, ip);
      return success(null, "Deconnecte de tous les appareils");
    } catch (err) {
      ctx.set.status = 400;
      return error(err.message);
    }
  },

  // GET /api/auth/me
  async me(ctx) {
    return success(ctx.user, "Utilisateur connecte");
  },
};
