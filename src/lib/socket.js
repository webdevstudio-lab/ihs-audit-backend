// Gestionnaire WebSocket natif Elysia
// Remplace Socket.io

const clients = new Set();

export function addClient(ws) {
  clients.add(ws);
}

export function removeClient(ws) {
  clients.delete(ws);
}

// Émet un événement à tous les admins connectés
export function broadcast(event, data) {
  const message = JSON.stringify({ event, data });
  for (const client of clients) {
    try {
      client.send(message);
    } catch {
      clients.delete(client);
    }
  }
}

// Emitters — même interface qu'avant
export function emitAuditStarted(audit) {
  broadcast("audit:started", audit);
}

export function emitAuditSubmitted(audit) {
  broadcast("audit:submitted", audit);
}

export function emitCriticalAlert(data) {
  broadcast("alert:critical", data);
}

export function emitSiteUpdated(site) {
  broadcast("site:updated", site);
}

export function emitTechnicianActive(technician) {
  broadcast("technician:active", technician);
}

export function emitNotification(notification) {
  broadcast("notification:new", notification);
}
