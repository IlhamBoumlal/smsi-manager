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

const SOURCE_KEYS = new Set(SOURCES.map((source) => source.key));

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

function includesAny(text, tokens = []) {
  return tokens.some((token) => text.includes(token));
}

function selectPreferredSourceKeys(message, followUpContext = null) {
  const anchor = String(followUpContext?.anchorUserMessage || "");
  const text = normalizeSearchText(`${anchor} ${String(message || "")}`);
  if (!text) return [];

  const selected = new Set();

  if (includesAny(text, ["incident", "incidents"])) {
    selected.add("incidents");
    selected.add("dashboard");
  }

  if (includesAny(text, ["risque", "risques", "risk"])) {
    selected.add("risques");
    selected.add("dashboard");
  }

  if (includesAny(text, ["controle", "controles", "annexe a", "soa", "conforme"])) {
    selected.add("controles");
    selected.add("dashboard");
  }

  if (includesAny(text, ["audit", "audits", "non conformite", "non conformites", "nc"])) {
    selected.add("audits");
    selected.add("auditsNc");
    selected.add("dashboard");
  }

  if (includesAny(text, ["actif", "actifs", "asset"])) {
    selected.add("actifs");
    selected.add("dashboard");
  }

  if (includesAny(text, ["clause", "clauses", "iso 27001", "iso27001"])) {
    selected.add("clausesDashboard");
    selected.add("clausesStats");
    selected.add("dashboard");
  }

  if (includesAny(text, ["pdca", "cycle", "plan do check act"])) {
    selected.add("pdcaCycles");
    selected.add("dashboard");
  }

  if (includesAny(text, ["documentation", "document", "procedure", "politique"])) {
    selected.add("documentation");
  }

  if (includesAny(text, ["sensibilisation", "formation", "awareness"])) {
    selected.add("formations");
    selected.add("formationsDashboard");
    selected.add("dashboard");
  }

  if (includesAny(text, ["dashboard", "tableau de bord", "kpi", "score"])) {
    selected.add("dashboard");
  }

  const keys = Array.from(selected).filter((key) => SOURCE_KEYS.has(key));
  return keys;
}

const CONTROLE_CONFORME_QUESTION_PATTERN = /\b(quel|quels|quelle|quelles|qui|liste|donne|montre|affiche|identifie|citer)\b/;
const INCIDENT_LIST_QUESTION_PATTERN = /\b(quel|quels|quelle|quelles|liste|donne|montre|affiche)\b/;
const APP_LIST_REQUEST_PATTERN = /\b(liste|donne|montre|affiche|quels|quelles|quel|top|details?)\b/;

function isConformeControlsQuestion(message) {
  const raw = String(message ?? "");
  const normalized = normalizeSearchText(raw);
  if (!normalized) return false;

  const hasControlSignal = normalized.includes("controle");
  const hasConformeSignal = normalized.includes("conforme");
  const hasNegativeConformitySignal =
    normalized.includes("non conforme") ||
    normalized.includes("non conformes") ||
    normalized.includes("non mis") ||
    normalized.includes("nonmis");
  if (hasNegativeConformitySignal) return false;
  if (!hasControlSignal || !hasConformeSignal) return false;

  return raw.includes("?") || CONTROLE_CONFORME_QUESTION_PATTERN.test(normalized);
}

function isIncidentListQuestion(message) {
  const raw = String(message ?? "");
  const normalized = normalizeSearchText(raw);
  if (!normalized) return false;

  const hasIncidentSignal =
    normalized.includes("incident") ||
    normalized.includes("incidents") ||
    normalized.includes("ticket") ||
    normalized.includes("tickets");
  if (!hasIncidentSignal) return false;

  return raw.includes("?") || INCIDENT_LIST_QUESTION_PATTERN.test(normalized);
}

function isAppListStyleQuestion(message) {
  const raw = String(message ?? "");
  const normalized = normalizeSearchText(raw);
  if (!normalized) return false;
  return raw.includes("?") || APP_LIST_REQUEST_PATTERN.test(normalized);
}

function isShortModulePrompt(normalizedMessage) {
  const normalized = String(normalizedMessage || "").trim();
  if (!normalized) return false;
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0 || tokens.length > 4) return false;
  return !includesAny(normalized, [
    "pourquoi",
    "comment",
    "analyse",
    "analyser",
    "cause",
    "causes",
    "impact",
    "impacts",
    "recommandation",
    "recommandations",
  ]);
}

function detectRequestedAppListModule(message) {
  const normalized = normalizeSearchText(message);
  if (!normalized) return null;

  const allowDirectModuleList =
    isAppListStyleQuestion(message) || isShortModulePrompt(normalized);
  if (!allowDirectModuleList) return null;

  if (
    normalized.includes("incident") ||
    normalized.includes("incidents") ||
    normalized.includes("ticket") ||
    normalized.includes("tickets")
  ) {
    return "incidents";
  }

  if (
    normalized.includes("action corrective") ||
    normalized.includes("actions correctives") ||
    normalized.includes("non conformite") ||
    normalized.includes("non conformites")
  ) {
    return "audits_actions";
  }

  if (normalized.includes("audit") || normalized.includes("audits")) {
    return "audits";
  }

  if (
    normalized.includes("dashboard") ||
    normalized.includes("tableau de bord") ||
    normalized.includes("kpi") ||
    normalized.includes("score")
  ) {
    return "dashboard";
  }

  if (normalized.includes("risque") || normalized.includes("risques")) {
    return "risques";
  }

  if (normalized.includes("actif") || normalized.includes("actifs")) {
    return "actifs";
  }

  if (
    normalized.includes("document") ||
    normalized.includes("documentation") ||
    normalized.includes("procedure") ||
    normalized.includes("politique")
  ) {
    return "documentation";
  }

  if (normalized.includes("formation") || normalized.includes("sensibilisation")) {
    return "formations";
  }

  if (normalized.includes("clause") || normalized.includes("clauses")) {
    return "clauses";
  }

  if (normalized.includes("controle") || normalized.includes("controles")) {
    return "controles";
  }

  if (normalized.includes("pdca") || normalized.includes("phase")) {
    return "pdca";
  }

  return null;
}

function shouldShowTechnicalIds(message, followUpContext = null) {
  const anchor = String(followUpContext?.anchorUserMessage || "");
  const normalized = normalizeSearchText(`${anchor} ${String(message || "")}`);
  if (!normalized) return false;
  const tokens = normalized.split(" ").filter(Boolean);
  return (
    tokens.includes("id") ||
    tokens.includes("ids") ||
    tokens.includes("uuid") ||
    normalized.includes("identifiant") ||
    normalized.includes("identifiants")
  );
}

function removeTechnicalIds(value) {
  if (Array.isArray(value)) {
    return value.map((item) => removeTechnicalIds(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, entryValue] of Object.entries(value)) {
    const normalizedKey = String(key || "").toLowerCase();
    if (normalizedKey === "id" || normalizedKey.endsWith("id")) {
      continue;
    }
    next[key] = removeTechnicalIds(entryValue);
  }

  return next;
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

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const token = normalizeToken(value);
    if (!token) return fallback;
    if (token === "true" || token === "1" || token === "oui" || token === "yes") return true;
    if (token === "false" || token === "0" || token === "non" || token === "no") return false;
  }
  return fallback;
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

async function loadSources(token, permissionScope, options = {}) {
  const requestedSourceKeys = new Set(
    toArray(options?.sourceKeys)
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  );
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

  let targetSources = allowedSources;
  if (requestedSourceKeys.size > 0) {
    const narrowed = allowedSources.filter((source) => requestedSourceKeys.has(source.key));
    if (narrowed.length > 0) {
      targetSources = narrowed;
    }
  }

  const settled = await Promise.allSettled(
    targetSources.map((source) => fetchSmsiSource(source.path, token))
  );

  const data = {};
  const sourceStatus = [];
  const blockedSources = SOURCES.filter((source) => !allowedSources.includes(source)).map(
    (source) => source.key
  );

  settled.forEach((result, index) => {
    const source = targetSources[index];
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

  const canLoadPdcaDetail = targetSources.some((source) => source.key === "pdcaCycles");
  const cycles = canLoadPdcaDetail ? toArray(data.pdcaCycles) : [];
  if (canLoadPdcaDetail && cycles.length > 0) {
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

  const mappedClauses = dashboardRows.map((row) => {
    const clause = readValue(row, "clause", "Clause") || {};
    const number = readValue(clause, "number", "Number");
    const title = readValue(clause, "title", "Title");
    const computedScore = toNumber(readValue(row, "computedScore", "ComputedScore"));
    const fullyCompliant = Boolean(readValue(row, "isFullyCompliant", "IsFullyCompliant"));
    const actionCount = toNumber(readValue(row, "actionCount", "ActionCount"));
    return {
      id: readValue(clause, "id", "Id") || null,
      number,
      title,
      computedScore,
      fullyCompliant,
      actionCount,
    };
  });

  const clauses = mappedClauses
    .slice()
    .sort((a, b) => {
      const aKey = normalizeSearchText(`${a.number || ""} ${a.title || ""}`);
      const bKey = normalizeSearchText(`${b.number || ""} ${b.title || ""}`);
      return aKey.localeCompare(bKey);
    });

  const nonConformes = mappedClauses
    .slice()
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
    clauses: limitItems(clauses),
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
  const controlesConformes = [];
  const controlesList = [];

  for (const control of items) {
    const status = normalizeControlStatus(readValue(control, "statut", "Statut"));
    const applicable = toBoolean(readValue(control, "applicable", "Applicable"), false);
    const code =
      readValue(control, "code", "Code", "reference", "Reference", "ref", "Ref") || null;
    const titre =
      readValue(control, "titre", "Titre", "title", "Title", "nom", "Nom", "name", "Name") ||
      null;
    const domaine = readValue(control, "domaine", "Domaine") || null;
    const id = readValue(control, "id", "Id") || null;
    const priorite = readValue(control, "priorite", "Priorite");
    const responsable = readValue(control, "responsablePlan", "ResponsablePlan");
    const dueDate = readValue(control, "dateEcheance", "DateEcheance");
    const planStatus = normalizePlanStatus(readValue(control, "statutPlan", "StatutPlan"));
    const statusRaw = readValue(control, "statut", "Statut") || null;

    controlesList.push({
      id,
      code,
      titre,
      domaine,
      applicable,
      statut: status,
      statutBrut: statusRaw,
      priorite: priorite || null,
      responsable: responsable || null,
      echeance: dueDate || null,
      statutPlan: planStatus,
    });

    if (applicable) overview.applicables += 1;
    else overview.nonApplicables += 1;

    if (status === "conforme") {
      overview.conformes += 1;
      controlesConformes.push({
        id,
        code,
        titre,
        domaine,
        applicable,
      });
    }
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

  controlesConformes.sort((a, b) => {
    const aKey = normalizeSearchText(`${a.code || ""} ${a.titre || ""}`);
    const bKey = normalizeSearchText(`${b.code || ""} ${b.titre || ""}`);
    return aKey.localeCompare(bKey);
  });
  const orderedControls = controlesList.sort((a, b) => {
    const aKey = normalizeSearchText(`${a.code || ""} ${a.titre || ""}`);
    const bKey = normalizeSearchText(`${b.code || ""} ${b.titre || ""}`);
    return aKey.localeCompare(bKey);
  });

  return {
    ...overview,
    controles: limitItems(orderedControls),
    topConformes: limitItems(controlesConformes),
    nonMisEnOeuvre: limitItems(nonMisEnOeuvre),
    actionsEnRetard: limitItems(actionsEnRetard),
    soa: {
      controlesApplicables: overview.applicables,
      controlesNonApplicables: overview.nonApplicables,
      topControlesNonApplicables: limitItems(soaNonApplicables),
    },
  };
}

function formatConformeControlLabel(control) {
  const code = String(readValue(control, "code", "Code") || "").trim();
  const titre = String(readValue(control, "titre", "Titre") || "").trim();
  if (code && titre) return `${code} - ${titre}`;
  if (code) return code;
  if (titre) return titre;
  return "Controle conforme";
}

function buildDirectConformeControlsAnswer(message, appSummary) {
  if (!isConformeControlsQuestion(message)) return null;

  const controlsSummary = readValue(appSummary, "controles");
  if (!controlsSummary || typeof controlsSummary !== "object") return null;

  const totalConformes = toNumber(readValue(controlsSummary, "conformes"), 0);
  const topConformes = toArray(readValue(controlsSummary, "topConformes"));

  if (totalConformes <= 0) {
    return "Selon les donnees actuelles, vous n'avez aucun controle conforme.";
  }

  if (topConformes.length === 0) {
    return `Selon les donnees actuelles, vous avez ${totalConformes} controle(s) conforme(s), mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = topConformes.map(
    (control, index) => `${index + 1}. ${formatConformeControlLabel(control)}`
  );
  const totalLine =
    totalConformes > topConformes.length ? `\nTotal controles conformes: ${totalConformes}.` : "";

  return `Voici les controles conformes identifies :\n${lines.join("\n")}${totalLine}`;
}

function toDisplayIncidentStatus(value) {
  const token = normalizeToken(value);
  if (token === "resolved" || token === "resolu" || token === "closed") return "resolu";
  return "ouvert";
}

function toDisplayControlStatus(value) {
  const token = normalizeToken(value);
  if (!token) return "non evalue";
  if (token === "conforme" || token === "1") return "conforme";
  if (token === "ncmineure" || token === "3") return "nc mineure";
  if (token === "ncmajeure" || token === "4") return "nc majeure";
  if (token === "remarque" || token === "2") return "remarque";
  if (token === "nonevalue" || token === "nonvalue") return "non evalue";
  if (token === "nonconforme") return "non conforme";
  return token;
}

function toDisplayPlanStatus(value) {
  const token = normalizeToken(value);
  if (token === "done") return "termine";
  if (token === "inprogress" || token === "in_progress") return "en cours";
  if (token === "todo") return "a faire";
  return token || "unknown";
}

function toDisplayAuditStatus(value) {
  const token = normalizeToken(value);
  if (token.includes("completed") || token.includes("termine")) return "termine";
  if (token.includes("progress") || token.includes("encours")) return "en cours";
  return "planifie";
}

function formatIncidentLabel(incident, index, includeIds = false) {
  const title = String(readValue(incident, "titre", "title", "nom", "name") || "Incident").trim();
  const id = String(readValue(incident, "id") || "").trim();
  const status = toDisplayIncidentStatus(readValue(incident, "statut", "status"));
  const priority = String(readValue(incident, "priorite", "priority") || "").trim();
  const date = String(readValue(incident, "date", "createdAt") || "").trim();

  const parts = [`${index + 1}. ${title}`];
  if (includeIds && id) parts.push(`id=${id}`);
  if (status) parts.push(`statut=${status}`);
  if (priority) parts.push(`priorite=${priority}`);
  if (date) parts.push(`date=${date}`);
  return parts.join(" | ");
}

function buildDirectIncidentListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);

  const incidentsSummary = readValue(appSummary, "incidents");
  if (!incidentsSummary || typeof incidentsSummary !== "object") return null;

  const total = toNumber(readValue(incidentsSummary, "total"), 0);
  const openCount = toNumber(readValue(incidentsSummary, "ouverts"), 0);
  const resolvedCount = toNumber(readValue(incidentsSummary, "resolus"), 0);
  const recent = toArray(readValue(incidentsSummary, "recentIncidents", "incidentsOuverts"));

  if (total <= 0) {
    return "Selon les donnees actuelles, aucun incident n'est enregistre.";
  }

  if (recent.length === 0) {
    return `Incidents detectes: total=${total}, ouverts=${openCount}, resolus=${resolvedCount}. Le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = recent.map((incident, index) => formatIncidentLabel(incident, index, includeIds));
  const footer =
    total > recent.length
      ? `\nAffichage partiel (${recent.length}/${total}).`
      : `\nTotal incidents: ${total} (ouverts=${openCount}, resolus=${resolvedCount}).`;

  return `Voici la liste des incidents disponibles :\n${lines.join("\n")}${footer}`;
}

function toDisplayText(value, fallback = "non renseigne") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildPartialFooter(displayed, total, label) {
  if (total > displayed) {
    return `\nAffichage partiel (${displayed}/${total}).`;
  }
  return `\nTotal ${label}: ${total}.`;
}

function buildDirectRisksListAnswer(appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "risques");
  if (!summary || typeof summary !== "object") return null;

  const totalEtudes = toNumber(readValue(summary, "totalEtudes"), 0);
  const etudes = toArray(readValue(summary, "etudes"));
  const totalCritiques = toNumber(readValue(summary, "totalRisquesCritiques"), 0);
  const items = toArray(readValue(summary, "topRisquesCritiques"));
  const totalEntrees = toNumber(readValue(summary, "totalEntreesRisque"), 0);

  if (totalEtudes <= 0) {
    return "Selon les donnees actuelles, aucune etude de risque n'est enregistree.";
  }

  if (etudes.length === 0 && items.length === 0) {
    return `Etudes de risque detectees: ${totalEtudes}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const studyLines = etudes.map((study, index) => {
    const name = toDisplayText(readValue(study, "name"));
    const organization = String(readValue(study, "organization") || "").trim();
    const author = String(readValue(study, "author") || "").trim();
    const perimeter = String(readValue(study, "perimeter") || "").trim();
    const status = String(readValue(study, "status") || "").trim();
    const updatedAt = String(readValue(study, "updatedAt", "createdAt") || "").trim();
    const id = String(readValue(study, "id") || "").trim();
    const totalStudyRisks = toNumber(readValue(study, "totalRisques"), 0);
    const criticalStudyRisks = toNumber(readValue(study, "risquesCritiques"), 0);

    const parts = [`${index + 1}. ${name}`];
    if (includeIds && id) parts.push(`id=${id}`);
    if (organization) parts.push(`organisation=${organization}`);
    if (author) parts.push(`auteur=${author}`);
    if (perimeter) parts.push(`perimetre=${perimeter}`);
    if (status) parts.push(`statut=${status}`);
    if (updatedAt) parts.push(`maj=${updatedAt}`);
    parts.push(`risques=${totalStudyRisks}`);
    parts.push(`critiques=${criticalStudyRisks}`);
    return parts.join(" | ");
  });

  if (items.length === 0) {
    const totalLine =
      totalEntrees > 0 ? `\nTotal entrees de risque recensees: ${totalEntrees}.` : "";
    return `Voici la liste des etudes de risque disponibles :\n${studyLines.join(
      "\n"
    )}${buildPartialFooter(etudes.length, totalEtudes, "etudes de risque")}${totalLine}`;
  }

  const criticalLines = items.map((risk, index) => {
    const label = toDisplayText(readValue(risk, "label"));
    const study = toDisplayText(readValue(risk, "study"));
    const score = toNumber(readValue(risk, "score"), 0);
    const gravity = toNumber(readValue(risk, "gravity"), 0);
    const likelihood = toNumber(readValue(risk, "likelihood"), 0);
    const treatment = String(readValue(risk, "treatment") || "").trim();
    const parts = [
      `${index + 1}. ${label}`,
      `etude=${study}`,
      `score=${score}`,
      `gravite=${gravity}`,
      `vraisemblance=${likelihood}`,
    ];
    if (treatment) parts.push(`traitement=${treatment}`);
    return parts.join(" | ");
  });

  const studiesSection = studyLines.length
    ? `Voici la liste des etudes de risque disponibles :\n${studyLines.join(
        "\n"
      )}${buildPartialFooter(etudes.length, totalEtudes, "etudes de risque")}\n\n`
    : "";

  return `${studiesSection}Voici la liste des risques critiques disponibles :\n${criticalLines.join(
    "\n"
  )}${buildPartialFooter(items.length, totalCritiques, "risques critiques")}`;
}

function buildDirectAssetsListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "actifs");
  if (!summary || typeof summary !== "object") return null;

  const normalized = normalizeSearchText(message);
  const askSensibles =
    normalized.includes("sensible") ||
    normalized.includes("secret") ||
    normalized.includes("top secret") ||
    normalized.includes("classification");

  const totalAssets = toNumber(readValue(summary, "total"), 0);
  const secretCount = toNumber(readValue(summary, "secret"), 0);
  const topSecretCount = toNumber(readValue(summary, "topSecret"), 0);
  const totalSensibles = secretCount + topSecretCount;
  const allItems = toArray(readValue(summary, "actifs"));
  const sensitiveItems = toArray(readValue(summary, "actifsSensibles"));
  const items = askSensibles ? sensitiveItems : allItems;

  if (totalAssets <= 0) {
    return "Selon les donnees actuelles, aucun actif n'est enregistre.";
  }

  if (items.length === 0) {
    if (askSensibles || totalSensibles <= 0) {
      return `Actifs enregistres: ${totalAssets}. Aucun actif sensible (Secret/TopSecret) n'est signale.`;
    }
    return `Actifs enregistres: ${totalAssets}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((asset, index) => {
    const nom = toDisplayText(readValue(asset, "nom"));
    const classification = toDisplayText(readValue(asset, "classification"));
    const owner = String(readValue(asset, "proprietaire") || "").trim();
    const criticite = String(readValue(asset, "criticite") || "").trim();
    const statut = String(readValue(asset, "statut") || "").trim();
    const id = String(readValue(asset, "id") || "").trim();
    const parts = [`${index + 1}. ${nom}`, `classification=${classification}`];
    if (includeIds && id) parts.push(`id=${id}`);
    if (owner) parts.push(`proprietaire=${owner}`);
    if (criticite) parts.push(`criticite=${criticite}`);
    if (statut) parts.push(`statut=${statut}`);
    return parts.join(" | ");
  });

  const title = askSensibles
    ? "Voici la liste des actifs sensibles disponibles :"
    : "Voici la liste des actifs disponibles :";
  const totalLabel = askSensibles ? "actifs sensibles" : "actifs";
  const totalValue = askSensibles ? totalSensibles : totalAssets;

  return `${title}\n${lines.join("\n")}${buildPartialFooter(items.length, totalValue, totalLabel)}`;
}

function buildDirectDocumentationListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "documentation");
  if (!summary || typeof summary !== "object") return null;
  const normalized = normalizeSearchText(message);
  const askReview =
    normalized.includes("revoir") ||
    normalized.includes("revue") ||
    normalized.includes("validation") ||
    normalized.includes("brouillon") ||
    normalized.includes("retard");

  const totalDocs = toNumber(readValue(summary, "total"), 0);
  const totalARevoir =
    toNumber(readValue(summary, "enValidation"), 0) +
    toNumber(readValue(summary, "aRevoir"), 0) +
    toNumber(readValue(summary, "brouillons"), 0);
  const allDocs = toArray(readValue(summary, "documents"));
  const reviewDocs = toArray(readValue(summary, "documentsARevoir"));
  const items = askReview ? reviewDocs : allDocs;

  if (totalDocs <= 0) {
    return "Selon les donnees actuelles, aucun document n'est enregistre.";
  }

  if (items.length === 0) {
    if (askReview || totalARevoir <= 0) {
      return `Documents enregistres: ${totalDocs}. Aucun document en attente de revue n'est signale.`;
    }
    return `Documents enregistres: ${totalDocs}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((doc, index) => {
    const nom = toDisplayText(readValue(doc, "nom"));
    const statut = toDisplayText(readValue(doc, "statut"));
    const version = String(readValue(doc, "version") || "").trim();
    const dateMaj = String(readValue(doc, "dateMaj") || "").trim();
    const id = String(readValue(doc, "id") || "").trim();
    const parts = [`${index + 1}. ${nom}`, `statut=${statut}`];
    if (includeIds && id) parts.push(`id=${id}`);
    if (version) parts.push(`version=${version}`);
    if (dateMaj) parts.push(`dateMaj=${dateMaj}`);
    return parts.join(" | ");
  });

  const title = askReview
    ? "Voici la liste des documents a revoir :"
    : "Voici la liste des documents disponibles :";
  const totalLabel = askReview ? "documents a revoir" : "documents";
  const totalValue = askReview ? totalARevoir : totalDocs;

  return `${title}\n${lines.join("\n")}${buildPartialFooter(items.length, totalValue, totalLabel)}`;
}

function buildDirectTrainingsListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "formations");
  if (!summary || typeof summary !== "object") return null;
  const normalized = normalizeSearchText(message);
  const askLate =
    normalized.includes("retard") ||
    normalized.includes("echeance") ||
    normalized.includes("en retard");

  const total = toNumber(readValue(summary, "total"), 0);
  const allItems = toArray(readValue(summary, "formations"));
  const lateItems = toArray(readValue(summary, "formationsEnRetard"));
  const items = askLate ? lateItems : allItems;
  const totalRetard = lateItems.length;

  if (total <= 0) {
    return "Selon les donnees actuelles, aucune formation n'est enregistree.";
  }

  if (items.length === 0) {
    if (askLate || totalRetard <= 0) {
      return `Formations enregistrees: ${total}. Aucune formation en retard n'est detectee.`;
    }
    return `Formations enregistrees: ${total}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((formation, index) => {
    const titre = toDisplayText(readValue(formation, "titre", "title"));
    const status = toDisplayText(readValue(formation, "status"));
    const date = String(readValue(formation, "date") || "").trim();
    const id = String(readValue(formation, "id") || "").trim();
    const parts = [`${index + 1}. ${titre}`, `statut=${status}`];
    if (includeIds && id) parts.push(`id=${id}`);
    if (date) parts.push(`date=${date}`);
    return parts.join(" | ");
  });

  const title = askLate
    ? "Voici la liste des formations en retard :"
    : "Voici la liste des formations disponibles :";
  const totalLabel = askLate ? "formations en retard" : "formations";
  const totalValue = askLate ? totalRetard : total;
  return `${title}\n${lines.join("\n")}${buildPartialFooter(items.length, totalValue, totalLabel)}`;
}

function buildDirectClausesListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "clauses");
  if (!summary || typeof summary !== "object") return null;
  const normalized = normalizeSearchText(message);
  const askNonConforme =
    normalized.includes("non conforme") ||
    normalized.includes("non conformes") ||
    normalized.includes("partielle");

  const totalNonConformes = toNumber(readValue(summary, "clausesNonConformes"), 0);
  const totalClauses = toNumber(readValue(summary, "totalClauses"), 0);
  const allItems = toArray(readValue(summary, "clauses"));
  const nonConformeItems = toArray(readValue(summary, "topClausesNonConformes"));
  const items = askNonConforme ? nonConformeItems : allItems;

  if (totalClauses <= 0) {
    return "Selon les donnees actuelles, aucune clause n'est disponible.";
  }

  if (items.length === 0) {
    if (askNonConforme || totalNonConformes <= 0) {
      return "Selon les donnees actuelles, aucune clause n'est marquee non conforme.";
    }
    return `Clauses detectees: ${totalClauses}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((clause, index) => {
    const number = toDisplayText(readValue(clause, "number"), "N/A");
    const title = toDisplayText(readValue(clause, "title"));
    const score = toNumber(readValue(clause, "computedScore"), 0);
    const actionCount = toNumber(readValue(clause, "actionCount"), 0);
    const id = String(readValue(clause, "id") || "").trim();
    const parts = [`${index + 1}. Clause ${number} - ${title}`, `score=${score}%`, `actions=${actionCount}`];
    if (includeIds && id) parts.push(`id=${id}`);
    return parts.join(" | ");
  });

  const title = askNonConforme
    ? "Voici la liste des clauses non conformes :"
    : "Voici la liste des clauses disponibles :";
  const totalLabel = askNonConforme ? "clauses non conformes" : "clauses";
  const totalValue = askNonConforme ? totalNonConformes : totalClauses;

  return `${title}\n${lines.join("\n")}${buildPartialFooter(items.length, totalValue, totalLabel)}`;
}

function buildDirectControlsListAnswer(message, appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "controles");
  if (!summary || typeof summary !== "object") return null;

  const normalized = normalizeSearchText(message);
  const askRetard =
    normalized.includes("retard") ||
    normalized.includes("echeance") ||
    normalized.includes("plan");
  const askNonConforme =
    normalized.includes("non conforme") ||
    normalized.includes("non conformes") ||
    normalized.includes("non mis") ||
    normalized.includes("nonmis");

  if (askRetard) {
    const items = toArray(readValue(summary, "actionsEnRetard"));
    if (items.length === 0) {
      return "Selon les donnees actuelles, aucune action controle en retard n'est detectee.";
    }

    const lines = items.map((row, index) => {
      const code = toDisplayText(readValue(row, "code"), "N/A");
      const titre = toDisplayText(readValue(row, "titre"));
      const responsable = String(readValue(row, "responsable") || "").trim();
      const echeance = String(readValue(row, "echeance") || "").trim();
      const statutPlan = String(readValue(row, "statutPlan") || "").trim();
      const parts = [`${index + 1}. ${code} - ${titre}`];
      if (responsable) parts.push(`responsable=${responsable}`);
      if (echeance) parts.push(`echeance=${echeance}`);
      if (statutPlan) parts.push(`statutPlan=${statutPlan}`);
      return parts.join(" | ");
    });

    return `Voici la liste des actions controles en retard :\n${lines.join("\n")}`;
  }

  if (askNonConforme) {
    const total = toNumber(readValue(summary, "nonConformes"), 0);
    const items = toArray(readValue(summary, "nonMisEnOeuvre"));
    if (total <= 0) {
      return "Selon les donnees actuelles, aucun controle non conforme n'est detecte.";
    }
    if (items.length === 0) {
      return `Controles non conformes detectes: ${total}, mais le detail n'est pas disponible dans le contexte courant.`;
    }

    const lines = items.map((row, index) => {
      const code = toDisplayText(readValue(row, "code"), "N/A");
      const titre = toDisplayText(readValue(row, "titre"));
      const statut = toDisplayText(readValue(row, "statut"));
      const priorite = String(readValue(row, "priorite") || "").trim();
      const parts = [`${index + 1}. ${code} - ${titre}`, `statut=${statut}`];
      if (priorite) parts.push(`priorite=${priorite}`);
      return parts.join(" | ");
    });

    return `Voici la liste des controles non conformes / non mis en oeuvre :\n${lines.join("\n")}${buildPartialFooter(
      items.length,
      total,
      "controles non conformes"
    )}`;
  }

  const totalControls = toNumber(readValue(summary, "total"), 0);
  const items = toArray(readValue(summary, "controles"));
  if (totalControls <= 0) {
    return "Selon les donnees actuelles, aucun controle n'est disponible.";
  }
  if (items.length === 0) {
    return `Controles detectes: ${totalControls}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((row, index) => {
    const code = toDisplayText(readValue(row, "code"), "N/A");
    const titre = toDisplayText(readValue(row, "titre"));
    const statut = toDisplayControlStatus(readValue(row, "statutBrut", "statut"));
    const applicable = readValue(row, "applicable");
    const priorite = String(readValue(row, "priorite") || "").trim();
    const statutPlan = toDisplayPlanStatus(readValue(row, "statutPlan"));
    const id = String(readValue(row, "id") || "").trim();
    const parts = [`${index + 1}. ${code} - ${titre}`, `statut=${statut}`];
    if (includeIds && id) parts.push(`id=${id}`);
    if (typeof applicable === "boolean") parts.push(`applicable=${applicable ? "oui" : "non"}`);
    if (priorite) parts.push(`priorite=${priorite}`);
    if (statutPlan && statutPlan !== "unknown") parts.push(`statutPlan=${statutPlan}`);
    return parts.join(" | ");
  });

  return `Voici la liste des controles disponibles :\n${lines.join("\n")}${buildPartialFooter(
    items.length,
    totalControls,
    "controles"
  )}`;
}

function buildDirectAuditActionsListAnswer(appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "actionsCorrectives");
  if (!summary || typeof summary !== "object") return null;

  const total = toNumber(readValue(summary, "totalRetard"), 0);
  const items = toArray(readValue(summary, "topRetard"));
  if (total <= 0) {
    return "Selon les donnees actuelles, aucune action corrective en retard n'est detectee.";
  }

  if (items.length === 0) {
    return `Actions correctives en retard detectees: ${total}, mais le detail n'est pas disponible dans le contexte courant.`;
  }

  const lines = items.map((row, index) => {
    const ncTitre = toDisplayText(readValue(row, "ncTitre"), "Non-conformite");
    const description = toDisplayText(readValue(row, "description"));
    const responsible = String(readValue(row, "responsible") || "").trim();
    const echeance = String(readValue(row, "echeance") || "").trim();
    const statut = String(readValue(row, "statut") || "").trim();
    const ncId = String(readValue(row, "ncId") || "").trim();
    const parts = [`${index + 1}. ${ncTitre}`, `action=${description}`];
    if (includeIds && ncId) parts.push(`id=${ncId}`);
    if (responsible) parts.push(`responsable=${responsible}`);
    if (echeance) parts.push(`echeance=${echeance}`);
    if (statut) parts.push(`statut=${statut}`);
    return parts.join(" | ");
  });

  return `Voici la liste des actions correctives en retard :\n${lines.join("\n")}${buildPartialFooter(
    items.length,
    total,
    "actions correctives en retard"
  )}`;
}

function buildDirectAuditsListAnswer(appSummary, options = {}) {
  const includeIds = Boolean(options.includeIds);
  const summary = readValue(appSummary, "audits");
  if (!summary || typeof summary !== "object") return null;

  const totalAudits = toNumber(readValue(summary, "totalAudits"), 0);
  if (totalAudits <= 0) {
    return "Selon les donnees actuelles, aucun audit n'est enregistre.";
  }

  const audits = toArray(readValue(summary, "audits"));
  const planned = toNumber(readValue(summary, "auditsPlanifies"), 0);
  const inProgress = toNumber(readValue(summary, "auditsEnCours"), 0);
  const completed = toNumber(readValue(summary, "auditsTermines"), 0);
  const ncOpen = toNumber(readValue(summary, "nonConformitesOuvertes"), 0);
  const correctiveLate = toNumber(readValue(summary, "actionsCorrectivesEnRetard"), 0);

  if (audits.length > 0) {
    const lines = audits.map((audit, index) => {
      const titre = toDisplayText(readValue(audit, "titre"));
      const statut = toDisplayAuditStatus(readValue(audit, "statut"));
      const startDate = String(readValue(audit, "startDate") || "").trim();
      const endDate = String(readValue(audit, "endDate") || "").trim();
      const responsable = String(readValue(audit, "responsable") || "").trim();
      const id = String(readValue(audit, "id") || "").trim();
      const parts = [`${index + 1}. ${titre}`, `statut=${statut}`];
      if (includeIds && id) parts.push(`id=${id}`);
      if (startDate) parts.push(`debut=${startDate}`);
      if (endDate) parts.push(`fin=${endDate}`);
      if (responsable) parts.push(`responsable=${responsable}`);
      return parts.join(" | ");
    });

    return `Voici la liste des audits disponibles :\n${lines.join("\n")}${buildPartialFooter(
      audits.length,
      totalAudits,
      "audits"
    )}\nStatistiques: planifies=${planned}, enCours=${inProgress}, termines=${completed}, ncOuvertes=${ncOpen}, actionsRetard=${correctiveLate}.`;
  }

  return [
    "Synthese audits disponible:",
    `- Total audits=${totalAudits}`,
    `- Planifies=${planned}`,
    `- En cours=${inProgress}`,
    `- Termines=${completed}`,
    `- Non-conformites ouvertes=${ncOpen}`,
    `- Actions correctives en retard=${correctiveLate}`,
  ].join("\n");
}

function buildDirectDashboardListAnswer(appSummary) {
  const summary = readValue(appSummary, "dashboardKpi");
  if (!summary || typeof summary !== "object") return null;

  const tauxGlobalConformite = toNumber(readValue(summary, "tauxGlobalConformite"), 0);
  const totalActifs = toNumber(readValue(summary, "totalActifs"), 0);
  const totalControles = toNumber(readValue(summary, "totalControles"), 0);
  const controlesParStatut = toArray(readValue(summary, "controlesParStatut"));
  const controlesParDomaine = toArray(readValue(summary, "controlesParDomaine"));

  const lines = [
    "Voici le resume du dashboard SMSI :",
    `- Taux global de conformite=${tauxGlobalConformite}%`,
    `- Total actifs=${totalActifs}`,
    `- Total controles=${totalControles}`,
  ];

  if (controlesParStatut.length > 0) {
    const statusLine = controlesParStatut
      .map((row) => {
        const name = toDisplayText(readValue(row, "statut", "status", "name", "label"), "statut");
        const count = toNumber(readValue(row, "count", "value", "total"), 0);
        return `${name}:${count}`;
      })
      .join(", ");
    lines.push(`- Controles par statut=${statusLine}`);
  }

  if (controlesParDomaine.length > 0) {
    const domainLine = controlesParDomaine
      .map((row) => {
        const name = toDisplayText(readValue(row, "domaine", "domain", "name", "label"), "domaine");
        const count = toNumber(readValue(row, "count", "value", "total"), 0);
        return `${name}:${count}`;
      })
      .join(", ");
    lines.push(`- Controles par domaine=${domainLine}`);
  }

  return lines.join("\n");
}

function buildDirectPdcaListAnswer(appSummary) {
  const summary = readValue(appSummary, "pdca");
  if (!summary || typeof summary !== "object") return null;

  const phases = toArray(readValue(summary, "progressionParPhase"));
  const itemsSummary = readValue(summary, "items") || {};
  const totalItems = toNumber(readValue(itemsSummary, "total"), 0);
  const progressionGlobale = toNumber(readValue(summary, "progressionGlobale"), 0);

  if (totalItems <= 0 || phases.length === 0) {
    return "Selon les donnees actuelles, aucune donnee PDCA detaillee n'est disponible.";
  }

  const lines = phases.map((phase, index) => {
    const name = toDisplayText(readValue(phase, "phase"), "PDCA");
    const progression = toNumber(readValue(phase, "progression"), 0);
    const done = toNumber(readValue(phase, "termines"), 0);
    const inProgress = toNumber(readValue(phase, "enCours"), 0);
    const todo = toNumber(readValue(phase, "aFaire"), 0);
    return `${index + 1}. ${name} | progression=${progression}% | termines=${done} | enCours=${inProgress} | aFaire=${todo}`;
  });

  return `Voici la liste de progression PDCA par phase :\n${lines.join("\n")}\nProgression globale PDCA: ${progressionGlobale}% (${totalItems} items).`;
}

function buildDirectAppModuleListResult(message, appSummary, options = {}) {
  const module = detectRequestedAppListModule(message);
  if (!module) return null;
  if (!appSummary || typeof appSummary !== "object") {
    return {
      key: `${module}_list_unavailable`,
      answer:
        "Les donnees de ce module ne sont pas disponibles actuellement. Verifiez les permissions et la disponibilite des sources SMSI.",
    };
  }

  if (module === "incidents") {
    const answer = buildDirectIncidentListAnswer(message, appSummary, options);
    return answer ? { key: "incidents_list", answer } : null;
  }
  if (module === "risques") {
    const answer = buildDirectRisksListAnswer(appSummary, options);
    return answer ? { key: "risques_list", answer } : null;
  }
  if (module === "actifs") {
    const answer = buildDirectAssetsListAnswer(message, appSummary, options);
    return answer ? { key: "actifs_list", answer } : null;
  }
  if (module === "documentation") {
    const answer = buildDirectDocumentationListAnswer(message, appSummary, options);
    return answer ? { key: "documentation_list", answer } : null;
  }
  if (module === "formations") {
    const answer = buildDirectTrainingsListAnswer(message, appSummary, options);
    return answer ? { key: "formations_list", answer } : null;
  }
  if (module === "clauses") {
    const answer = buildDirectClausesListAnswer(message, appSummary, options);
    return answer ? { key: "clauses_list", answer } : null;
  }
  if (module === "controles") {
    const answer = buildDirectControlsListAnswer(message, appSummary, options);
    return answer ? { key: "controles_list", answer } : null;
  }
  if (module === "audits_actions") {
    const answer = buildDirectAuditActionsListAnswer(appSummary, options);
    return answer ? { key: "audits_actions_list", answer } : null;
  }
  if (module === "audits") {
    const answer = buildDirectAuditsListAnswer(appSummary, options);
    return answer ? { key: "audits_list", answer } : null;
  }
  if (module === "dashboard") {
    const answer = buildDirectDashboardListAnswer(appSummary);
    return answer ? { key: "dashboard_summary", answer } : null;
  }
  if (module === "pdca") {
    const answer = buildDirectPdcaListAnswer(appSummary);
    return answer ? { key: "pdca_list", answer } : null;
  }

  return null;
}

function summarizeRisques(studies) {
  const list = toArray(studies);
  const allRiskEntries = [];
  const studiesOverview = [];

  for (const study of list) {
    const payload = parseJson(readValue(study, "payloadJson", "PayloadJson"), {});
    const workshop5 = readValue(payload, "workshop5") || {};
    const workshop4 = readValue(payload, "workshop4") || {};

    const candidates = [
      ...toArray(readValue(workshop5, "riskEntries")),
      ...toArray(readValue(workshop5, "residualRiskEntries")),
      ...toArray(readValue(workshop4, "operationalScenarios")),
    ];

    let localRisks = 0;
    let localCriticalRisks = 0;
    for (const entry of candidates) {
      const gravity = toNumber(readValue(entry, "gravity", "gravite"), 0);
      const likelihood = toNumber(readValue(entry, "likelihood", "vraisemblance"), 0);
      const score = gravity * likelihood;
      const isCritical = score >= 10 || gravity >= 4 || likelihood >= 4;
      localRisks += 1;
      if (isCritical) localCriticalRisks += 1;

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

    studiesOverview.push({
      id: readValue(study, "id", "Id") || null,
      name: readValue(study, "name", "Name") || "Etude",
      organization: readValue(study, "organization", "Organization") || null,
      author: readValue(study, "author", "Author") || null,
      perimeter: readValue(study, "perimeter", "Perimeter") || null,
      status: readValue(study, "status", "Status", "statut", "Statut") || null,
      createdAt: readValue(study, "createdAt", "CreatedAt") || null,
      updatedAt:
        readValue(study, "updatedAt", "UpdatedAt", "modifiedAt", "ModifiedAt") ||
        readValue(study, "createdAt", "CreatedAt") ||
        null,
      totalRisques: localRisks,
      risquesCritiques: localCriticalRisks,
    });
  }

  const orderedStudies = studiesOverview.sort((a, b) => {
    const aDate = parseDate(a.updatedAt, a.createdAt)?.getTime() || 0;
    const bDate = parseDate(b.updatedAt, b.createdAt)?.getTime() || 0;
    return bDate - aDate;
  });

  const critical = allRiskEntries
    .filter((risk) => risk.score >= 10 || risk.gravity >= 4 || risk.likelihood >= 4)
    .sort((a, b) => b.score - a.score);

  return {
    totalEtudes: list.length,
    totalEntreesRisque: allRiskEntries.length,
    totalRisquesCritiques: critical.length,
    etudes: limitItems(orderedStudies),
    topRisquesCritiques: limitItems(critical),
  };
}

function summarizeActifs(actifs) {
  const items = toArray(actifs);
  const sensibles = [];
  const allAssets = [];
  let secret = 0;
  let topSecret = 0;

  for (const actif of items) {
    const classificationRaw = readValue(actif, "classification", "Classification");
    const token = normalizeToken(classificationRaw);
    const nominal = readValue(actif, "nom", "Nom") || "Actif";
    const owner =
      readValue(actif, "proprietaire", "Proprietaire", "owner", "Owner", "responsable", "Responsable") ||
      null;
    const criticite = readValue(actif, "criticite", "Criticite", "criticalite", "Criticalite") || null;
    const statut = readValue(actif, "status", "Status", "statut", "Statut") || null;

    allAssets.push({
      id: readValue(actif, "id", "Id") || null,
      nom: nominal,
      classification: classificationRaw || null,
      proprietaire: owner,
      criticite,
      statut,
    });

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

  const orderedAssets = allAssets.sort((a, b) => {
    const aKey = normalizeSearchText(`${a.nom || ""}`);
    const bKey = normalizeSearchText(`${b.nom || ""}`);
    return aKey.localeCompare(bKey);
  });

  return {
    total: items.length,
    secret,
    topSecret,
    actifs: limitItems(orderedAssets),
    actifsSensibles: limitItems(sensibles),
  };
}

function summarizeIncidents(incidents) {
  const items = toArray(incidents);
  const ouverts = [];
  const recentIncidents = [];
  let openCount = 0;
  let resolvedCount = 0;

  for (const incident of items) {
    const status = normalizeIncidentStatus(readValue(incident, "statut", "Statut"));
    const row = {
      id: readValue(incident, "id", "Id"),
      titre:
        readValue(incident, "titre", "Titre", "title", "Title", "nom", "Nom", "name", "Name") ||
        "Incident",
      priorite: readValue(incident, "priorite", "Priorite", "priority", "Priority") || null,
      date: readValue(incident, "date", "Date", "createdAt", "CreatedAt") || null,
      statut: status,
    };
    recentIncidents.push(row);

    if (status === "resolved") resolvedCount += 1;
    else {
      openCount += 1;
      ouverts.push(row);
    }
  }

  const sortedRecent = recentIncidents.sort((a, b) => {
    const aDate = parseDate(a.date)?.getTime() || 0;
    const bDate = parseDate(b.date)?.getTime() || 0;
    return bDate - aDate;
  });

  return {
    total: items.length,
    ouverts: openCount,
    resolus: resolvedCount,
    recentIncidents: limitItems(sortedRecent),
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
  const documentsList = [];

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
    documentsList.push(row);

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

  const orderedDocuments = documentsList.sort((a, b) => {
    const aDate = parseDate(a.dateMaj)?.getTime() || 0;
    const bDate = parseDate(b.dateMaj)?.getTime() || 0;
    return bDate - aDate;
  });

  return {
    total: items.length,
    approuves,
    enValidation: validation,
    aRevoir: revoir,
    brouillons: brouillon,
    documents: limitItems(orderedDocuments),
    documentsARevoir: limitItems(needsReview),
  };
}

function summarizeFormations(formations, formationsDashboard) {
  const items = toArray(formations);
  const dashboard = formationsDashboard && typeof formationsDashboard === "object" ? formationsDashboard : {};
  const overdue = [];
  const formationsList = [];
  let completed = 0;
  let inProgress = 0;
  let planned = 0;

  for (const formation of items) {
    const statusRaw = readValue(formation, "status", "Status");
    const status = normalizeTrainingStatus(statusRaw);
    const dateRaw = readValue(formation, "date", "Date");
    const date = parseDate(dateRaw);
    const row = {
      id: readValue(formation, "id", "Id"),
      titre:
        readValue(formation, "title", "Title", "titre", "Titre", "name", "Name") ||
        "Formation",
      status: statusRaw || null,
      date: dateRaw || null,
      responsable: readValue(formation, "owner", "Owner", "responsable", "Responsable") || null,
    };
    formationsList.push(row);

    if (status === "completed") completed += 1;
    else if (status === "in_progress") inProgress += 1;
    else planned += 1;

    if (date && date.getTime() < Date.now() && status !== "completed") {
      overdue.push(row);
    }
  }

  const orderedFormations = formationsList.sort((a, b) => {
    const aDate = parseDate(a.date)?.getTime() || 0;
    const bDate = parseDate(b.date)?.getTime() || 0;
    return bDate - aDate;
  });

  return {
    total: toNumber(readValue(dashboard, "total", "Total"), items.length),
    planifiees: toNumber(readValue(dashboard, "planifiees", "Planifiees"), planned),
    enCours: toNumber(readValue(dashboard, "enCours", "EnCours"), inProgress),
    terminees: toNumber(readValue(dashboard, "terminees", "Terminees"), completed),
    tauxParticipationMoyen: Math.round(toNumber(readValue(dashboard, "tauxMoyen", "TauxMoyen"))),
    formations: limitItems(orderedFormations),
    formationsEnRetard: limitItems(overdue),
  };
}

function summarizeAudits(audits, auditsNc, controlsActionsLate) {
  const auditItems = toArray(audits);
  const ncItems = toArray(auditsNc);
  const auditsList = [];

  let planned = 0;
  let inProgress = 0;
  let completed = 0;
  let ncOpen = 0;
  const correctiveLate = [...toArray(controlsActionsLate)];

  for (const audit of auditItems) {
    const status = normalizeAuditStatus(readValue(audit, "status", "Status"));
    const rawStatus = readValue(audit, "status", "Status") || null;
    const startDate =
      readValue(audit, "date", "Date", "startDate", "StartDate", "scheduledAt", "ScheduledAt") ||
      null;
    const endDate = readValue(audit, "endDate", "EndDate", "completedAt", "CompletedAt") || null;
    auditsList.push({
      id: readValue(audit, "id", "Id") || null,
      titre: readValue(audit, "title", "Title", "nom", "Nom", "name", "Name") || "Audit",
      statut: rawStatus,
      startDate,
      endDate,
      responsable:
        readValue(audit, "auditor", "Auditor", "responsable", "Responsable", "owner", "Owner") ||
        null,
    });

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

  const orderedAudits = auditsList.sort((a, b) => {
    const aDate = parseDate(a.startDate, a.endDate)?.getTime() || 0;
    const bDate = parseDate(b.startDate, b.endDate)?.getTime() || 0;
    return bDate - aDate;
  });

  return {
    totalAudits: auditItems.length,
    auditsPlanifies: planned,
    auditsEnCours: inProgress,
    auditsTermines: completed,
    nonConformitesOuvertes: ncOpen,
    actionsCorrectivesEnRetard: correctiveLate.length,
    audits: limitItems(orderedAudits),
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
    "- Ne pas afficher les IDs techniques (UUID, identifiants internes) sauf si l'utilisateur le demande explicitement.",
    "- Privilegier des reponses metier claires, concises et directement exploitables.",
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
      "- Si la question porte sur les controles conformes, utilise prioritairement 'controles.topConformes' et 'controles.conformes' du contexte JSON.",
      "- Quand l'utilisateur demande une liste, commence par afficher la liste demandee puis ajoute un bref resume.",
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

function buildUserPrompt(
  chatMode,
  message,
  appContext,
  documentContext,
  followUpContext,
  methodContext,
  showTechnicalIds = false
) {
  const followUpBlock = buildFollowUpUserBlock(message, followUpContext, methodContext);

  if (chatMode === CHAT_MODE.APP_DATA_ANALYSIS) {
    const summaryForPrompt = showTechnicalIds
      ? appContext?.summary || {}
      : removeTechnicalIds(appContext?.summary || {});
    const contextJson = truncateContextForPrompt(summaryForPrompt);
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
    const docsRaw = toArray(documentContext?.documents);
    const docs = showTechnicalIds ? docsRaw : removeTechnicalIds(docsRaw);
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
  showTechnicalIds = false,
}) {
  return [
    {
      role: "system",
      content: buildSystemPrompt(chatMode, appContext, documentContext, followUpContext, methodContext),
    },
    ...sanitizeHistory(history),
    {
      role: "user",
      content: buildUserPrompt(
        chatMode,
        message,
        appContext,
        documentContext,
        followUpContext,
        methodContext,
        showTechnicalIds
      ),
    },
  ];
}

async function prepareConversationExecution({ message, history, token, permissionScope, lastMethod }) {
  const intent = routeIntent(message, history);
  const profile = getIntentExecutionProfile(intent.mode);
  const followUpContext = buildFollowUpContext(intent, history);
  const methodContext = buildMethodContext(lastMethod, message, followUpContext);
  const requestedAppListModule = detectRequestedAppListModule(message);
  const forceAppDataForList = Boolean(requestedAppListModule);
  const effectiveAppDataUsed = Boolean(profile.appDataUsed || forceAppDataForList);
  const showTechnicalIds = shouldShowTechnicalIds(message, followUpContext);
  const shouldForceDetailedContinuation = Boolean(
    followUpContext?.isFollowUp &&
      (followUpContext.type === "continue" || followUpContext.type === "detail")
  );

  let appContext = null;
  let documentContext = null;
  const preferredSourceKeys = effectiveAppDataUsed
    ? selectPreferredSourceKeys(message, followUpContext)
    : [];

  if (effectiveAppDataUsed) {
    appContext = await getSmsiContext(token, permissionScope, {
      sourceKeys: preferredSourceKeys,
    });
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
    showTechnicalIds,
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
    appDataUsed: effectiveAppDataUsed,
    documentUsed: Boolean(profile.documentUsed),
    ragUsed: effectiveRagUsed,
    intentReason: intent.reason,
    followUp: Boolean(intent.followUp),
    followUpType: intent.followUpType || "none",
    anchorMessage: String(intent.anchorMessage || ""),
    lastMethod: methodContext.activeMethod,
    methodUsedInResponse: methodContext.methodUsedInResponse,
    requestedAppListModule: requestedAppListModule || null,
    showTechnicalIds,
  };

  return {
    messages,
    context,
    llmOptions,
    appSummary: appContext?.summary || null,
    trace: {
      message,
      mode: intent.mode,
      appDataUsed: effectiveAppDataUsed,
      documentUsed: Boolean(profile.documentUsed),
      ragUsed: effectiveRagUsed,
      followUp: Boolean(intent.followUp),
      followUpType: intent.followUpType || "none",
      lastMethod: methodContext.activeMethod,
      methodUsedInResponse: methodContext.methodUsedInResponse,
      preferredSourceKeys,
      requestedAppListModule: requestedAppListModule || null,
      showTechnicalIds,
      llmCalled: false,
      finalResponseLength: 0,
      numPredict: llmOptions.numPredict,
    },
    showTechnicalIds,
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

export async function getSmsiContext(token, permissionScope, options = {}) {
  const { data, sourceStatus, blockedSources } = await loadSources(token, permissionScope, options);
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

  const directResult =
    (isConformeControlsQuestion(message)
      ? { key: "controles_conformes", answer: buildDirectConformeControlsAnswer(message, execution.appSummary) }
      : null) ||
    buildDirectAppModuleListResult(message, execution.appSummary, {
      includeIds: execution.showTechnicalIds,
    });
  if (directResult?.answer) {
    execution.trace.finalResponseLength = String(directResult.answer).length;
    execution.trace.directAnswer = directResult.key || "direct_answer";
    logChatTrace(execution.trace);
    return {
      answer: directResult.answer,
      context: execution.context,
    };
  }

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

  const directResult =
    (isConformeControlsQuestion(message)
      ? { key: "controles_conformes", answer: buildDirectConformeControlsAnswer(message, execution.appSummary) }
      : null) ||
    buildDirectAppModuleListResult(message, execution.appSummary, {
      includeIds: execution.showTechnicalIds,
    });
  if (directResult?.answer) {
    const directStartedAt = Date.now();
    onFirstToken?.({
      elapsedMs: 0,
      timeoutMs: OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
    });
    onToken?.(directResult.answer);
    execution.trace.finalResponseLength = String(directResult.answer).length;
    execution.trace.directAnswer = directResult.key || "direct_answer";
    logChatTrace(execution.trace);

    return {
      answer: directResult.answer,
      context: execution.context,
      metrics: {
        firstTokenMs: 0,
        totalMs: Date.now() - directStartedAt,
        firstTokenTimeoutMs: OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
        numPredict: 0,
        doneReason: "direct_answer",
        evalCount: null,
        promptEvalCount: null,
        evalDuration: null,
        promptEvalDuration: null,
        totalDuration: null,
      },
    };
  }

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
