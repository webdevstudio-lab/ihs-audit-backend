import cors from "@elysiajs/cors";
import { ENV } from "../config/env.js";

export const corsPlugin = cors({
  origin: ENV.CORS_ORIGIN.split(","),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
