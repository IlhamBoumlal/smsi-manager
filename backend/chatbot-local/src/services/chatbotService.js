import {
  CHATBOT_CONTEXT_CHAR_LIMIT,
  MAX_CONTEXT_ITEMS,
  MAX_HISTORY_MESSAGES,
  OLLAMA_BASE_URL,
  OLLAMA_FOLLOW_UP_NUM_PREDICT,
  OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
  OLLAMA_MODEL,
  OLLAMA_NUM_PREDICT,
  REQUEST_TIMEOUT_MS,
  SMSI_API_BASE_URL,
} from "../config.js";
import { CHAT_MODE, getIntentExecutionProfile, routeIntent } from "./intentRouterService.js";

const SMSI_SYSTEM_PROMPT = `Tu es un assistant expert SMSI, ISO 27001:2022, Annexe A, EBIOS RM, audit, gestion des actifs, incidents, documentation et amelioration continue.`;

const SOURCES = [
  { key: "clausesDashboard", path: "/api/clauses/dashboard", module: "clauses" },
  { key: "clausesStats", path: "/api/clauses/stats", module: "clauses" },
  { key: "controles", path: "/api/controles", module: "controles" },
  { key: "risques", path: "/api/risques/studies", module: "risques" },
  { key: "actifs", path: "/api/actifs", module: "actifs" },
  { key: "audits", path: "/api/audits", module: "audit", optional: true },
  { key: "auditsNc", path: "/api/audits/ncs", module: "audit", optional: true },
  { key: "formations", path: "/api/sensibilisation", module: "sensibilisation", optional: true },
  {
    key: "formationsDashboard",
    path: "/api/sensibilisation/dashboard",
    module: "sensibilisation",
    optional: true,
  },
  { key: "pdcaCycles", path: "/api/pdca/cycles", module: "pdca" },
  { key: "documentation", path: "/api/documentation", module: "documentation" },
  { key: "incidents", path: "/api/incidents", module: "incidents" },
  { key: "dashboard", path: "/api/dashboard/global", module: "dashboard" },
];

export class ChatbotServiceError extends Error {
  constructor(message, status = 500, code = "CHATBOT_SERVICE_ERROR", details = undefined) {
    super(message);
    this.name = "ChatbotServiceError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function readValue(objectValue, ...keys) {
  if (!objectValue || typeof objectValue !== "object") return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(objectValue, key)) {
      return objectValue[key];
    }
  }
  return undefined;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeToken(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function canonicalModuleCode(value) {
  const token = normalizeToken(value);
  if (token === "audits") return "audit";
  if (token === "tableaudebord" || token === "tableaubord") return "dashboard";
  return token;
}

function canReadSmsiModule(permissionScope, moduleCode) {
  if (!permissionScope || typeof permissionScope !== "object") return false;
  const canonicalModule = canonicalModuleCode(moduleCode);
  if (!canonicalModule) return false;

  const byMethod = permissionScope.can;
  if (typeof byMethod === "function") {
    return Boolean(byMethod(canonicalModule, "read"));
  }

  const rawModules = permissionScope.modules;
  if (!(rawModules instanceof Map)) return false;
  const actions = rawModules.get(canonicalModule);
  if (!(actions instanceof Set)) return false;
  return actions.has("read") || actions.has("administer");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasIso27001Signal(message) {
  const normalized = normalizeSearchText(message);
  return normalized.includes("iso 27001") || normalized.includes("iso27001");
}

function hasClauseSignal(message) {
  const normalized = normalizeSearchText(message);
  return normalized.includes("clause") || normalized.includes("clauses");
}

function hasAnnexASignal(message) {
  const normalized = normalizeSearchText(message);
  return normalized.includes("annexe a") || normalized.includes("annex a");
}

function hasEbiosSignal(message) {
  const normalized = normalizeSearchText(message);
  return normalized.includes("ebios") || normalized.includes("risk manager");
}

const CONVERSATION_METHOD = Object.freeze({
  EBIOS_RM: "EBIOS_RM",
});

export function normalizeConversationMethod(value) {
  const token = normalizeToken(value);
  if (token === "ebiosrm" || token === "ebios") return CONVERSATION_METHOD.EBIOS_RM;
  return null;
}

export function detectConversationMethodFromMessage(message) {
  if (hasEbiosSignal(message)) return CONVERSATION_METHOD.EBIOS_RM;
  return null;
}

function hasRiskStudySignal(message) {
  const normalized = normalizeSearchText(message);
  const hasStudyWord = normalized.includes("etude");
  const hasRiskWord = normalized.includes("risque") || normalized.includes("risk");
  return (
    normalized.includes("etude de risque") ||
    normalized.includes("analyse de risque") ||
    normalized.includes("risk study") ||
    normalized.includes("risk analysis") ||
    (hasStudyWord && hasRiskWord)
  );
}

function shouldEnrichEbiosStudyProposal(message) {
  const normalized = normalizeSearchText(message);
  return (
    normalized.includes("proposer une etude") ||
    normalized.includes("propose une etude") ||
    (normalized.includes("proposer") && normalized.includes("etude"))
  );
}

function resolveConversationMethod(lastMethod, message, followUpContext) {
  const explicitFromMessage =
    detectConversationMethodFromMessage(message) ||
    detectConversationMethodFromMessage(followUpContext?.anchorUserMessage || "");
  return explicitFromMessage || normalizeConversationMethod(lastMethod);
}

function buildMethodContext(lastMethod, message, followUpContext) {
  const activeMethod = resolveConversationMethod(lastMethod, message, followUpContext);
  const ebiosForced = activeMethod === CONVERSATION_METHOD.EBIOS_RM;
  const riskStudyRequested = hasRiskStudySignal(message) || hasRiskStudySignal(followUpContext?.anchorUserMessage || "");
  const enrichStudyProposal = Boolean(
    followUpContext?.isFollowUp &&
      ebiosForced &&
      shouldEnrichEbiosStudyProposal(message)
  );
  return {
    activeMethod,
    ebiosForced,
    riskStudyRequested,
    enrichStudyProposal,
    methodUsedInResponse: ebiosForced ? CONVERSATION_METHOD.EBIOS_RM : "GENERIC",
  };
}

export function buildSmsiReferenceNotes(message, options = {}) {
  const notes = [];
  const forceEbios = Boolean(options?.forceEbios);
  const isoSignal = hasIso27001Signal(message);
  const clauseSignal = hasClauseSignal(message);
  const annexSignal = hasAnnexASignal(message);
  const ebiosSignal = hasEbiosSignal(message) || forceEbios;

  if (clauseSignal && (isoSignal || !annexSignal)) {
    notes.push(
      "Rappel fiable ISO/IEC 27001:2022: les exigences auditables du SMSI sont dans les clauses 4 a 10."
    );
    notes.push(
      "Les clauses obligatoires sont: 4 Contexte, 5 Leadership, 6 Planification, 7 Support, 8 Fonctionnement, 9 Evaluation des performances, 10 Amelioration."
    );
    notes.push(
      "Ne pas confondre: l'Annexe A n'est pas la liste des clauses; c'est un catalogue de mesures de securite."
    );
  }

  if (annexSignal) {
    notes.push(
      "Annexe A (edition 2022): 93 mesures de securite regroupees en A.5 organisationnel, A.6 humain, A.7 physique, A.8 technologique."
    );
  }

  if (ebiosSignal) {
    notes.push(
      "EBIOS RM est la methode de reference de l'ANSSI pour l'appreciation et le traitement des risques numeriques."
    );
    notes.push(
      "EBIOS RM se deroule en 5 ateliers: 1 Cadrage et socle de securite, 2 Sources de risque, 3 Scenarios strategiques, 4 Scenarios operationnels, 5 Traitement du risque."
    );
    notes.push(
      "Repondre avec une demarche pratique EBIOS RM et ne pas inventer un decoupage par clauses ISO pour decrire la methode."
    );
    notes.push(
      "Pour EBIOS RM, interdire le plan generique actif/menace/vulnerabilite: structurer explicitement la reponse par ateliers 1 a 5."
    );
  }

  return notes;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDate(...values) {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function parseJson(value, fallback = {}) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isOverdue(deadline) {
  if (!deadline) return false;
  const date = parseDate(deadline);
  if (!date) return false;
  return date.getTime() < Date.now();
}

function limitItems(items, limit = MAX_CONTEXT_ITEMS) {
  return toArray(items).slice(0, Math.max(1, limit));
}

function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function isConnectionError(error) {
  const msg = normalizeText(error?.message);
  return (
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("networkerror") ||
    msg.includes("socket") ||
    msg.includes("connect")
  );
}

function isClientAbortReason(reason) {
  const normalized = normalizeToken(reason);
  return normalized === "clientconnectionclosed" || normalized === "clientabort";
}

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

function extractDocumentTargetId(message) {
  const match = String(message || "").match(UUID_PATTERN);
  return match ? String(match[0]) : "";
}

function pickDocumentCandidates(message, documents) {
  const items = toArray(documents);
  if (items.length === 0) return [];

  const targetId = extractDocumentTargetId(message);
  if (targetId) {
    const exact = items.filter((doc) => String(readValue(doc, "id", "Id") || "") === targetId);
    if (exact.length > 0) return exact.slice(0, MAX_CONTEXT_ITEMS);
  }

  const normalizedMessage = normalizeText(message);
  const messageTokens = normalizedMessage.split(/\s+/).filter((token) => token.length >= 4);
  if (messageTokens.length > 0) {
    const scored = items.map((doc) => {
      const name = normalizeText(readValue(doc, "name", "Name"));
      const score = messageTokens.reduce((acc, token) => acc + (name.includes(token) ? 1 : 0), 0);
      return { score, doc };
    });

    const ranked = scored
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.doc);

    if (ranked.length > 0) return ranked.slice(0, MAX_CONTEXT_ITEMS);
  }

  return items
    .slice()
    .sort((a, b) => {
      const aDate = parseDate(readValue(a, "updatedAt", "UpdatedAt"), readValue(a, "createdAt", "CreatedAt"))?.getTime() || 0;
      const bDate = parseDate(readValue(b, "updatedAt", "UpdatedAt"), readValue(b, "createdAt", "CreatedAt"))?.getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, MAX_CONTEXT_ITEMS);
}

async function loadDocumentContext(token, message, permissionScope) {
  if (!canReadSmsiModule(permissionScope, "documentation")) {
    return {
      available: false,
      blockedByPermission: true,
      documents: [],
      error: "Acces refuse au module Documentation.",
    };
  }

  try {
    const raw = await fetchSmsiSource("/api/documentation", token);
    const documents = pickDocumentCandidates(message, raw);
    return {
      available: true,
      blockedByPermission: false,
      documents: documents.map((doc) => ({
        id: readValue(doc, "id", "Id"),
        nom: readValue(doc, "name", "Name"),
        statut: readValue(doc, "status", "Status") || null,
        version: readValue(doc, "version", "Version") || null,
        dateMaj: readValue(doc, "updatedAt", "UpdatedAt") || null,
      })),
    };
  } catch (error) {
    return {
      available: false,
      blockedByPermission: false,
      documents: [],
      error: String(error?.message || "Contexte documentaire indisponible"),
    };
  }
}

function logChatTrace(payload) {
  try {
    console.info(`[chatbot][trace] ${JSON.stringify(payload)}`);
  } catch {
    console.info("[chatbot][trace] unable_to_serialize_payload");
  }
}

async function fetchSmsiSource(path, token) {
  const response = await fetchWithTimeout(`${SMSI_API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    throw new ChatbotServiceError(
      "Le token utilisateur ne permet pas de lire les donnees SMSI.",
      401,
      "CHATBOT_SMSI_AUTH_ERROR",
      { path, status: response.status }
    );
  }

  if (response.status === 403) {
    throw new ChatbotServiceError(
      "Acces refuse a une source SMSI pour ce profil utilisateur.",
      403,
      "CHATBOT_SMSI_SOURCE_FORBIDDEN",
      { path, status: response.status }
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Source ${path} indisponible (${response.status}) ${text}`.trim());
  }

  return response.json();
}

async function loadSources(token, permissionScope) {
  const allowedSources = SOURCES.filter((source) =>
    canReadSmsiModule(permissionScope, source.module)
  );

  if (allowedSources.length === 0) {
    throw new ChatbotServiceError(
      "Aucune source SMSI autorisee pour ce profil. Verifiez les permissions module/action.",
      403,
      "CHATBOT_RBAC_NO_SOURCE_ACCESS"
    );
  }

  const settled = await Promise.allSettled(
    allowedSources.map((source) => fetchSmsiSource(source.path, token))
  );

  const data = {};
  const sourceStatus = [];
  const blockedSources = SOURCES.filter((source) => !allowedSources.includes(source)).map(
    (source) => source.key
  );

  settled.forEach((result, index) => {
    const source = allowedSources[index];
    if (result.status === "fulfilled") {
      data[source.key] = result.value;
      sourceStatus.push({
        source: source.key,
        module: source.module,
        ok: true,
        optional: Boolean(source.optional),
      });
      return;
    }

    const reason = result.reason;
    if (reason instanceof ChatbotServiceError) {
      if (reason.code === "CHATBOT_SMSI_AUTH_ERROR") {
        throw reason;
      }

      sourceStatus.push({
        source: source.key,
        module: source.module,
        ok: false,
        optional: Boolean(source.optional),
        forbidden: reason.code === "CHATBOT_SMSI_SOURCE_FORBIDDEN",
        status: Number(reason.status || 0) || null,
        error: String(reason.message || "Source indisponible"),
      });
      return;
    }

    sourceStatus.push({
      source: source.key,
      module: source.module,
      ok: false,
      optional: Boolean(source.optional),
      error: String(reason?.message || "Source indisponible"),
    });
  });

  const cycles = toArray(data.pdcaCycles);
  if (cycles.length > 0) {
    const preferredCycle =
      cycles.find((cycle) => readValue(cycle, "isActive", "IsActive") === true) || cycles[0];
    const cycleId = String(readValue(preferredCycle, "id", "Id") || "").trim();

    if (cycleId) {
      try {
        data.pdcaCycleDetail = await fetchSmsiSource(`/api/pdca/cycles/${cycleId}`, token);
        sourceStatus.push({ source: "pdcaCycleDetail", module: "pdca", ok: true });
      } catch (error) {
        if (error instanceof ChatbotServiceError && error.code === "CHATBOT_SMSI_AUTH_ERROR") {
          throw error;
        }

        sourceStatus.push({
          source: "pdcaCycleDetail",
          module: "pdca",
          ok: false,
          forbidden:
            error instanceof ChatbotServiceError &&
            error.code === "CHATBOT_SMSI_SOURCE_FORBIDDEN",
          status:
            error instanceof ChatbotServiceError
              ? Number(error.status || 0) || null
              : null,
          error: String(error?.message || "Detail PDCA indisponible"),
        });
      }
    }
  }

  const availableSourceCount = sourceStatus.filter((status) => status.ok).length;
  if (availableSourceCount === 0) {
    const hasForbiddenSource = sourceStatus.some(
      (status) => status.forbidden === true || Number(status.status) === 403
    );

    if (hasForbiddenSource) {
      throw new ChatbotServiceError(
        "Aucune source SMSI accessible pour ce profil utilisateur. Verifiez ses permissions.",
        403,
        "CHATBOT_SMSI_NO_SOURCE_ACCESS",
        sourceStatus
      );
    }

    throw new ChatbotServiceError(
      "Impossible de recuperer les donnees SMSI. Verifiez que l'API principale est demarree.",
      502,
      "CHATBOT_SMSI_CONTEXT_UNAVAILABLE",
      sourceStatus
    );
  }

  return { data, sourceStatus, blockedSources };
}

function normalizeControlStatus(raw) {
  const token = normalizeToken(raw);
  if (!token) return "non_evalue";
  if (token === "1" || (token.includes("conforme") && !token.includes("nonconforme"))) return "conforme";
  if (token === "4" || token.includes("majeure")) return "nc_majeure";
  if (token === "3" || token.includes("mineure")) return "nc_mineure";
  if (token === "2" || token.includes("remarque")) return "remarque";
  if (token.includes("nonevalue") || token.includes("nonvalue")) return "non_evalue";
  return token.includes("nonconforme") ? "non_conforme" : "non_evalue";
}

function normalizePlanStatus(raw) {
  const token = normalizeToken(raw);
  if (!token) return "unknown";
  if (token === "2" || token.includes("termine") || token.includes("done") || token.includes("complete")) return "done";
  if (token === "1" || token.includes("encours") || token.includes("inprogress") || token.includes("progress")) {
    return "in_progress";
  }
  if (token === "0" || token.includes("nondemarre") || token.includes("todo") || token.includes("pending")) {
    return "todo";
  }
  return "unknown";
}

function normalizeAuditStatus(raw) {
  const token = normalizeToken(raw);
  if (token.includes("completed") || token.includes("termine")) return "completed";
  if (token.includes("progress") || token.includes("encours")) return "in_progress";
  return "planned";
}

function normalizeIncidentStatus(raw) {
  const token = normalizeToken(raw);
  if (token === "1" || token.includes("resolu") || token.includes("resolved") || token.includes("closed")) {
    return "resolved";
  }
  return "open";
}

function normalizeTrainingStatus(raw) {
  const token = normalizeToken(raw);
  if (token.includes("termine") || token.includes("completed")) return "completed";
  if (token.includes("encours") || token.includes("progress")) return "in_progress";
  return "planned";
}

function normalizeCorrectiveActionStatus(raw) {
  const token = normalizeToken(raw);
  if (token.includes("termine") || token.includes("completed") || token.includes("resolved")) return "done";
  if (token.includes("encours") || token.includes("inprogress") || token.includes("progress")) return "in_progress";
  return "todo";
}

function classifyPdcaItemStatus(raw) {
  const token = normalizeToken(raw);
  if (token === "done" || token === "completed" || token === "termine" || token === "complete") return "done";
  if (token.includes("inprogress") || token.includes("encours") || token.includes("progress")) return "in_progress";
  return "todo";
}

function summarizeClauses(clausesStats, clausesDashboard) {
  const stats = clausesStats && typeof clausesStats === "object" ? clausesStats : {};
  const dashboardRows = toArray(clausesDashboard);

  const nonConformes = dashboardRows
    .map((row) => {
      const clause = readValue(row, "clause", "Clause") || {};
      const number = readValue(clause, "number", "Number");
      const title = readValue(clause, "title", "Title");
      const computedScore = toNumber(readValue(row, "computedScore", "ComputedScore"));
      const fullyCompliant = Boolean(readValue(row, "isFullyCompliant", "IsFullyCompliant"));
      const actionCount = toNumber(readValue(row, "actionCount", "ActionCount"));
      return { number, title, computedScore, fullyCompliant, actionCount };
    })
    .filter((row) => !row.fullyCompliant || row.computedScore < 100)
    .sort((a, b) => a.computedScore - b.computedScore);

  return {
    totalClauses: toNumber(readValue(stats, "totalClauses", "TotalClauses")),
    averageConformity: Math.round(toNumber(readValue(stats, "averageConformity", "AverageConformity"))),
    clausesConformes: toNumber(readValue(stats, "conformeClauses", "ConformeClauses")),
    clausesPartielles: toNumber(readValue(stats, "partialClauses", "PartialClauses")),
    clausesNonConformes: toNumber(readValue(stats, "nonConformeClauses", "NonConformeClauses")),
    actionsTotales: toNumber(readValue(stats, "totalActions", "TotalActions")),
    actionsEnRetard: toNumber(readValue(stats, "delayedActions", "DelayedActions")),
    topClausesNonConformes: limitItems(nonConformes),
  };
}

function summarizeControles(controles) {
  const items = toArray(controles);

  const overview = {
    total: items.length,
    applicables: 0,
    nonApplicables: 0,
    conformes: 0,
    nonConformes: 0,
    ncMineures: 0,
    ncMajeures: 0,
    remarques: 0,
    nonEvalues: 0,
  };

  const nonMisEnOeuvre = [];
  const soaNonApplicables = [];
  const actionsEnRetard = [];

  for (const control of items) {
    const status = normalizeControlStatus(readValue(control, "statut", "Statut"));
    const applicable = Boolean(readValue(control, "applicable", "Applicable"));
    const code = readValue(control, "code", "Code");
    const titre = readValue(control, "titre", "Titre");
    const priorite = readValue(control, "priorite", "Priorite");
    const responsable = readValue(control, "responsablePlan", "ResponsablePlan");
    const dueDate = readValue(control, "dateEcheance", "DateEcheance");
    const planStatus = normalizePlanStatus(readValue(control, "statutPlan", "StatutPlan"));

    if (applicable) overview.applicables += 1;
    else overview.nonApplicables += 1;

    if (status === "conforme") overview.conformes += 1;
    else if (status === "nc_mineure") {
      overview.ncMineures += 1;
      overview.nonConformes += 1;
    } else if (status === "nc_majeure") {
      overview.ncMajeures += 1;
      overview.nonConformes += 1;
    } else if (status === "remarque") {
      overview.remarques += 1;
      overview.nonConformes += 1;
    } else {
      overview.nonEvalues += 1;
    }

    if (applicable && status !== "conforme") {
      nonMisEnOeuvre.push({
        code,
        titre,
        statut: status,
        priorite: priorite || null,
      });
    }

    if (!applicable) {
      const raisons = toArray(readValue(control, "raisonsApplicabilite", "RaisonsApplicabilite"));
      soaNonApplicables.push({
        code,
        titre,
        raisonExclusion: readValue(control, "raisonExclusion", "RaisonExclusion") || null,
        raisonsApplicabilite: raisons,
      });
    }

    if (dueDate && planStatus !== "done" && isOverdue(dueDate)) {
      actionsEnRetard.push({
        source: "controle",
        code,
        titre,
        responsable: responsable || null,
        echeance: dueDate,
        statutPlan: planStatus,
      });
    }
  }

  return {
    ...overview,
    nonMisEnOeuvre: limitItems(nonMisEnOeuvre),
    actionsEnRetard: limitItems(actionsEnRetard),
    soa: {
      controlesApplicables: overview.applicables,
      controlesNonApplicables: overview.nonApplicables,
      topControlesNonApplicables: limitItems(soaNonApplicables),
    },
  };
}

function summarizeRisques(studies) {
  const list = toArray(studies);
  const allRiskEntries = [];

  for (const study of list) {
    const payload = parseJson(readValue(study, "payloadJson", "PayloadJson"), {});
    const workshop5 = readValue(payload, "workshop5") || {};
    const workshop4 = readValue(payload, "workshop4") || {};

    const candidates = [
      ...toArray(readValue(workshop5, "riskEntries")),
      ...toArray(readValue(workshop5, "residualRiskEntries")),
      ...toArray(readValue(workshop4, "operationalScenarios")),
    ];

    for (const entry of candidates) {
      const gravity = toNumber(readValue(entry, "gravity", "gravite"), 0);
      const likelihood = toNumber(readValue(entry, "likelihood", "vraisemblance"), 0);
      const score = gravity * likelihood;
      allRiskEntries.push({
        study: readValue(study, "name", "Name") || "Etude",
        label:
          readValue(entry, "name", "title", "description", "scenario", "riskName", "libelle") ||
          "Risque",
        gravity,
        likelihood,
        score,
        treatment: readValue(entry, "treatment", "decision", "strategy") || null,
      });
    }
  }

  const critical = allRiskEntries
    .filter((risk) => risk.score >= 10 || risk.gravity >= 4 || risk.likelihood >= 4)
    .sort((a, b) => b.score - a.score);

  return {
    totalEtudes: list.length,
    totalEntreesRisque: allRiskEntries.length,
    totalRisquesCritiques: critical.length,
    topRisquesCritiques: limitItems(critical),
  };
}

function summarizeActifs(actifs) {
  const items = toArray(actifs);
  const sensibles = [];
  let secret = 0;
  let topSecret = 0;

  for (const actif of items) {
    const classificationRaw = readValue(actif, "classification", "Classification");
    const token = normalizeToken(classificationRaw);
    const nominal = readValue(actif, "nom", "Nom") || "Actif";

    const isTopSecret = token === "3" || token.includes("topsecret");
    const isSecret = token === "2" || token.includes("secret") || token.includes("confidentiel");

    if (isTopSecret) {
      topSecret += 1;
      sensibles.push({ nom: nominal, classification: classificationRaw || "TopSecret" });
    } else if (isSecret) {
      secret += 1;
      sensibles.push({ nom: nominal, classification: classificationRaw || "Secret" });
    }
  }

  return {
    total: items.length,
    secret,
    topSecret,
    actifsSensibles: limitItems(sensibles),
  };
}

function summarizeIncidents(incidents) {
  const items = toArray(incidents);
  const ouverts = [];
  let openCount = 0;
  let resolvedCount = 0;

  for (const incident of items) {
    const status = normalizeIncidentStatus(readValue(incident, "statut", "Statut"));
    if (status === "resolved") resolvedCount += 1;
    else {
      openCount += 1;
      ouverts.push({
        id: readValue(incident, "id", "Id"),
        titre: readValue(incident, "titre", "Titre"),
        priorite: readValue(incident, "priorite", "Priorite") || null,
        date: readValue(incident, "date", "Date") || null,
      });
    }
  }

  return {
    total: items.length,
    ouverts: openCount,
    resolus: resolvedCount,
    incidentsOuverts: limitItems(
      ouverts.sort((a, b) => {
        const aDate = parseDate(a.date)?.getTime() || 0;
        const bDate = parseDate(b.date)?.getTime() || 0;
        return bDate - aDate;
      })
    ),
  };
}

function summarizeDocumentation(documents) {
  const items = toArray(documents);
  let approuves = 0;
  let validation = 0;
  let revoir = 0;
  let brouillon = 0;
  const needsReview = [];

  for (const doc of items) {
    const statusRaw = readValue(doc, "status", "Status");
    const status = normalizeToken(statusRaw);
    const row = {
      id: readValue(doc, "id", "Id"),
      nom: readValue(doc, "name", "Name"),
      statut: statusRaw || null,
      version: readValue(doc, "version", "Version") || null,
      dateMaj: readValue(doc, "updatedAt", "UpdatedAt") || null,
    };

    if (status.includes("approuve") || status.includes("approved")) approuves += 1;
    else if (status.includes("validation")) {
      validation += 1;
      needsReview.push(row);
    } else if (status.includes("revoir") || status.includes("review")) {
      revoir += 1;
      needsReview.push(row);
    } else if (status.includes("brouillon") || status.includes("draft")) {
      brouillon += 1;
      needsReview.push(row);
    }
  }

  return {
    total: items.length,
    approuves,
    enValidation: validation,
    aRevoir: revoir,
    brouillons: brouillon,
    documentsARevoir: limitItems(needsReview),
  };
}

function summarizeFormations(formations, formationsDashboard) {
  const items = toArray(formations);
  const dashboard = formationsDashboard && typeof formationsDashboard === "object" ? formationsDashboard : {};
  const overdue = [];
  let completed = 0;
  let inProgress = 0;
  let planned = 0;

  for (const formation of items) {
    const statusRaw = readValue(formation, "status", "Status");
    const status = normalizeTrainingStatus(statusRaw);
    const dateRaw = readValue(formation, "date", "Date");
    const date = parseDate(dateRaw);

    if (status === "completed") completed += 1;
    else if (status === "in_progress") inProgress += 1;
    else planned += 1;

    if (date && date.getTime() < Date.now() && status !== "completed") {
      overdue.push({
        id: readValue(formation, "id", "Id"),
        titre: readValue(formation, "title", "Title"),
        status: statusRaw || null,
        date: dateRaw || null,
      });
    }
  }

  return {
    total: toNumber(readValue(dashboard, "total", "Total"), items.length),
    planifiees: toNumber(readValue(dashboard, "planifiees", "Planifiees"), planned),
    enCours: toNumber(readValue(dashboard, "enCours", "EnCours"), inProgress),
    terminees: toNumber(readValue(dashboard, "terminees", "Terminees"), completed),
    tauxParticipationMoyen: Math.round(toNumber(readValue(dashboard, "tauxMoyen", "TauxMoyen"))),
    formationsEnRetard: limitItems(overdue),
  };
}

function summarizeAudits(audits, auditsNc, controlsActionsLate) {
  const auditItems = toArray(audits);
  const ncItems = toArray(auditsNc);

  let planned = 0;
  let inProgress = 0;
  let completed = 0;
  let ncOpen = 0;
  const correctiveLate = [...toArray(controlsActionsLate)];

  for (const audit of auditItems) {
    const status = normalizeAuditStatus(readValue(audit, "status", "Status"));
    if (status === "completed") completed += 1;
    else if (status === "in_progress") inProgress += 1;
    else planned += 1;
  }

  for (const nc of ncItems) {
    const ncStatus = normalizeToken(readValue(nc, "status", "Status"));
    const isOpen =
      ncStatus.includes("open") || ncStatus.includes("ouvert") || ncStatus.includes("encours");

    if (isOpen) ncOpen += 1;

    const actions = toArray(readValue(nc, "correctiveActions", "CorrectiveActions"));
    for (const action of actions) {
      const status = normalizeCorrectiveActionStatus(readValue(action, "status", "Status"));
      const deadline = readValue(action, "deadline", "Deadline");
      if (status !== "done" && isOverdue(deadline)) {
        correctiveLate.push({
          source: "audit",
          ncId: readValue(nc, "id", "Id"),
          ncTitre: readValue(nc, "title", "Title"),
          description: readValue(action, "description", "Description"),
          responsible: readValue(action, "responsible", "Responsible") || null,
          echeance: deadline || null,
          statut: readValue(action, "status", "Status") || null,
        });
      }
    }
  }

  return {
    totalAudits: auditItems.length,
    auditsPlanifies: planned,
    auditsEnCours: inProgress,
    auditsTermines: completed,
    nonConformitesOuvertes: ncOpen,
    actionsCorrectivesEnRetard: correctiveLate.length,
    topActionsCorrectivesEnRetard: limitItems(correctiveLate),
  };
}

function summarizePdca(pdcaCycleDetail, pdcaCycles) {
  const cycle = pdcaCycleDetail && typeof pdcaCycleDetail === "object" ? pdcaCycleDetail : null;
  const cycles = toArray(pdcaCycles);
  const phases = toArray(readValue(cycle, "phases", "Phases"));

  let done = 0;
  let inProgress = 0;
  let todo = 0;
  let total = 0;

  const perPhase = [];

  for (const phase of phases) {
    const phaseItems = toArray(readValue(phase, "sections", "Sections")).flatMap((section) =>
      toArray(readValue(section, "items", "Items"))
    );

    let phaseDone = 0;
    let phaseInProgress = 0;
    let phaseTodo = 0;

    for (const item of phaseItems) {
      const status = classifyPdcaItemStatus(readValue(item, "status", "Status"));
      total += 1;
      if (status === "done") {
        done += 1;
        phaseDone += 1;
      } else if (status === "in_progress") {
        inProgress += 1;
        phaseInProgress += 1;
      } else {
        todo += 1;
        phaseTodo += 1;
      }
    }

    perPhase.push({
      phase: readValue(phase, "label", "Label") || readValue(phase, "key", "Key") || "PDCA",
      termines: phaseDone,
      enCours: phaseInProgress,
      aFaire: phaseTodo,
      progression: phaseItems.length ? Math.round((phaseDone / phaseItems.length) * 100) : 0,
    });
  }

  const progressionGlobale = total ? Math.round((done / total) * 100) : 0;

  return {
    totalCycles: cycles.length,
    cycleActif: cycle
      ? {
          id: readValue(cycle, "id", "Id"),
          name: readValue(cycle, "name", "Name"),
        }
      : null,
    progressionGlobale,
    items: { total, termines: done, enCours: inProgress, aFaire: todo },
    progressionParPhase: perPhase,
  };
}

function summarizeDashboard(dashboard) {
  if (!dashboard || typeof dashboard !== "object") {
    return {
      tauxGlobalConformite: 0,
      totalActifs: 0,
      totalControles: 0,
    };
  }

  return {
    tauxGlobalConformite: toNumber(readValue(dashboard, "tauxGlobalConformite", "TauxGlobalConformite")),
    totalActifs: toNumber(readValue(dashboard, "totalActifs", "TotalActifs")),
    totalControles: toNumber(readValue(dashboard, "totalControles", "TotalControles")),
    controlesParStatut: limitItems(readValue(dashboard, "controlesParStatut", "ControlesParStatut")),
    controlesParDomaine: limitItems(readValue(dashboard, "controlesParDomaine", "ControlesParDomaine")),
  };
}

function summarizeContext(sourceData, sourceStatus, blockedSources = []) {
  const clauses = summarizeClauses(sourceData.clausesStats, sourceData.clausesDashboard);
  const controls = summarizeControles(sourceData.controles);
  const risks = summarizeRisques(sourceData.risques);
  const assets = summarizeActifs(sourceData.actifs);
  const incidents = summarizeIncidents(sourceData.incidents);
  const documentation = summarizeDocumentation(sourceData.documentation);
  const trainings = summarizeFormations(sourceData.formations, sourceData.formationsDashboard);
  const pdca = summarizePdca(sourceData.pdcaCycleDetail, sourceData.pdcaCycles);
  const audits = summarizeAudits(sourceData.audits, sourceData.auditsNc, controls.actionsEnRetard);
  const dashboard = summarizeDashboard(sourceData.dashboard);

  const dataPresenceCount = [
    clauses.totalClauses,
    controls.total,
    risks.totalEtudes,
    assets.total,
    incidents.total,
    documentation.total,
    trainings.total,
    audits.totalAudits,
    pdca.items.total,
  ].reduce((acc, value) => acc + (value > 0 ? 1 : 0), 0);

  const hasData = dataPresenceCount > 0;
  const missingSources = sourceStatus
    .filter((source) => !source.ok && !source.optional)
    .map((source) => source.source);

  const missingOptionalSources = sourceStatus
    .filter((source) => !source.ok && source.optional)
    .map((source) => source.source);

  return {
    mode: hasData ? "analyse_smsi" : "guide_smsi",
    hasData,
    missingSources,
    missingOptionalSources,
    permissionFilteredSources: blockedSources,
    summary: {
      meta: {
        generatedAt: new Date().toISOString(),
        apiBaseUrl: SMSI_API_BASE_URL,
        sourceHealth: sourceStatus,
        blockedSources,
      },
      dashboardKpi: dashboard,
      clauses,
      controles: controls,
      soa: controls.soa,
      risques: risks,
      actifs: assets,
      incidents,
      documentation,
      formations: trainings,
      pdca,
      audits,
      actionsCorrectives: {
        totalRetard: audits.actionsCorrectivesEnRetard,
        topRetard: audits.topActionsCorrectivesEnRetard,
      },
    },
  };
}

function sanitizeHistory(history, limit = MAX_HISTORY_MESSAGES) {
  const rows = toArray(history)
    .filter((message) => message && typeof message === "object")
    .map((message) => ({
      role: String(readValue(message, "role") || "").trim().toLowerCase(),
      content: String(readValue(message, "content") || "").trim(),
    }))
    .filter((message) => (message.role === "user" || message.role === "assistant") && message.content.length > 0)
    .slice(-Math.max(1, limit))
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1200),
    }));

  return rows;
}

function truncateForPrompt(value, maxChars = 1400) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... (suite tronquee pour le prompt)`;
}

function findLastHistoryMessageByRole(history, role) {
  const targetRole = String(role || "").trim().toLowerCase();
  const rows = toArray(history);
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (!row || typeof row !== "object") continue;
    const rowRole = String(readValue(row, "role") || "").trim().toLowerCase();
    const content = String(readValue(row, "content") || "").trim();
    if (rowRole === targetRole && content) return content;
  }
  return "";
}

function buildFollowUpContext(intent, history) {
  if (!intent?.followUp) return null;
  const previousAssistantAnswer = findLastHistoryMessageByRole(history, "assistant");
  const anchorUserMessage = String(intent.anchorMessage || "").trim();
  return {
    isFollowUp: true,
    type: intent.followUpType || "continue",
    anchorUserMessage,
    previousAssistantAnswer: truncateForPrompt(previousAssistantAnswer, 1800),
  };
}

function buildFollowUpUserBlock(message, followUpContext, methodContext) {
  if (!followUpContext?.isFollowUp) return [];

  const isEbiosConversation = methodContext?.activeMethod === CONVERSATION_METHOD.EBIOS_RM;
  const followUpMessage = methodContext?.enrichStudyProposal
    ? `${message}\n(interpretation: proposer une etude EBIOS RM)`
    : message;

  const continuationInstruction =
    followUpContext.type === "detail"
      ? "- Donne plus de details concrets, etapes pratiques, exemples et points de vigilance."
      : "- Continue directement la reponse precedente sans repartir de zero.";

  return [
    "Contexte de suivi (follow-up):",
    `- Type de suivi: ${followUpContext.type}`,
    followUpContext.anchorUserMessage
      ? `- Question initiale de reference: ${followUpContext.anchorUserMessage}`
      : "- Question initiale de reference: non disponible",
    followUpContext.previousAssistantAnswer
      ? "- Derniere reponse assistant a completer ci-dessous."
      : "- Derniere reponse assistant non disponible: proposer une continuation coherente.",
    followUpContext.previousAssistantAnswer || "",
    "",
    "Instruction follow-up:",
    "- Utiliser le contexte precedent et completer la reponse au lieu de repondre depuis le debut.",
    continuationInstruction,
    "- Eviter les repetitions; ajouter uniquement la suite utile ou le niveau de detail demande.",
    ...(isEbiosConversation
      ? [
          "- Methode conversationnelle active: EBIOS RM.",
          "- En follow-up, conserver strictement la demarche EBIOS RM et ses 5 ateliers pour toute etude/analyse de risque.",
          "- Si l'utilisateur demande de proposer une etude, interpreter la demande comme: proposer une etude EBIOS RM.",
        ]
      : []),
    "",
    "Message de suivi utilisateur:",
    followUpMessage,
    "",
  ];
}

function truncateContextForPrompt(summaryObject) {
  const serialized = JSON.stringify(summaryObject, null, 2);
  if (serialized.length <= CHATBOT_CONTEXT_CHAR_LIMIT) return serialized;
  return `${serialized.slice(0, CHATBOT_CONTEXT_CHAR_LIMIT)}\n... (contexte tronque pour reduire la latence)`;
}

function buildSystemPrompt(chatMode, appContext, documentContext, followUpContext, methodContext) {
  const isEbiosConversation = methodContext?.activeMethod === CONVERSATION_METHOD.EBIOS_RM;
  const commonRules = [
    SMSI_SYSTEM_PROMPT,
    "Regles de securite:",
    "- Reponds uniquement en francais.",
    "- N'utilise pas de markdown (pas de **, pas de listes markdown).",
    "- N'invente jamais de donnees.",
    "- Le chatbot est strictement en lecture seule: aucune action d'ecriture n'est executee dans l'application.",
    "- Interdiction de creer, modifier, supprimer, importer, exporter ou approuver des donnees via le chatbot.",
    ...(isEbiosConversation
      ? [
          "Contexte methodologique conversationnel: EBIOS_RM.",
          "- Maintenir la coherence methodologique EBIOS RM sur toute la conversation.",
          "- Pour toute etude/analyse/proposition de risque: appliquer obligatoirement la structure EBIOS RM en 5 ateliers (Atelier 1 a Atelier 5).",
          "- Interdire le schema generique actif/menace/vulnerabilite en remplacement de la structure EBIOS RM.",
        ]
      : []),
  ];
  const followUpRules = followUpContext?.isFollowUp
    ? [
        "Mode FOLLOW_UP: il s'agit d'une relance utilisateur sur la reponse precedente.",
        "- Completer la reponse precedente en restant sur le meme sujet et le meme niveau d'expertise.",
        followUpContext.type === "detail"
          ? "- Niveau de detail attendu: eleve (etapes, exemples, points de vigilance)."
          : "- Reprendre la suite utile sans recommencer depuis le debut.",
      ]
    : [];

  if (chatMode === CHAT_MODE.APP_DATA_ANALYSIS) {
    const unavailableSources =
      appContext?.missingSources?.length > 0
        ? `Sources indisponibles actuellement: ${appContext.missingSources.join(", ")}.`
        : "Toutes les sources principales sont disponibles.";

    return [
      ...commonRules,
      ...followUpRules,
      "Mode APP_DATA_ANALYSIS: base ta reponse sur les donnees reelles de l'application.",
      unavailableSources,
      "- Si une information est absente, indique clairement: 'Information indisponible dans les donnees actuelles'.",
      "- Structure la reponse en sections claires: constats, impacts, recommandations.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.DOCUMENT_CHAT) {
    return [
      ...commonRules,
      ...followUpRules,
      "Mode DOCUMENT_CHAT: utilise uniquement le contexte documentaire fourni.",
      "- N'utilise pas les donnees applicatives globales (audits, incidents, dashboard) sauf si elles sont dans le document.",
      documentContext?.available
        ? "- Si le document ne contient pas une information, signale explicitement la limite."
        : "- Aucun document cible exploitable n'est disponible. Demande a l'utilisateur de preciser le document.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.AGENT_ACTION) {
    return [
      ...commonRules,
      ...followUpRules,
      "Mode AGENT_ACTION: propose un plan d'action concret sans execution technique.",
      "- Ne pretends jamais avoir execute une action reelle.",
      "- Toute mise en oeuvre doit passer par un workflow externe explicite hors chatbot.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.SMSI_EXPLANATION) {
    return [
      ...commonRules,
      ...followUpRules,
      "Mode SMSI_EXPLANATION: explique clairement les concepts SMSI/ISO sans analyse applicative.",
      "- N'ajoute pas de constats/impacts sur l'application sauf demande explicite de l'utilisateur.",
      "- Si la question porte sur les clauses ISO 27001, reponds strictement avec les clauses 4 a 10 (pas A.1, A.2, etc.).",
      "- Si tu mentionnes l'Annexe A, precise qu'elle contient des mesures de securite et non les clauses d'exigences du SMSI.",
      "- Pour une demande 'comment faire', donne des etapes actionnables directement (sans demander une confirmation d'execution).",
      "- N'invente pas la definition d'EBIOS RM et n'utilise pas un faux developpement de l'acronyme.",
      "- Si la question mentionne EBIOS RM (ou si le contexte conversationnel actif est EBIOS RM), structure la reponse en 5 ateliers et n'utilise pas le schema generique actifs/menaces/vulnerabilites.",
    ].join("\n");
  }

  return [
    ...commonRules,
    ...followUpRules,
    "Mode GENERAL_CHAT: reponds de maniere directe, simple et pedagogique.",
    "- N'ajoute pas d'analyse applicative (constats, impacts, audits, non-conformites) sauf demande explicite.",
  ].join("\n");
}

function buildUserPrompt(chatMode, message, appContext, documentContext, followUpContext, methodContext) {
  const followUpBlock = buildFollowUpUserBlock(message, followUpContext, methodContext);

  if (chatMode === CHAT_MODE.APP_DATA_ANALYSIS) {
    const contextJson = truncateContextForPrompt(appContext?.summary || {});
    return [
      ...followUpBlock,
      "Contexte SMSI condense (JSON):",
      contextJson,
      "",
      ...(followUpContext?.isFollowUp
        ? []
        : [
            "Question utilisateur:",
            message,
            "",
          ]),
      "Instruction de reponse:",
      "- Reponse factuelle et professionnelle.",
      "- Sections attendues: constats, impacts, recommandations.",
      "- Mentionner clairement les limites de donnees.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.DOCUMENT_CHAT) {
    const docs = toArray(documentContext?.documents);
    const docsJson = truncateContextForPrompt({ documents: docs });
    return [
      ...followUpBlock,
      "Contexte documentaire cible (JSON):",
      docsJson,
      "",
      ...(followUpContext?.isFollowUp
        ? []
        : [
            "Question utilisateur:",
            message,
            "",
          ]),
      "Instruction de reponse:",
      "- Resume et explique uniquement a partir du contexte documentaire ci-dessus.",
      "- Si le document cible est introuvable, demande son identifiant ou son nom exact.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.AGENT_ACTION) {
    return [
      ...followUpBlock,
      ...(followUpContext?.isFollowUp
        ? []
        : [
            "Question utilisateur:",
            message,
            "",
          ]),
      "Instruction de reponse:",
      "- Repondre avec un plan d'action et les preconditions.",
      "- Demander une validation explicite du workflow externe, sans execution dans le chatbot.",
    ].join("\n");
  }

  if (chatMode === CHAT_MODE.SMSI_EXPLANATION) {
    const referenceNotes = buildSmsiReferenceNotes(message, {
      forceEbios: methodContext?.activeMethod === CONVERSATION_METHOD.EBIOS_RM,
    });
    const ebiosRequested = Boolean(
      hasEbiosSignal(message) ||
        hasEbiosSignal(followUpContext?.anchorUserMessage || "") ||
        methodContext?.activeMethod === CONVERSATION_METHOD.EBIOS_RM
    );
    return [
      ...followUpBlock,
      ...(followUpContext?.isFollowUp
        ? []
        : [
            "Question utilisateur:",
            message,
            "",
          ]),
      ...(referenceNotes.length > 0
        ? [
            "Base de connaissances fiable a respecter:",
            ...referenceNotes.map((note) => `- ${note}`),
            "",
          ]
        : []),
      "Instruction de reponse:",
      "- Donner une explication SMSI/ISO claire, concise, pedagogique.",
      "- Ne pas fournir de constats/impacts applicatifs.",
      ...(ebiosRequested
        ? [
            "- Pour EBIOS RM: presenter la reponse explicitement par Atelier 1, Atelier 2, Atelier 3, Atelier 4, Atelier 5.",
            "- Ne pas utiliser une reponse generique de type actifs/menaces/vulnerabilites hors structure des 5 ateliers.",
            "- Ne pas demander de confirmation; repondre directement de maniere naturelle.",
          ]
        : []),
      ...(methodContext?.activeMethod === CONVERSATION_METHOD.EBIOS_RM
        ? [
            "- Contexte conversationnel impose: conserver la methode EBIOS RM meme si le message de suivi ne cite pas explicitement EBIOS.",
            "- Pour 'proposer une etude', formuler une proposition explicite d'etude EBIOS RM.",
          ]
        : []),
      ...(followUpContext?.isFollowUp
        ? [
            followUpContext.type === "detail"
              ? "- Donner une version detaillee, operationnelle et approfondie."
              : "- Continuer la reponse precedente avec des informations supplementaires utiles.",
          ]
        : []),
    ].join("\n");
  }

  return [
    ...followUpBlock,
    ...(followUpContext?.isFollowUp
      ? []
      : [
          "Question utilisateur:",
          message,
          "",
        ]),
    "Instruction de reponse:",
    "- Reponse simple et directe.",
    "- Ne pas fournir d'analyse applicative sauf demande explicite.",
    ...(followUpContext?.isFollowUp
      ? [
          followUpContext.type === "detail"
            ? "- Ajouter des details concrets et actionnables."
            : "- Completer la reponse precedente sans repetition.",
        ]
      : []),
  ].join("\n");
}

function buildOllamaMessages({
  chatMode,
  message,
  history,
  appContext,
  documentContext,
  followUpContext,
  methodContext,
}) {
  return [
    {
      role: "system",
      content: buildSystemPrompt(chatMode, appContext, documentContext, followUpContext, methodContext),
    },
    ...sanitizeHistory(history),
    {
      role: "user",
      content: buildUserPrompt(chatMode, message, appContext, documentContext, followUpContext, methodContext),
    },
  ];
}

async function prepareConversationExecution({ message, history, token, permissionScope, lastMethod }) {
  const intent = routeIntent(message, history);
  const profile = getIntentExecutionProfile(intent.mode);
  const followUpContext = buildFollowUpContext(intent, history);
  const methodContext = buildMethodContext(lastMethod, message, followUpContext);
  const shouldForceDetailedContinuation = Boolean(
    followUpContext?.isFollowUp &&
      (followUpContext.type === "continue" || followUpContext.type === "detail")
  );

  let appContext = null;
  let documentContext = null;

  if (profile.appDataUsed) {
    appContext = await getSmsiContext(token, permissionScope);
  }

  if (profile.documentUsed) {
    const documentQueryMessage =
      followUpContext?.isFollowUp && followUpContext.anchorUserMessage
        ? followUpContext.anchorUserMessage
        : message;
    documentContext = await loadDocumentContext(token, documentQueryMessage, permissionScope);
  }

  const effectiveRagUsed = Boolean(profile.ragUsed && documentContext?.available && toArray(documentContext?.documents).length > 0);
  const messages = buildOllamaMessages({
    chatMode: intent.mode,
    message,
    history,
    appContext,
    documentContext,
    followUpContext,
    methodContext,
  });

  const llmOptions = {
    numPredict: shouldForceDetailedContinuation
      ? Math.max(OLLAMA_NUM_PREDICT, OLLAMA_FOLLOW_UP_NUM_PREDICT)
      : OLLAMA_NUM_PREDICT,
    temperature: 0.2,
    numCtx: 4096,
  };

  const context = {
    mode: appContext?.mode || "guide_smsi",
    hasData: Boolean(appContext?.hasData),
    missingSources: toArray(appContext?.missingSources),
    missingOptionalSources: toArray(appContext?.missingOptionalSources),
    permissionFilteredSources: toArray(appContext?.permissionFilteredSources),
    chatMode: intent.mode,
    appDataUsed: Boolean(profile.appDataUsed),
    documentUsed: Boolean(profile.documentUsed),
    ragUsed: effectiveRagUsed,
    intentReason: intent.reason,
    followUp: Boolean(intent.followUp),
    followUpType: intent.followUpType || "none",
    anchorMessage: String(intent.anchorMessage || ""),
    lastMethod: methodContext.activeMethod,
    methodUsedInResponse: methodContext.methodUsedInResponse,
  };

  return {
    messages,
    context,
    llmOptions,
    trace: {
      message,
      mode: intent.mode,
      appDataUsed: Boolean(profile.appDataUsed),
      documentUsed: Boolean(profile.documentUsed),
      ragUsed: effectiveRagUsed,
      followUp: Boolean(intent.followUp),
      followUpType: intent.followUpType || "none",
      lastMethod: methodContext.activeMethod,
      methodUsedInResponse: methodContext.methodUsedInResponse,
      llmCalled: false,
      finalResponseLength: 0,
      numPredict: llmOptions.numPredict,
    },
  };
}

async function callOllamaStream(messages, options = {}) {
  const onToken = typeof options.onToken === "function" ? options.onToken : null;
  const onFirstToken = typeof options.onFirstToken === "function" ? options.onFirstToken : null;
  const externalSignal = options.signal instanceof AbortSignal ? options.signal : null;
  const firstTokenTimeoutMs = Math.max(1, Number(options.firstTokenTimeoutMs || OLLAMA_FIRST_TOKEN_TIMEOUT_MS));
  const numPredict = Math.max(1, Number(options.numPredict || OLLAMA_NUM_PREDICT));
  const temperature = Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.2;
  const numCtx = Math.max(512, Number(options.numCtx || 4096));

  const startedAt = Date.now();
  let firstTokenAt = null;
  let firstTokenReceived = false;
  let firstTokenTimeoutTriggered = false;

  const controller = new AbortController();
  const abortWithReason = (reason) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };

  const firstTokenTimer = setTimeout(() => {
    if (firstTokenReceived) return;
    firstTokenTimeoutTriggered = true;
    abortWithReason("FIRST_TOKEN_TIMEOUT");
  }, firstTokenTimeoutMs);

  const externalAbortHandler = () => abortWithReason(externalSignal?.reason || "CLIENT_ABORT");
  if (externalSignal) {
    if (externalSignal.aborted) externalAbortHandler();
    else externalSignal.addEventListener("abort", externalAbortHandler, { once: true });
  }

  let response;

  try {
    response = await fetch(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          messages,
          options: {
            temperature,
            num_predict: numPredict,
            num_ctx: numCtx,
          },
        }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (externalSignal) {
      externalSignal.removeEventListener("abort", externalAbortHandler);
    }
    clearTimeout(firstTokenTimer);

    if (firstTokenTimeoutTriggered) {
      throw new ChatbotServiceError(
        "Le modele local Ollama a expire (timeout avant premier token). Essayez avec une question plus courte.",
        504,
        "OLLAMA_TIMEOUT",
        { stage: "first_token", timeoutMs: firstTokenTimeoutMs }
      );
    }

    if (externalSignal?.aborted) {
      const abortReason = String(externalSignal.reason || "ABORTED");
      if (isClientAbortReason(abortReason)) {
        throw new ChatbotServiceError(
          "Requete interrompue par le client.",
          499,
          "CHATBOT_CLIENT_ABORTED"
        );
      }
      throw new ChatbotServiceError(
        "Generation interrompue avant completion.",
        499,
        "CHATBOT_STREAM_ABORTED",
        { reason: abortReason }
      );
    }

    if (isConnectionError(error)) {
      throw new ChatbotServiceError(
        "Ollama n'est pas joignable. Lancez 'ollama serve' puis reessayez.",
        503,
        "OLLAMA_UNAVAILABLE"
      );
    }

    throw new ChatbotServiceError(
      "Impossible de contacter Ollama.",
      503,
      "OLLAMA_REQUEST_FAILED",
      { error: String(error?.message || error) }
    );
  }

  if (externalSignal) {
    externalSignal.removeEventListener("abort", externalAbortHandler);
  }

  if (!response.ok) {
    clearTimeout(firstTokenTimer);
    const details = await response.text().catch(() => "");
    const normalized = normalizeText(details);

    if (response.status === 404 || normalized.includes("model") && normalized.includes("not found")) {
      throw new ChatbotServiceError(
        `Modele Ollama introuvable. Executez: ollama pull ${OLLAMA_MODEL}`,
        503,
        "OLLAMA_MODEL_NOT_FOUND",
        { model: OLLAMA_MODEL, details }
      );
    }

    throw new ChatbotServiceError(
      "Ollama a retourne une erreur.",
      502,
      "OLLAMA_BAD_RESPONSE",
      { status: response.status, details }
    );
  }

  if (!response.body) {
    clearTimeout(firstTokenTimer);
    throw new ChatbotServiceError(
      "Ollama a retourne un flux vide.",
      502,
      "OLLAMA_EMPTY_STREAM"
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let aggregated = "";
  let doneReason = "unknown";
  let evalCount = null;
  let promptEvalCount = null;
  let evalDuration = null;
  let promptEvalDuration = null;
  let totalDuration = null;

  const processLine = (line) => {
    const raw = String(line || "").trim();
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (payload?.done === true) {
      doneReason = String(readValue(payload, "done_reason", "doneReason") || "stop");
      evalCount = toNullableNumber(readValue(payload, "eval_count", "evalCount"));
      promptEvalCount = toNullableNumber(readValue(payload, "prompt_eval_count", "promptEvalCount"));
      evalDuration = toNullableNumber(readValue(payload, "eval_duration", "evalDuration"));
      promptEvalDuration = toNullableNumber(
        readValue(payload, "prompt_eval_duration", "promptEvalDuration"),
      );
      totalDuration = toNullableNumber(readValue(payload, "total_duration", "totalDuration"));
    }

    const chunk = String(readValue(payload, "message")?.content || "");
    if (!chunk) return;

    if (!firstTokenReceived) {
      firstTokenReceived = true;
      firstTokenAt = Date.now();
      clearTimeout(firstTokenTimer);
      onFirstToken?.({
        elapsedMs: firstTokenAt - startedAt,
        timeoutMs: firstTokenTimeoutMs,
      });
    }

    aggregated += chunk;
    onToken?.(chunk);
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lineBreakIndex = buffer.indexOf("\n");
      while (lineBreakIndex >= 0) {
        const line = buffer.slice(0, lineBreakIndex);
        processLine(line);
        buffer = buffer.slice(lineBreakIndex + 1);
        lineBreakIndex = buffer.indexOf("\n");
      }
    }

    const tail = buffer.trim();
    if (tail) processLine(tail);
  } catch (error) {
    if (firstTokenTimeoutTriggered) {
      throw new ChatbotServiceError(
        "Le modele local Ollama a expire (timeout avant premier token). Essayez avec une question plus courte.",
        504,
        "OLLAMA_TIMEOUT",
        { stage: "first_token", timeoutMs: firstTokenTimeoutMs }
      );
    }

    if (externalSignal?.aborted) {
      const abortReason = String(externalSignal.reason || "ABORTED");
      if (isClientAbortReason(abortReason)) {
        throw new ChatbotServiceError(
          "Requete interrompue par le client.",
          499,
          "CHATBOT_CLIENT_ABORTED"
        );
      }
      throw new ChatbotServiceError(
        "Generation interrompue avant completion.",
        499,
        "CHATBOT_STREAM_ABORTED",
        { reason: abortReason }
      );
    }

    throw new ChatbotServiceError(
      "Erreur pendant la lecture du flux Ollama.",
      502,
      "OLLAMA_STREAM_READ_ERROR",
      { error: String(error?.message || error) }
    );
  } finally {
    clearTimeout(firstTokenTimer);
    try {
      reader.releaseLock();
    } catch {
      // noop
    }
  }

  const content = aggregated.trim();
  if (!content) {
    throw new ChatbotServiceError(
      "Ollama a retourne une reponse vide.",
      502,
      "OLLAMA_EMPTY_RESPONSE"
    );
  }

  return {
    content,
    metrics: {
      firstTokenMs: firstTokenAt ? firstTokenAt - startedAt : null,
      totalMs: Date.now() - startedAt,
      firstTokenTimeoutMs,
      numPredict,
      doneReason,
      evalCount,
      promptEvalCount,
      evalDuration,
      promptEvalDuration,
      totalDuration,
    },
  };
}

async function callOllama(messages, options = {}) {
  const streamed = await callOllamaStream(messages, {
    ...options,
    firstTokenTimeoutMs: OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
  });
  return streamed.content;
}

export async function getSmsiContext(token, permissionScope) {
  const { data, sourceStatus, blockedSources } = await loadSources(token, permissionScope);
  return summarizeContext(data, sourceStatus, blockedSources);
}

export async function generateAssistantReply({
  message,
  history,
  token,
  permissionScope = null,
  lastMethod = null,
}) {
  const execution = await prepareConversationExecution({
    message,
    history,
    token,
    permissionScope,
    lastMethod,
  });
  logChatTrace(execution.trace);

  let answer = "";
  try {
    answer = await callOllama(execution.messages, execution.llmOptions);
    execution.trace.llmCalled = true;
    execution.trace.finalResponseLength = String(answer || "").length;
    logChatTrace(execution.trace);
  } catch (error) {
    logChatTrace({
      ...execution.trace,
      error: String(error?.code || error?.message || error),
    });
    throw error;
  }

  return {
    answer,
    context: execution.context,
  };
}

export async function streamAssistantReply({
  message,
  history,
  token,
  permissionScope = null,
  onToken,
  onFirstToken,
  signal,
  lastMethod = null,
}) {
  const execution = await prepareConversationExecution({
    message,
    history,
    token,
    permissionScope,
    lastMethod,
  });
  logChatTrace(execution.trace);

  let streamed = null;
  try {
    streamed = await callOllamaStream(execution.messages, {
      onToken,
      onFirstToken,
      signal,
      firstTokenTimeoutMs: OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
      ...execution.llmOptions,
    });
    execution.trace.llmCalled = true;
    execution.trace.finalResponseLength = String(streamed?.content || "").length;
    logChatTrace(execution.trace);
  } catch (error) {
    logChatTrace({
      ...execution.trace,
      error: String(error?.code || error?.message || error),
    });
    throw error;
  }

  return {
    answer: streamed.content,
    context: execution.context,
    metrics: streamed.metrics,
  };
}

export async function buildChatbotResponse({
  message,
  history,
  token,
  permissionScope = null,
  lastMethod = null,
}) {
  const { answer, context } = await generateAssistantReply({
    message,
    history,
    token,
    permissionScope,
    lastMethod,
  });

  return {
    answer,
    mode: context.mode,
    chatMode: context.chatMode,
    hasData: context.hasData,
    model: OLLAMA_MODEL,
    missingSources: context.missingSources,
    missingOptionalSources: context.missingOptionalSources,
    permissionFilteredSources: context.permissionFilteredSources,
    appDataUsed: context.appDataUsed,
    documentUsed: context.documentUsed,
    ragUsed: context.ragUsed,
    followUp: context.followUp,
    followUpType: context.followUpType,
    lastMethod: context.lastMethod,
    methodUsedInResponse: context.methodUsedInResponse,
    generatedAt: new Date().toISOString(),
  };
}
