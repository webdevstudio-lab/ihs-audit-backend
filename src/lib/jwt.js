import jwt from "@elysiajs/jwt";
import { ENV } from "../config/env.js";

// Signe un token JWT
// payload : { id, role, techCode }
export function signToken(payload) {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
}

// Verifie et decode un token JWT
// Retourne le payload ou leve une erreur
export function verifyToken(token) {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    throw new Error("Token invalide ou expire");
  }
}

// Decode sans verifier (pour lire le payload expire)
export function decodeToken(token) {
  return jwt.decode(token);
}
