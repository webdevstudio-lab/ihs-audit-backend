import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../config/env.js";

// Instance unique du client Anthropic
const anthropic = new Anthropic({
  apiKey: ENV.ANTHROPIC_API_KEY,
});

// Modele utilise
const MODEL = ENV.CLAUDE_MODEL;

/**
 * Envoie un message simple a Claude et retourne la reponse texte
 * @param {string} prompt - Le message a envoyer
 * @param {number} maxTokens - Nombre max de tokens en reponse
 */
export async function askClaude(prompt, maxTokens = 1000) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.content[0].text;
}

/**
 * Envoie une conversation complete (historique) a Claude
 * @param {Array}  messages   - Tableau de messages {role, content}
 * @param {string} systemPrompt - Instructions systeme
 * @param {number} maxTokens
 */
export async function chatClaude(
  messages,
  systemPrompt = "",
  maxTokens = 2000,
) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

/**
 * Analyse un audit complet et retourne un rapport structure
 * @param {Object} auditData - Donnees completes de l'audit
 */
export async function analyzeAudit(auditData) {
  const systemPrompt = `
    Tu es AUDITBOT, un expert en infrastructure telecom et energie pour IPT PowerTech.
    Tu analyses les donnees d'audit de sites telecom en Cote d'Ivoire.
    Tu reponds toujours en francais.
    Tu fournis des analyses precises, des alertes de securite et des recommandations claires.
    Tu es direct et professionnel.
  `;

  const prompt = `
    Analyse les donnees de cet audit de site telecom et fournis :
    1. Un resume de l'etat global du site
    2. La liste des anomalies detectees (par ordre de criticite)
    3. Les recommandations d'intervention (avec urgence : immediate / 30 jours / 90 jours)
    4. Les risques de securite eventuels

    Donnees de l'audit :
    ${JSON.stringify(auditData, null, 2)}

    Reponds en JSON avec cette structure exacte :
    {
      "summary": "resume court en 2-3 phrases",
      "issues": ["anomalie 1", "anomalie 2"],
      "recommendations": ["recommandation 1", "recommandation 2"],
      "securityRisks": ["risque 1"],
      "urgencyLevel": "immediate | 30days | 90days | routine"
    }
  `;

  const raw = await chatClaude(
    [{ role: "user", content: prompt }],
    systemPrompt,
    2000,
  );

  // Nettoyage et parsing JSON
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Si le parsing echoue on retourne le texte brut
    return {
      summary: raw,
      issues: [],
      recommendations: [],
      securityRisks: [],
      urgencyLevel: "routine",
    };
  }
}

/**
 * Genere un rapport complet en markdown
 * @param {Object} auditData
 * @param {Object} analysis - Resultat de analyzeAudit()
 */
export async function generateReport(auditData, analysis) {
  const systemPrompt = `
    Tu es AUDITBOT, expert en infrastructure telecom pour IPT PowerTech.
    Tu rediges des rapports d'audit professionnels en francais.
    Tes rapports sont clairs, structures et directement utilisables par les superviseurs.
  `;

  const prompt = `
    Redige un rapport d'audit complet en Markdown pour le site ${auditData.site?.name || "inconnu"}.

    Donnees de l'audit : ${JSON.stringify(auditData, null, 2)}
    Analyse precedente : ${JSON.stringify(analysis, null, 2)}

    Le rapport doit contenir :
    - En-tete (site, date, technicien, score global)
    - Etat de chaque equipement
    - Anomalies et alertes
    - Recommandations priorisees
    - Conclusion
  `;

  return chatClaude([{ role: "user", content: prompt }], systemPrompt, 4000);
}

export default anthropic;
