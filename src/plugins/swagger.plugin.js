import { swagger } from "@elysiajs/swagger";

export const swaggerPlugin = swagger({
  documentation: {
    info: {
      title: "IHS Audit API",
      version: "1.0.0",
      description: "IPT PowerTech — API de gestion des audits telecom CI",
    },
    tags: [
      { name: "Auth", description: "Connexion techniciens et admins" },
      { name: "Sites", description: "Gestion des sites telecom" },
      { name: "Audits", description: "Gestion des audits terrain" },
      { name: "Equipment", description: "Equipements des sites" },
      { name: "Photos", description: "Upload et gestion des photos" },
      { name: "IA", description: "Analyse et rapport IA" },
      { name: "Stats", description: "Statistiques dashboard" },
      { name: "Users", description: "Gestion des utilisateurs" },
    ],
  },
  path: "/docs", // accessible sur http://localhost:3000/docs
});
