import { Elysia } from "elysia";
import { getSocket } from "../lib/socket.js";

// Plugin qui injecte l'instance socket.io dans le contexte Elysia
// Permet aux controllers d'emettre des evenements via ctx.io
export const websocketPlugin = new Elysia({ name: "websocket" }).decorate(
  "io",
  () => getSocket(),
);
