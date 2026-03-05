import { Elysia } from "elysia";

// Taille max des fichiers : 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Types MIME acceptes pour les photos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic", // format iPhone
];

export const storagePlugin = new Elysia({ name: "storage" }).decorate(
  "fileConfig",
  {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_MIME_TYPES,
  },
);
