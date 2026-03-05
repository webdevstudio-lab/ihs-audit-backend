import { Server } from "socket.io";
import { ENV } from "../config/env.js";

let io = null;

// Initialise Socket.io sur le serveur HTTP
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.CORS_ORIGIN.split(","),
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connecte : ${socket.id}`);

    // Rejoindre une room par zone
    socket.on("join:zone", (zone) => {
      socket.join(`zone:${zone}`);
    });

    // Rejoindre la room admin (dashboard global)
    socket.on("join:admin", () => {
      socket.join("admin");
    });

    socket.on("disconnect", () => {
      console.log(`Socket deconnecte : ${socket.id}`);
    });
  });

  return io;
}

// Retourne l'instance Socket.io
export function getSocket() {
  if (!io) throw new Error("Socket.io non initialise");
  return io;
}

// ── EMITTERS ─────────────────────────────────────────────────
// Fonctions pour emettre des evenements depuis les services

// Nouvel audit demarre
export function emitAuditStarted(audit) {
  getSocket().to("admin").emit("audit:started", audit);
}

// Audit soumis
export function emitAuditSubmitted(audit) {
  getSocket().to("admin").emit("audit:submitted", audit);
}

// Alerte critique detectee
export function emitCriticalAlert(data) {
  getSocket().to("admin").emit("alert:critical", data);
}

// Mise a jour du statut d'un site
export function emitSiteUpdated(site) {
  getSocket().to("admin").emit("site:updated", site);
}

// Technicien actif (position/activite)
export function emitTechnicianActive(technician) {
  getSocket().to("admin").emit("technician:active", technician);
}
