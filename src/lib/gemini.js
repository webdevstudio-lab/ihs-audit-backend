import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../config/env.js";

// Instance unique du client Gemini
const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

// Modele utilise
const MODEL = ENV.GEMINI_MODEL;

/**
 * Envoie un message simple a Gemini et retourne la reponse texte
 * @param {string} prompt    - Le message a envoyer
 * @param {number} maxTokens - Nombre max de tokens en reponse
 */
export async function askGemini(prompt, maxTokens = 1000) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.3, // plus precis pour l'analyse technique
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Envoie une conversation complete a Gemini
 * @param {Array}  messages      - Tableau { role, content }
 * @param {string} systemPrompt  - Instructions systeme
 * @param {number} maxTokens
 */
export async function chatGemini(
  messages,
  systemPrompt = "",
  maxTokens = 2000,
) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.3,
    },
  });

  // Convertit le format { role, content } vers le format Gemini
  // Gemini utilise 'user' et 'model' (pas 'assistant')
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
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
    Tu reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.
  `;

  const prompt = `
    Analyse les donnees de cet audit de site telecom et fournis :
    1. Un resume de l'etat global du site
    2. La liste des anomalies detectees (par ordre de criticite)
    3. Les recommandations d'intervention (avec urgence)
    4. Les risques de securite eventuels

    Donnees de l'audit :
    ${JSON.stringify(auditData, null, 2)}

    Reponds UNIQUEMENT avec ce JSON exact, sans texte avant ou apres :
    {
      "summary": "resume court en 2-3 phrases",
      "issues": ["anomalie 1", "anomalie 2"],
      "recommendations": ["recommandation 1", "recommandation 2"],
      "securityRisks": ["risque 1"],
      "urgencyLevel": "immediate"
    }

    Valeurs possibles pour urgencyLevel : immediate, 30days, 90days, routine
  `;

  const raw = await chatGemini(
    [{ role: "user", content: prompt }],
    systemPrompt,
    2000,
  );

  // Nettoyage et parsing JSON
  try {
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
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
 * Genere un rapport complet en Markdown
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
    # En-tete (site, date, technicien, score global)
    ## Etat de chaque equipement
    ## Anomalies et alertes
    ## Recommandations priorisees
    ## Conclusion
  `;

  return chatGemini([{ role: "user", content: prompt }], systemPrompt, 4000);
}

export default genAI;
