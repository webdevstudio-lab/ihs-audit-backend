import { ENV } from "../config/env.js";

export const loggerMiddleware = (app) =>
  app.onRequest(({ request }) => {
    const method = request.method;
    const url = new URL(request.url).pathname;
    const time = new Date().toISOString();

    if (ENV.NODE_ENV !== "production") {
      console.log(`[${time}] ${method} ${url}`);
    }
  });
