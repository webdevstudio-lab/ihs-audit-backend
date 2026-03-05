import { error } from "../utils/response.js";
import { User } from "../models/User.model.js";

export const authMiddleware = (app) =>
  app.derive(async ({ jwt, headers, set }) => {
    // Recupere le token dans le header Authorization
    const authHeader = headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Token manquant");
    }

    const token = authHeader.split(" ")[1];

    // Verifie et decode le token
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      throw new Error("Token invalide ou expire");
    }

    // Recupere l'utilisateur en base
    const user = await User.findById(payload.id).select("-password");

    if (!user) {
      set.status = 401;
      throw new Error("Utilisateur introuvable");
    }

    if (!user.isActive) {
      set.status = 403;
      throw new Error("Compte desactive");
    }

    // Injecte l'utilisateur dans le contexte
    // Disponible via ctx.user dans tous les controllers
    return { user };
  });
