import { Elysia } from "elysia";
import { addClient, removeClient } from "../lib/socket.js";

export const websocketPlugin = new Elysia({ name: "websocket" }).ws("/ws", {
  open(ws) {
    console.log(`WS connecté : ${ws.id}`);
    addClient(ws);
    ws.send(JSON.stringify({ event: "connected", data: { id: ws.id } }));
  },

  message(ws, message) {
    try {
      const { event, data } = JSON.parse(message);
      if (event === "join:admin") {
        console.log(`Admin rejoint : ${ws.id}`);
      }
    } catch {}
  },

  close(ws) {
    console.log(`WS déconnecté : ${ws.id}`);
    removeClient(ws);
  },
});
