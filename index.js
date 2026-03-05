import { createApp } from "./src/config/app.js";
import { connectDB } from "./src/config/database.js";
import { ENV } from "./src/config/env.js";
import { initSocket } from "./src/lib/socket.js";
import { createServer } from "http";

async function main() {
  // 1. Connexion MongoDB
  await connectDB();

  // 2. Creation de l'app Elysia
  const app = createApp();

  // 3. Demarrage du serveur
  app.listen(ENV.PORT, () => {
    console.log("");
    console.log("========================================");
    console.log(` ${ENV.APP_NAME}`);
    console.log(` http://localhost:${ENV.PORT}`);
    console.log(` Docs : http://localhost:${ENV.PORT}/docs`);
    console.log(` Env  : ${ENV.NODE_ENV}`);
    console.log("========================================");
    console.log("");
  });
}

main().catch((err) => {
  console.error("Erreur demarrage serveur:", err);
  process.exit(1);
});
