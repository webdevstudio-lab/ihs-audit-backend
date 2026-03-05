// Stockage en memoire des requetes par IP
// En production on utiliserait Redis
const requests = new Map();

const WINDOW_MS = 60 * 1000; // fenetre de 1 minute
const MAX_ROUTES = {
  default: 100, // 100 requetes/min par defaut
  auth: 10, // 10 tentatives de connexion/min
  upload: 20, // 20 uploads/min
};

/**
 * Limite le nombre de requetes par IP
 * @param {string} type - 'default' | 'auth' | 'upload'
 */
export const rateLimit =
  (type = "default") =>
  (app) =>
    app.derive(({ request, set }) => {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const key = `${ip}:${type}`;
      const limit = MAX_ROUTES[type] || MAX_ROUTES.default;
      const now = Date.now();

      // Recupere ou initialise le compteur pour cette IP
      const record = requests.get(key) || { count: 0, start: now };

      // Reinitialise si la fenetre est expiree
      if (now - record.start > WINDOW_MS) {
        record.count = 0;
        record.start = now;
      }

      record.count++;
      requests.set(key, record);

      // Ajoute les headers standard de rate limiting
      set.headers["X-RateLimit-Limit"] = String(limit);
      set.headers["X-RateLimit-Remaining"] = String(
        Math.max(0, limit - record.count),
      );

      if (record.count > limit) {
        set.status = 429;
        throw new Error(
          `Trop de requetes — reessayez dans ${Math.ceil((WINDOW_MS - (now - record.start)) / 1000)}s`,
        );
      }

      return {};
    });

// Nettoyage periodique de la Map (evite les fuites memoire)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now - record.start > WINDOW_MS * 2) {
      requests.delete(key);
    }
  }
}, WINDOW_MS);
