const CHAT_MODE = Object.freeze({
  GENERAL_CHAT: "general_chat",
  SMSI_EXPLANATION: "smsi_explanation",
  APP_DATA_ANALYSIS: "app_data_analysis",
  DOCUMENT_CHAT: "document_chat",
  AGENT_ACTION: "agent_action",
});

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const DOCUMENT_PATTERN = /\b(pdf|document|fichier|piece jointe|annexe|rapport|resume ce)\b/i;
const ACTION_PATTERN = /\b(cree|creer|ajoute|ajouter|supprime|supprimer|met a jour|modifier|planifie|planifier|notifie|notifier|envoie|envoyer|lance|executer)\b/i;
const DIRECT_ACTION_PATTERN = /^(?:stp|svp|veuillez|merci de)?\s*(cree|creer|ajoute|ajouter|supprime|supprimer|met|mettre|modifier|planifie|planifier|notifie|notifier|envoie|envoyer|lance|executer)\b/i;
const APP_ENTITY_PATTERN = /\b(audit|audits|non conformite|non conformites|controle|controles|incident|incidents|actif|actifs|dashboard|tableau de bord|kpi|formation|formations|documentation|pdca|risque|risques)\b/i;
const APP_CONTEXT_PATTERN = /\b(mon|ma|mes|notre|nos|dans l'application|dans lapp|appli|application|chez nous)\b/i;
const ANALYSIS_PATTERN = /\b(analyse|analyser|etat|statut|synthese|bilan|montre|quels sont|combien|liste)\b/i;
const SMSI_KNOWLEDGE_PATTERN = /\b(iso ?27001|smsi|annexe a|ebios|pdca|clauses?|controle(s)? annexe a|etude de risque|analyse de risque)\b/i;
const EBIOS_PATTERN = /\bebios\b/i;
const HOW_TO_PATTERN = /\b(comment|comment faire|exemple|guide|methode|demarche|etapes?)\b/i;
const FOLLOW_UP_CONTINUE_PATTERN = /^(?:ok\s+)?(?:continue|continuer|poursuis|poursuivre|suite)(?:\s+(?:stp|svp))?\s*[.!?]*$/i;
const FOLLOW_UP_DETAIL_PATTERN = /^(?:ok\s+)?(?:explique plus|plus de detail|plus de details|detaille|detaillee|donne moi le detail|donne moi les details)(?:\s+(?:stp|svp))?\s*[.!?]*$/i;

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeHistoryMessage(row) {
  if (!row || typeof row !== "object") return null;
  const role = String(row.role || "").trim().toLowerCase();
  const content = String(row.content || "").trim();
  if (!content || (role !== "user" && role !== "assistant")) return null;
  return { role, content };
}

export function detectFollowUpRequest(message) {
  const text = normalizeText(message);
  if (!text) return { isFollowUp: false, type: "none" };

  if (FOLLOW_UP_CONTINUE_PATTERN.test(text)) {
    return { isFollowUp: true, type: "continue" };
  }

  if (FOLLOW_UP_DETAIL_PATTERN.test(text)) {
    return { isFollowUp: true, type: "detail" };
  }

  return { isFollowUp: false, type: "none" };
}

function findLastAnchorUserMessage(history) {
  const rows = toArray(history)
    .map(normalizeHistoryMessage)
    .filter(Boolean);

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.role !== "user") continue;
    const followUp = detectFollowUpRequest(row.content);
    if (!followUp.isFollowUp) return row.content;
  }

  return "";
}

export function getIntentExecutionProfile(mode) {
  if (mode === CHAT_MODE.APP_DATA_ANALYSIS) {
    return {
      appDataUsed: true,
      documentUsed: false,
      ragUsed: false,
      llmCalled: true,
      structuredAnalysis: true,
    };
  }

  if (mode === CHAT_MODE.DOCUMENT_CHAT) {
    return {
      appDataUsed: false,
      documentUsed: true,
      ragUsed: true,
      llmCalled: true,
      structuredAnalysis: false,
    };
  }

  if (mode === CHAT_MODE.AGENT_ACTION) {
    return {
      appDataUsed: false,
      documentUsed: false,
      ragUsed: false,
      llmCalled: true,
      structuredAnalysis: false,
    };
  }

  if (mode === CHAT_MODE.SMSI_EXPLANATION) {
    return {
      appDataUsed: false,
      documentUsed: false,
      ragUsed: false,
      llmCalled: true,
      structuredAnalysis: false,
    };
  }

  return {
    appDataUsed: false,
    documentUsed: false,
    ragUsed: false,
    llmCalled: true,
    structuredAnalysis: false,
  };
}

export function routeIntent(message, history = []) {
  const followUp = detectFollowUpRequest(message);
  if (followUp.isFollowUp) {
    const anchorMessage = findLastAnchorUserMessage(history);
    if (anchorMessage) {
      const anchorIntent = routeIntent(anchorMessage, []);
      return {
        mode: anchorIntent.mode,
        reason: `follow_up_${followUp.type}_from_${anchorIntent.mode}`,
        followUp: true,
        followUpType: followUp.type,
        anchorMessage,
      };
    }

    return {
      mode: CHAT_MODE.GENERAL_CHAT,
      reason: "follow_up_without_anchor",
      followUp: true,
      followUpType: followUp.type,
      anchorMessage: "",
    };
  }

  const text = normalizeText(message);
  const isQuestion = text.includes("?");
  const hasDocumentSignal = DOCUMENT_PATTERN.test(text);
  const hasActionSignal = ACTION_PATTERN.test(text);
  const hasDirectActionSignal = DIRECT_ACTION_PATTERN.test(text);
  const hasAppEntity = APP_ENTITY_PATTERN.test(text);
  const hasAppContext = APP_CONTEXT_PATTERN.test(text);
  const hasAnalysisSignal = ANALYSIS_PATTERN.test(text);
  const hasSmsiKnowledgeSignal = SMSI_KNOWLEDGE_PATTERN.test(text);
  const hasEbiosSignal = EBIOS_PATTERN.test(text);
  const hasHowToSignal = HOW_TO_PATTERN.test(text);

  if (hasDocumentSignal) {
    return {
      mode: CHAT_MODE.DOCUMENT_CHAT,
      reason: "document_signal_detected",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  if (hasHowToSignal && (hasSmsiKnowledgeSignal || hasActionSignal) && isQuestion) {
    return {
      mode: CHAT_MODE.SMSI_EXPLANATION,
      reason: "how_to_smsi_explanation",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  if (hasEbiosSignal && (isQuestion || hasHowToSignal)) {
    return {
      mode: CHAT_MODE.SMSI_EXPLANATION,
      reason: "ebios_question_signal_detected",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  if (hasDirectActionSignal && hasAppEntity && (hasAppContext || !isQuestion)) {
    return {
      mode: CHAT_MODE.AGENT_ACTION,
      reason: "action_signal_detected",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  if (hasAppEntity && (hasAppContext || hasAnalysisSignal)) {
    return {
      mode: CHAT_MODE.APP_DATA_ANALYSIS,
      reason: "app_analysis_signal_detected",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  if (hasSmsiKnowledgeSignal) {
    return {
      mode: CHAT_MODE.SMSI_EXPLANATION,
      reason: "smsi_knowledge_signal_detected",
      followUp: false,
      followUpType: "none",
      anchorMessage: "",
    };
  }

  return {
    mode: CHAT_MODE.GENERAL_CHAT,
    reason: "default_general_chat",
    followUp: false,
    followUpType: "none",
    anchorMessage: "",
  };
}

export { CHAT_MODE };
