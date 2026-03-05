/**
 * Calcule le score de criticite d'un audit (0 = parfait, 100 = critique)
 * Chaque equipement contribue un poids au score final
 */

import { CONDITION } from "../config/constants.js";

// Poids de chaque equipement dans le score global
const WEIGHTS = {
  generator: 25, // Groupe electrogene      — critique
  rectifier: 20, // Rectifier 48V           — critique
  battery: 20, // Batteries               — critique
  earthing: 15, // Prise de terre          — securite
  fuelTank: 10, // Tank carburant          — operationnel
  solar: 5, // Panneaux solaires       — bonus
  clientLoad: 5, // Charges clients         — informatif
};

// Score par etat de condition (plus c'est eleve, plus c'est critique)
const CONDITION_SCORE = {
  [CONDITION.EXCELLENT]: 0,
  [CONDITION.GOOD]: 15,
  [CONDITION.FAIR]: 40,
  [CONDITION.POOR]: 70,
  [CONDITION.CRITICAL]: 100,
  [CONDITION.UNKNOWN]: 50,
};

/**
 * Calcule le score d'un equipement individuel
 * @param {string} condition - etat de l'equipement
 * @param {Array}  issues    - liste de problemes detectes (optionnel)
 */
export function getEquipmentScore(condition, issues = []) {
  const base = CONDITION_SCORE[condition] ?? 50;
  const bonus = issues.length * 5; // +5 points par anomalie detectee
  return Math.min(100, base + bonus);
}

/**
 * Calcule le score global de criticite d'un audit complet
 * @param {Object} audit - objet audit avec les sections equipements
 * @returns {number} score entre 0 et 100
 */
export function calculateAuditScore(audit) {
  let totalWeight = 0;
  let weightedScore = 0;

  // Generateur
  if (audit.generator?.condition) {
    const score = getEquipmentScore(audit.generator.condition);
    weightedScore += score * WEIGHTS.generator;
    totalWeight += WEIGHTS.generator;
  }

  // Rectifier
  if (audit.rectifier?.condition) {
    let issues = [];
    if (audit.rectifier.modulesTotal && audit.rectifier.modulesOk) {
      const failed = audit.rectifier.modulesTotal - audit.rectifier.modulesOk;
      if (failed > 0) issues.push(`${failed} modules en panne`);
    }
    const score = getEquipmentScore(audit.rectifier.condition, issues);
    weightedScore += score * WEIGHTS.rectifier;
    totalWeight += WEIGHTS.rectifier;
  }

  // Batteries
  if (audit.battery?.condition) {
    let issues = [];
    if (audit.battery.isSwollen) issues.push("batterie gonflee");
    if (audit.battery.hasLeak) issues.push("fuite detectee");
    const score = getEquipmentScore(audit.battery.condition, issues);
    weightedScore += score * WEIGHTS.battery;
    totalWeight += WEIGHTS.battery;
  }

  // Prise de terre
  if (audit.earthing?.resistance !== undefined) {
    const resistance = audit.earthing.resistance;
    let condition;
    if (resistance <= 1) condition = CONDITION.EXCELLENT;
    else if (resistance <= 3) condition = CONDITION.GOOD;
    else if (resistance <= 5) condition = CONDITION.FAIR;
    else if (resistance <= 10) condition = CONDITION.POOR;
    else condition = CONDITION.CRITICAL;

    const score = getEquipmentScore(condition);
    weightedScore += score * WEIGHTS.earthing;
    totalWeight += WEIGHTS.earthing;
  }

  // Tank carburant
  if (audit.fuelTank?.fuelLevel !== undefined) {
    const level = audit.fuelTank.fuelLevel; // pourcentage 0-100
    let condition;
    if (level >= 75) condition = CONDITION.EXCELLENT;
    else if (level >= 50) condition = CONDITION.GOOD;
    else if (level >= 25) condition = CONDITION.FAIR;
    else if (level >= 10) condition = CONDITION.POOR;
    else condition = CONDITION.CRITICAL;

    let issues = [];
    if (audit.fuelTank.hasLeak) issues.push("fuite carburant");
    const score = getEquipmentScore(condition, issues);
    weightedScore += score * WEIGHTS.fuelTank;
    totalWeight += WEIGHTS.fuelTank;
  }

  // Solaire
  if (audit.solar?.condition) {
    const score = getEquipmentScore(audit.solar.condition);
    weightedScore += score * WEIGHTS.solar;
    totalWeight += WEIGHTS.solar;
  }

  // Si aucun equipement renseigne
  if (totalWeight === 0) return null;

  const finalScore = Math.round(weightedScore / totalWeight);
  return finalScore;
}

/**
 * Retourne le niveau de criticite en fonction du score
 * @param {number} score
 */
export function getCriticalityLevel(score) {
  if (score === null || score === undefined) return "unknown";
  if (score <= 20) return "excellent";
  if (score <= 40) return "normal";
  if (score <= 65) return "elevated";
  if (score <= 85) return "high";
  return "critical";
}

/**
 * Retourne un objet complet avec score + niveau + label
 */
export function getScoreSummary(audit) {
  const score = calculateAuditScore(audit);
  const level = getCriticalityLevel(score);

  const labels = {
    excellent: "Excellent",
    normal: "Normal",
    elevated: "Eleve",
    high: "Critique",
    critical: "Critique majeur",
    unknown: "Non evalue",
  };

  return {
    score,
    level,
    label: labels[level],
  };
}
