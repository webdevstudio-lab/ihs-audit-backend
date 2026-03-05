import { Audit } from "../models/Audit.model.js";
import { analyzeAudit, generateReport, chatGemini } from "../lib/gemini.js";
import { computeAuditScore } from "./audit.service.js";
import { AUDIT_STATUS } from "../config/constants.js";

/**
 * Lance l'analyse IA complete d'un audit
 */
export async function runAuditAnalysis(auditId) {
  const audit = await Audit.findById(auditId)
    .populate("site", "name code city zone clients")
    .populate("technician", "name techCode")
    .populate("generator")
    .populate("rectifier")
    .populate("battery")
    .populate("solar")
    .populate("earthing")
    .populate("fuelTank")
    .populate("clientLoads");

  if (!audit) throw new Error("Audit introuvable");

  // 1. Calcule le score
  const { score, level, label } = await computeAuditScore(auditId);

  // 2. Prepare les donnees pour Gemini
  const auditData = {
    site: {
      name: audit.site?.name,
      code: audit.site?.code,
      city: audit.site?.city,
      zone: audit.site?.zone,
      clients: audit.site?.clients,
    },
    technician: {
      name: audit.technician?.name,
      techCode: audit.technician?.techCode,
    },
    visitDate: audit.visitDate,
    score,
    level,
    label,
    comments: audit.comments,
    generator: audit.generator ? sanitizeEquipment(audit.generator) : null,
    rectifier: audit.rectifier ? sanitizeEquipment(audit.rectifier) : null,
    battery: audit.battery ? sanitizeEquipment(audit.battery) : null,
    solar: audit.solar ? sanitizeEquipment(audit.solar) : null,
    earthing: audit.earthing ? sanitizeEquipment(audit.earthing) : null,
    fuelTank: audit.fuelTank ? sanitizeEquipment(audit.fuelTank) : null,
    clientLoads: audit.clientLoads?.map(sanitizeEquipment) || [],
  };

  // 3. Analyse Gemini
  const analysis = await analyzeAudit(auditData);

  // 4. Sauvegarde
  await Audit.findByIdAndUpdate(auditId, {
    $set: {
      iaAnalysis: {
        issues: analysis.issues || [],
        recommendations: analysis.recommendations || [],
        summary: analysis.summary || "",
      },
    },
  });

  return { score, level, label, analysis };
}

/**
 * Genere le rapport complet en Markdown
 */
export async function generateAuditReport(auditId) {
  const audit = await Audit.findById(auditId)
    .populate("site", "name code city zone")
    .populate("technician", "name techCode")
    .populate("generator")
    .populate("rectifier")
    .populate("battery")
    .populate("solar")
    .populate("earthing")
    .populate("fuelTank");

  if (!audit) throw new Error("Audit introuvable");

  if (!audit.iaAnalysis?.summary) {
    throw new Error("Lancez d'abord l'analyse IA avant de generer le rapport");
  }

  const report = await generateReport(audit, audit.iaAnalysis);

  await Audit.findByIdAndUpdate(auditId, {
    $set: { iaReport: report },
  });

  return report;
}

/**
 * Chat IA contextuel sur un audit
 */
export async function chatWithAudit(auditId, messages, userRole) {
  const audit = await Audit.findById(auditId)
    .populate("site", "name code city")
    .populate("generator")
    .populate("rectifier")
    .populate("battery")
    .populate("earthing")
    .populate("fuelTank");

  if (!audit) throw new Error("Audit introuvable");

  const systemPrompt = `
    Tu es AUDITBOT, expert telecom et energie pour IPT PowerTech en Cote d'Ivoire.
    Tu reponds en francais, de facon claire et professionnelle.
    Tu analyses uniquement les donnees de cet audit specifique.

    Contexte :
    - Site      : ${audit.site?.name} (${audit.site?.code})
    - Ville     : ${audit.site?.city}
    - Date      : ${audit.visitDate?.toLocaleDateString("fr-FR")}
    - Score     : ${audit.globalScore ?? "Non calcule"} / 100
    - Criticite : ${audit.criticalityLevel ?? "Non evaluee"}

    Tu peux aider avec :
    - L'interpretation des mesures
    - Les normes telecom (resistance de terre < 5 Ohms, tension 48V...)
    - Les recommandations de maintenance
    - La priorite des interventions
  `;

  return chatGemini(messages, systemPrompt, 1500);
}

/**
 * Supprime les champs inutiles avant envoi a Gemini
 */
function sanitizeEquipment(equipment) {
  if (!equipment) return null;
  const obj = equipment.toObject ? equipment.toObject() : { ...equipment };
  delete obj._id;
  delete obj.__v;
  delete obj.audit;
  delete obj.photos;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
}
