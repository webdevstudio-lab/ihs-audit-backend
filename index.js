// index.js
import { createApp } from "./src/config/app.js";
import { connectDB } from "./src/config/database.js";
import { ENV } from "./src/config/env.js";

async function main() {
  let retries = 5;
  while (retries > 0) {
    try {
      await connectDB();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error("❌ Impossible de se connecter à MongoDB");
        process.exit(1);
      }
      console.warn(
        `⚠ Retry dans 3s... (${retries} restant${retries > 1 ? "s" : ""})`,
      );
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const app = createApp();
  app.listen(ENV.PORT, () => {
    console.log("");
    console.log("========================================");
    console.log(` ${ENV.APP_NAME}`);
    console.log(` http://localhost:${ENV.PORT}`);
    console.log(` Docs : http://localhost:${ENV.PORT}/docs`);
    console.log(` WebSocket : ws://localhost:${ENV.PORT}/ws`);
    console.log(` Env  : ${ENV.NODE_ENV}`);
    console.log("========================================");
    console.log("");
  });
}

main().catch((err) => {
  console.error("❌ Erreur démarrage:", err.message);
  process.exit(1);
});
