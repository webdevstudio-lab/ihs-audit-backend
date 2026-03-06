// scripts/seedAudit.js
// Usage : node scripts/seedAudit.js
// Lance depuis la racine du backend

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

/* ── imports modèles ────────────────────────────────────── */
import { Audit } from "../src/models/Audit.model.js";
import { Site } from "../src/models/Site.model.js";
import { Battery } from "../src/models/Battery.model.js";
import { CompteurCIE } from "../src/models/CompteurCIE.model.js";
import { Rectifier } from "../src/models/Rectifier.model.js";

// IDs réels depuis ta DB
const SITE_ID = "69a988ad6e66035295dc5431";
const TECHNICIAN_ID = "69a9b5bf59f4ed6915d37b2c";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connecté");

  const siteOid = new mongoose.Types.ObjectId(SITE_ID);
  const technicianOid = new mongoose.Types.ObjectId(TECHNICIAN_ID);

  /* ── 0. Vérifie que le site existe ─────────────────────── */
  const site = await Site.findById(siteOid);
  if (!site) throw new Error(`Site ${SITE_ID} introuvable en base`);
  console.log(`✅ Site trouvé : ${site.code} — ${site.name}`);

  /* ── 1. Supprimer les audits existants sur ce site ──────── */
  // (évite le doublon si tu relances le script)
  const deleted = await Audit.deleteMany({ site: siteOid });
  if (deleted.deletedCount > 0)
    console.log(`🗑️  ${deleted.deletedCount} ancien(s) audit(s) supprimé(s)`);

  /* ── 2. Créer l'audit ───────────────────────────────────── */
  const audit = await Audit.create({
    site: siteOid,
    technician: technicianOid,
    status: "submitted",
    visitDate: new Date("2026-03-05T09:00:00.000Z"),
    submittedAt: new Date("2026-03-05T14:30:00.000Z"),
    globalScore: 62,
    criticalityLevel: "elevated",
    isReopened: false,

    comments: {
      general:
        "Site globalement propre. Quelques problèmes d'humidité dans l'armoire principale.",
      generator:
        "Groupe électrogène démarré manuellement — démarrage auto défaillant.",
      rectifier: "Un module HS sur 6. Tension de sortie stable à 48.2V.",
      battery:
        "2 éléments gonflés détectés sur la string 1. Sulfatation légère sur les bornes.",
      solar: "Panneaux poussiéreux, rendement réduit estimé à 70%.",
      earthing: "Prise de terre correcte, résistance mesurée à 4.2 Ohm.",
      fuelTank: "Niveau carburant à 40%. Pas de fuite détectée.",
      access: "Portail sécurisé — clé récupérée chez le gardien Kouassi Jean.",
      urgent:
        "URGENT : Démarrage automatique du groupe en panne — site sans backup si coupure CIE.",
    },

    iaAnalysis: {
      summary:
        "L'audit révèle un site en état modéré avec plusieurs points d'attention critiques. Le système de batteries présente des signes de vieillissement prématuré (éléments gonflés, sulfatation). La défaillance du démarrage automatique du groupe électrogène constitue le risque principal en cas de coupure CIE non anticipée.",
      issues: [
        "Démarrage automatique du générateur défaillant",
        "2 éléments de batterie gonflés sur string 1",
        "1 module rectifier hors service (5/6 fonctionnels)",
        "Panneaux solaires encrassés — rendement -30%",
        "Sulfatation légère sur bornes batteries",
      ],
      recommendations: [
        "Intervention urgente sur le système de démarrage automatique du générateur",
        "Remplacement des 2 éléments de batterie gonflés sous 30 jours",
        "Nettoyage des panneaux solaires lors de la prochaine visite",
        "Vérification et remplacement du module rectifier défaillant",
        "Traitement anti-corrosion sur les bornes batteries",
      ],
    },

    iaReport: `RAPPORT D'AUDIT TECHNIQUE — SITE IHS_LGN_552M (Vridi2)
Date de visite : 05 mars 2026
Technicien : Kone Mamadou (TECH-001)
Score global : 62/100 — Niveau : MODÉRÉ

═══════════════════════════════════════════════
1. ALIMENTATION PRINCIPALE (Réseau CIE)
═══════════════════════════════════════════════
Réseau CIE présent au moment de la visite. Compteur opérationnel,
scellé intact. Index relevé : 15420 kWh. Tension mesurée : 220V.

═══════════════════════════════════════════════
2. GROUPE ÉLECTROGÈNE
═══════════════════════════════════════════════
Groupe présent et démarrable manuellement. Défaillance confirmée
du module de démarrage automatique — ACTION URGENTE REQUISE.
Niveau carburant : 40% (~120L restants).

═══════════════════════════════════════════════
3. RECTIFIER / CHARGEUR
═══════════════════════════════════════════════
Rectifier Huawei ETP48200. 5 modules sur 6 opérationnels.
Tension DC mesurée : 48.2V. Courant de charge : 12A.
Remplacement du module défaillant recommandé sous 60 jours.

═══════════════════════════════════════════════
4. BANC DE BATTERIES
═══════════════════════════════════════════════
Type : Lithium 2V, 200Ah — 2 strings × 24 éléments = 48 éléments.
2 éléments gonflés détectés (string 1, positions 8 et 14).
Sulfatation légère sur 4 bornes. Tension totale : 47.8V.
Remplacement immédiat des éléments défaillants requis.

═══════════════════════════════════════════════
5. PANNEAUX SOLAIRES
═══════════════════════════════════════════════
12 panneaux installés. Encrassement significatif (sable + feuilles).
Rendement estimé à 70% du nominal. Nettoyage recommandé.

═══════════════════════════════════════════════
CONCLUSION
═══════════════════════════════════════════════
Site fonctionnel mais nécessitant des interventions rapides.
Priorité absolue : réparation démarrage auto générateur.
Prochaine visite recommandée sous 30 jours.`,
  });

  console.log(`✅ Audit créé : ${audit._id}`);

  /* ── 3. Battery ─────────────────────────────────────────── */
  // Supprimer les anciennes batteries liées à cet audit
  await Battery.deleteMany({ audit: audit._id });

  const battery = await Battery.create({
    audit: audit._id,
    brand: "Enersys",
    model: "PowerSafe Li",
    type: "lithium",
    nominalVoltage: 2,
    capacityAh: 200,
    numberOfStrings: 2,
    numberOfElementsPerString: 24,
    yearOfInstallation: 2021,
    condition: "fair",
    isSwollen: true,
    swollenCount: 2,
    hasLeak: false,
    hasSulfation: true,
    hasCorrosion: false,
    waterLevel: "not_applicable",
    measuredVoltageTotal: 47.8,
    measuredVoltagePerElement: 1.99,
    notes: "Éléments 8 et 14 de la string 1 présentent un gonflement visible.",
  });
  console.log(`✅ Battery créée : ${battery._id}`);

  /* ── 4. Rectifier ───────────────────────────────────────── */
  await Rectifier.deleteMany({ audit: audit._id });

  const rectifier = await Rectifier.create({
    audit: audit._id,
    brand: "Huawei",
    model: "ETP48200",
    serialNumber: "HW-RTF-2023-0042",
    outputVoltage: 48,
    totalCapacityAmps: 200,
    modulesTotal: 6,
    modulesOk: 5,
    measuredVoltage: 48.2,
    measuredCurrent: 12,
    condition: "good",
    isOperational: true,
    hasAlarmActive: true,
    hasDisplayFault: false,
    notes: "Module 3 HS. Alarme active pour module défaillant.",
  });
  console.log(`✅ Rectifier créé : ${rectifier._id}`);

  /* ── 5. CompteurCIE ─────────────────────────────────────── */
  await CompteurCIE.deleteMany({ audit: audit._id });

  const compteur = await CompteurCIE.create({
    audit: audit._id,
    brand: "Landis+Gyr",
    serialNumber: "LG-2019-CIE-7731",
    phaseType: "monophase",
    amperage: "30A",
    indexValue: 15420,
    measuredVoltage: 220,
    measuredCurrent: 18.5,
    condition: "good",
    isOperational: true,
    isSealIntact: true,
    hasAnomaly: false,
    notes: "Compteur en bon état. Scellé CIE intact.",
  });
  console.log(`✅ CompteurCIE créé : ${compteur._id}`);

  /* ── 6. Rattacher les équipements à l'audit ─────────────── */
  await Audit.findByIdAndUpdate(audit._id, {
    battery: battery._id,
    rectifier: rectifier._id,
    compteurCIE: compteur._id,
  });
  console.log(`✅ Équipements rattachés à l'audit`);

  /* ── 7. Mettre à jour le statut du site ─────────────────── */
  // Status "submitted" = audit soumis → site considéré "completed"
  // (cohérent avec submitAudit dans audit.service.js)
  await Site.findByIdAndUpdate(siteOid, {
    status: "completed",
    lastAuditScore: 62,
    lastAuditDate: new Date("2026-03-05T14:30:00.000Z"),
    auditCount: (site.auditCount || 0) + 1,
  });
  console.log(`✅ Site mis à jour → status: completed, score: 62`);

  /* ── Résumé ─────────────────────────────────────────────── */
  console.log("\n═══════════════════════════════════════");
  console.log("🎉 Seed terminé avec succès !");
  console.log("═══════════════════════════════════════");
  console.log(`Site     : ${site.code} — ${site.name}`);
  console.log(`Audit ID : ${audit._id}`);
  console.log(`Status   : submitted (prêt à valider)`);
  console.log(`Score    : 62/100 — Modéré`);
  console.log(`\n→ Frontend : /audits/${audit._id}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erreur :", err.message);
  console.error(err.stack);
  mongoose.disconnect();
  process.exit(1);
});
