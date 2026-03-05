import { createApp } from "./src/config/app.js";
import { connectDB } from "./src/config/database.js";
import { ENV } from "./src/config/env.js";

async function main() {
  await connectDB();

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
  console.error("Erreur demarrage serveur:", err);
  process.exit(1);
});
