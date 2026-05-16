import { MITRE_ENTERPRISE_TACTICS } from "./mitreEnterpriseCatalog";

export const STORAGE_PREFIX = "smsi_risk_studies_v1";
export const STORAGE_KEY = STORAGE_PREFIX;
export const LEGACY_STORAGE_KEY = "ebios_rm_pro_v3";

function normalizeStringId(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeActor(actor) {
  const source = actor || {};
  const userId = normalizeStringId(source.id ?? source.Id ?? source.userId ?? source.UserId, "anonymous");
  const societeId = toPositiveInteger(source.societeId ?? source.SocieteId ?? source.societe?.id ?? source.Societe?.Id);
  return {
    userId,
    societeId: societeId ?? "na",
  };
}

export function buildRiskStorageKey(actor) {
  const scope = normalizeActor(actor);
  return `${STORAGE_PREFIX}::${scope.userId}::${scope.societeId}`;
}

function readStoredActor() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getCurrentRiskStorageKey() {
  return buildRiskStorageKey(readStoredActor());
}

export function listRiskStorageKeys() {
  if (typeof localStorage === "undefined") return [];
  return Object.keys(localStorage).filter((key) => key.startsWith(`${STORAGE_PREFIX}::`));
}

function isAnonymousStorageKey(key) {
  return key.includes("::anonymous::");
}

export const WORKSHOP_STATUS_OPTIONS = [
  { value: "non_evalue", label: "Non evalue" },
  { value: "en_cours", label: "En cours" },
  { value: "a_valider", label: "A valider" },
  { value: "termine", label: "Termine" },
];

export const WORKSHOP_META = [
  {
    id: 1,
    short: "Cadrage",
    title: "Atelier 1 - Cadrage et socle de securite",
    description: "Structurer le contexte, les valeurs metier et les evenements redoutes.",
    steps: [
      { id: "team", label: "Equipe et Responsabilites" },
      { id: "context", label: "Contexte de l'etude" },
      { id: "missions", label: "Missions et Valeurs Metier" },
      { id: "assets", label: "Biens supports" },
      { id: "feared", label: "Evenements redoutes" },
      { id: "iso", label: "Controles ISO 27001:2022" },
    ],
  },
  {
    id: 2,
    short: "Sources",
    title: "Atelier 2 - Sources de risque",
    description: "Qualifier les sources, objectifs vises et couples SR/OV.",
    steps: [
      { id: "sources", label: "Caracterisation des Sources de Risque" },
      { id: "pairs", label: "Identification des couples" },
      { id: "matrix", label: "Tableau de Reference (Pertinence)" },
    ],
  },
  {
    id: 3,
    short: "Strategique",
    title: "Atelier 3 - Scenarios strategiques",
    description: "Analyser les parties prenantes et traiter les risques strategiques.",
    steps: [
      { id: "stakeholders", label: "Parties prenantes" },
      { id: "strategic", label: "Scenarios strategiques" },
      { id: "strategic_treat", label: "Traitement des risques strategiques" },
      { id: "stakeholder_matrix", label: "Matrice de Criticite des Parties Prenantes" },
      { id: "threat_zones", label: "Zones de menace des parties prenantes" },
    ],
  },
  {
    id: 4,
    short: "Operationnel",
    title: "Atelier 4 - Scenarios operationnels",
    description: "Qualifier vraisemblance, modes operatoires et scenarios operationnels.",
    steps: [
      { id: "likelihood_scale", label: "Echelle de calcul de vraisemblance" },
      { id: "op_modes", label: "Modes operatoires" },
      { id: "op_scenarios", label: "Scenarios operationnels" },
    ],
  },
  {
    id: 5,
    short: "Traitement",
    title: "Atelier 5 - Traitement du risque",
    description: "Piloter le registre des risques, mesures et residuels.",
    steps: [
      { id: "risk_register", label: "Registre des Risques" },
      { id: "risk_map", label: "Matrice de Risque / Cartographie" },
      { id: "criteria", label: "Tableau des Criteres de Traitement" },
      { id: "residual_matrix", label: "Matrice des Risques Residuels" },
      { id: "measures", label: "Tableau des Mesures de Securite" },
      { id: "governance", label: "Gouvernance & Anticipation" },
      { id: "protection", label: "Protection" },
      { id: "defense", label: "Defense" },
      { id: "resilience", label: "Resilience" },
      { id: "conformite", label: "Conformite" },
      { id: "residual_form", label: "Risques residuels" },
    ],
  },
];

export const G_LABELS = { 1: "Mineure", 2: "Significative", 3: "Grave", 4: "Critique" };
export const V_LABELS = { 1: "Minimal", 2: "Significatif", 3: "Fort", 4: "Maximal" };

export const MEASURE_CATEGORIES = ["Gouvernance", "Protection", "Defense", "Resilience", "Conformite"];

export const RISK_ENTRY_STATUS_OPTIONS = [
  { value: "ouvert", label: "Ouvert" },
  { value: "en_traitement", label: "En traitement" },
  { value: "traite", label: "Traite" },
  { value: "accepte", label: "Accepte" },
];

const RISK_ENTRY_STATUS_LABELS = Object.fromEntries(
  RISK_ENTRY_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

export const MITRE_TACTICS = MITRE_ENTERPRISE_TACTICS;

export const ANSSI_BASE = {
  guideTitle: "Guide methodologique EBIOS RM",
  guideDescription: "Methode ANSSI en 5 ateliers pour l'analyse des risques cyber. Conforme aux recommandations de l'ANSSI.",
  sources: [
    "Etat etranger / Officine specialisee",
    "Crime organise / Cybercriminel",
    "Concurrent / Hacktiviste",
    "Attaquant interne / Amateur",
  ],
  objectifs: [
    "Espionnage / Pre-positionnement",
    "Destabilisation / Entrave",
    "Lucratif / Atteinte d'image",
    "Sabotage / Chantage",
  ],
  references: ["ISO 27001", "NIST CSF", "RGPD", "NIS2", "SecNumCloud", "HDS", "DORA", "SOC2"],
  gravityScale: [
    { level: "G1", label: "Mineure", tone: "emerald" },
    { level: "G2", label: "Significative", tone: "amber" },
    { level: "G3", label: "Grave", tone: "orange" },
    { level: "G4", label: "Critique", tone: "red" },
  ],
};

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

export function riskLevel(gravity, likelihood) {
  const score = Number(gravity || 0) * Number(likelihood || 0);
  if (score <= 2) return { label: "Faible", cls: "lvl-1", level: 1, score };
  if (score <= 6) return { label: "Moyen", cls: "lvl-2", level: 2, score };
  if (score <= 9) return { label: "Eleve", cls: "lvl-3", level: 3, score };
  return { label: "Critique", cls: "lvl-4", level: 4, score };
}

export function createEmptyStudy(meta = {}) {
  return {
    id: uid(),
    name: meta.name || "Nouvelle etude",
    organization: meta.organization || "",
    description: meta.description || "",
    perimeter: meta.perimeter || "",
    author: meta.author || "",
    createdAt: nowDate(),
    updatedAt: nowDate(),
    workshopStatuses: { 1: null, 2: null, 3: null, 4: null, 5: null },
    workshop1: {
      team: [],
      context: {
        description: "",
        perimeter: "",
        environment: "",
        hypotheses: "",
        constraints: "",
        general: "",
        regulatory: "",
        threats: "",
        assumptions: "",
      },
      missions: [],
      businessValues: [],
      supportingAssets: [],
      fearedEvents: [],
      isoControls: [],
    },
    workshop2: {
      riskSources: [],
      targetObjectives: [],
      sourceObjectivePairs: [],
    },
    workshop3: {
      stakeholders: [],
      threatZones: [],
      strategicScenarios: [],
      treatments: [],
    },
    workshop4: {
      operationalModes: [],
      operationalScenarios: [],
    },
    workshop5: {
      riskEntries: [],
      measures: [],
      residualRisks: [],
      soa: [],
    },
  };
}

export function createDemoStudies() {
  const base = createEmptyStudy({
    name: "Certification ISO 27001",
    organization: "TechCorp SA",
    description: "Analyse des risques cyber pour le perimetre SI critique.",
    perimeter: "Consultant - SI RH et infrastructure cloud",
    author: "Marie Dupont",
  });

  base.workshop1.team = [
    { id: uid(), role: "RSSI", name: "Marie Dupont", responsibility: "Pilotage EBIOS", contact: "m.dupont@techcorp.fr" },
    { id: uid(), role: "Consultant", name: "Jean Martin", responsibility: "Validation architecture", contact: "j.martin@techcorp.fr" },
  ];
  const missionId = uid();
  const valueId = uid();
  const sourceId = uid();
  const objectiveId = uid();
  const pairId = uid();
  const stakeholderId = uid();
  const strategicId = uid();
  const opModeId = uid();
  const opScenarioId = uid();
  const riskEntryId = uid();

  base.workshop1.missions = [{ id: missionId, name: "Production SaaS", description: "Developpement et exploitation" }];
  base.workshop1.businessValues = [{ id: valueId, missionId, name: "Donnees clients RH", type: "Donnees", description: "Donnees personnelles critiques" }];
  base.workshop1.supportingAssets = [{ id: uid(), businessValueId: valueId, name: "RDS PostgreSQL", type: "BDD", location: "AWS", criticality: "Critique" }];
  base.workshop1.fearedEvents = [{ id: uid(), businessValueId: valueId, description: "Fuite de donnees RH", impact: "Impact RGPD et image", gravity: 4 }];
  base.workshop1.isoControls = [{ id: uid(), reference: "A.5.1", name: "Politiques de securite", status: "applique", comments: "PSSI validee" }];

  base.workshop2.riskSources = [{ id: sourceId, name: "Cybercriminels", type: "Externe", motivation: "Gain financier", capability: 3 }];
  base.workshop2.targetObjectives = [{ id: objectiveId, name: "Exfiltration de donnees", description: "Vol des donnees RH", fearedEventIds: [] }];
  base.workshop2.sourceObjectivePairs = [{ id: pairId, riskSourceId: sourceId, targetObjectiveId: objectiveId, retained: true, justification: "Scenario plausible" }];

  base.workshop3.stakeholders = [{ id: stakeholderId, name: "Prestataire cloud", type: "Sous-traitant", exposure: 3, reliability: 2, access: "Acces admin" }];
  base.workshop3.strategicScenarios = [{ id: strategicId, coupleId: pairId, stakeholderIds: [stakeholderId], name: "Compromission prestataire", description: "Pivot vers SI interne", gravity: 4 }];
  base.workshop3.treatments = [{ id: uid(), scenarioId: strategicId, decision: "Reduction", justification: "MFA, segmentation, SIEM" }];

  base.workshop4.operationalModes = [{ id: opModeId, strategicScenarioId: strategicId, name: "Phishing puis mouvement lateral", description: "Acces illegitime", technics: ["T1566", "T1078"] }];
  base.workshop4.operationalScenarios = [{ id: opScenarioId, strategicScenarioId: strategicId, operationalModeIds: [opModeId], supportingAssetIds: [], likelihood: 3, name: "Ransomware AWS", description: "Chiffrement donnees" }];

  base.workshop5.riskEntries = [{
    id: riskEntryId,
    operationalScenarioId: opScenarioId,
    gravity: 4,
    likelihood: 3,
    treatment: "Reduction",
    status: "en_traitement",
    ownerUserId: "",
    ownerName: "",
    notes: "Priorite haute",
  }];
  base.workshop5.measures = [{ id: uid(), category: "Protection", name: "MFA global", description: "MFA sur comptes privilegies", priority: "Critique", status: "Fait" }];
  base.workshop5.residualRisks = [{ id: uid(), riskEntryId, residualGravity: 3, residualLikelihood: 2, justification: "Mesures en place" }];
  base.workshop5.soa = [{ id: uid(), reference: "A.5.1", objective: "Politique de securite", applicable: "oui", justification: "Applicable au perimetre", implementationStatus: "implemente", linkedMeasureIds: [] }];

  return [base];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function normalizeTextToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeTechniqueValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.toUpperCase().match(/\bT\d{4}(?:\.\d{3})?\b/);
  return match ? match[0] : raw;
}

function normalizeTechniqueList(value) {
  if (!Array.isArray(value)) return [];
  const unique = [];
  const seen = new Set();
  value.forEach((entry) => {
    const normalized = normalizeTechniqueValue(entry);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });
  return unique;
}

function normalizeRiskSourceType(value) {
  const token = normalizeTextToken(value);
  if (!token) return "Externe";

  if (
    token.includes("interne")
    || token.includes("insider")
    || token.includes("employe")
    || token.includes("collabor")
  ) {
    return "Interne";
  }

  return "Externe";
}

function normalizeRiskTreatment(value) {
  const token = normalizeTextToken(value);
  if (!token) return "";
  if (token === "reduction") return "Reduction";
  if (token === "acceptation") return "Acceptation";
  if (token === "partage") return "Partage";
  if (token === "refus") return "Refus";
  return String(value || "").trim();
}

export function normalizeRiskEntryStatus(value) {
  const token = normalizeTextToken(value).replace(/\s+/g, "_");
  if (!token) return "ouvert";
  if (token === "ouvert" || token === "open") return "ouvert";
  if (token === "en_traitement" || token === "in_progress" || token === "inprogress" || token === "ongoing") return "en_traitement";
  if (token === "traite" || token === "treated" || token === "closed") return "traite";
  if (token === "accepte" || token === "accepted") return "accepte";
  return "ouvert";
}

export function riskEntryStatusLabel(value) {
  const status = normalizeRiskEntryStatus(value);
  return RISK_ENTRY_STATUS_LABELS[status] || "Ouvert";
}

function sanitizeStudyIntegrity(study) {
  const next = study;

  const missions = asArray(next.workshop1?.missions);
  next.workshop1.missions = missions;
  const missionIds = new Set(missions.map((item) => item.id));

  const businessValues = asArray(next.workshop1?.businessValues).filter((item) => missionIds.has(item.missionId));
  next.workshop1.businessValues = businessValues;
  const businessValueIds = new Set(businessValues.map((item) => item.id));

  next.workshop1.supportingAssets = asArray(next.workshop1?.supportingAssets).filter((item) => businessValueIds.has(item.businessValueId));
  next.workshop1.fearedEvents = asArray(next.workshop1?.fearedEvents).filter((item) => businessValueIds.has(item.businessValueId));
  const fearedEventIds = new Set(next.workshop1.fearedEvents.map((item) => item.id));

  next.workshop2.riskSources = asArray(next.workshop2?.riskSources).map((item) => ({
    ...item,
    type: normalizeRiskSourceType(item?.type),
  }));
  next.workshop2.targetObjectives = asArray(next.workshop2?.targetObjectives).map((item) => ({
    ...item,
    fearedEventIds: asArray(item?.fearedEventIds).filter((id) => fearedEventIds.has(id)),
  }));

  const sourceIds = new Set(next.workshop2.riskSources.map((item) => item.id));
  const objectiveIds = new Set(next.workshop2.targetObjectives.map((item) => item.id));
  next.workshop2.sourceObjectivePairs = asArray(next.workshop2?.sourceObjectivePairs).filter((item) => sourceIds.has(item.riskSourceId) && objectiveIds.has(item.targetObjectiveId));
  const retainedPairIds = new Set(next.workshop2.sourceObjectivePairs.filter((item) => item.retained === true).map((item) => item.id));

  next.workshop3.stakeholders = asArray(next.workshop3?.stakeholders);
  const stakeholderIds = new Set(next.workshop3.stakeholders.map((item) => item.id));

  next.workshop3.strategicScenarios = asArray(next.workshop3?.strategicScenarios)
    .filter((item) => retainedPairIds.has(item.coupleId))
    .map((item) => ({
      ...item,
      stakeholderIds: asArray(item?.stakeholderIds).filter((id) => stakeholderIds.has(id)),
    }));

  const strategicScenarioIds = new Set(next.workshop3.strategicScenarios.map((item) => item.id));
  next.workshop3.treatments = asArray(next.workshop3?.treatments).filter((item) => strategicScenarioIds.has(item.scenarioId));

  next.workshop4.operationalModes = asArray(next.workshop4?.operationalModes)
    .filter((item) => strategicScenarioIds.has(item.strategicScenarioId))
    .map((item) => ({
      ...item,
      technics: normalizeTechniqueList(item?.technics),
    }));
  const operationalModeIds = new Set(next.workshop4.operationalModes.map((item) => item.id));

  const supportingAssetIds = new Set(next.workshop1.supportingAssets.map((item) => item.id));
  next.workshop4.operationalScenarios = asArray(next.workshop4?.operationalScenarios)
    .filter((item) => strategicScenarioIds.has(item.strategicScenarioId))
    .map((item) => ({
      ...item,
      operationalModeIds: asArray(item?.operationalModeIds).filter((id) => operationalModeIds.has(id)),
      supportingAssetIds: asArray(item?.supportingAssetIds).filter((id) => supportingAssetIds.has(id)),
    }));

  const operationalScenarioIds = new Set(next.workshop4.operationalScenarios.map((item) => item.id));
  next.workshop5.riskEntries = asArray(next.workshop5?.riskEntries)
    .filter((item) => operationalScenarioIds.has(item.operationalScenarioId))
    .map((item) => ({
      ...item,
      treatment: normalizeRiskTreatment(item?.treatment),
      status: normalizeRiskEntryStatus(item?.status),
      ownerUserId: hasText(item?.ownerUserId) ? String(item.ownerUserId).trim() : "",
      ownerName: hasText(item?.ownerName) ? String(item.ownerName).trim() : "",
    }));

  const riskEntryIds = new Set(next.workshop5.riskEntries.map((item) => item.id));
  next.workshop5.residualRisks = asArray(next.workshop5?.residualRisks).filter((item) => riskEntryIds.has(item.riskEntryId));

  next.workshop5.measures = asArray(next.workshop5?.measures);
  const measureIds = new Set(next.workshop5.measures.map((item) => item.id));

  next.workshop5.soa = asArray(next.workshop5?.soa).map((item) => ({
    ...item,
    linkedMeasureIds: asArray(item?.linkedMeasureIds).filter((id) => measureIds.has(id)),
  }));

  return next;
}

function isContextReady(context) {
  const source = context || {};
  return hasText(source.description || source.general) && hasText(source.perimeter);
}

function getWorkshop3State(study) {
  const scenarios = asArray(study?.workshop3?.strategicScenarios);
  const treatments = asArray(study?.workshop3?.treatments);
  const retainedPairIds = new Set(
    asArray(study?.workshop2?.sourceObjectivePairs)
      .filter((pair) => pair.retained === true)
      .map((pair) => pair.id),
  );

  const scenariosHaveStakeholders = scenarios.every((scenario) => asArray(scenario.stakeholderIds).length > 0);
  const scenariosUseRetainedPairs = scenarios.every((scenario) => retainedPairIds.has(scenario.coupleId));

  const treatmentCountByScenario = new Map();
  treatments.forEach((item) => {
    if (!item?.scenarioId) return;
    treatmentCountByScenario.set(item.scenarioId, (treatmentCountByScenario.get(item.scenarioId) || 0) + 1);
  });

  const everyScenarioHasTreatment = scenarios.every((scenario) => (treatmentCountByScenario.get(scenario.id) || 0) >= 1);
  const oneTreatmentPerScenario = scenarios.every((scenario) => (treatmentCountByScenario.get(scenario.id) || 0) === 1);

  return {
    scenarios,
    scenariosHaveStakeholders,
    scenariosUseRetainedPairs,
    everyScenarioHasTreatment,
    oneTreatmentPerScenario,
  };
}

function getWorkshop4State(study) {
  const scenarios = asArray(study?.workshop4?.operationalScenarios);
  const modes = asArray(study?.workshop4?.operationalModes);
  const modeById = new Map(modes.map((item) => [item.id, item]));

  const likelihoodInRange = scenarios.every((scenario) => Number(scenario.likelihood) >= 1 && Number(scenario.likelihood) <= 4);
  const scenariosHaveModes = scenarios.every((scenario) => asArray(scenario.operationalModeIds).length > 0);
  const modesAlignedWithScenario = scenarios.every((scenario) =>
    asArray(scenario.operationalModeIds).every((modeId) => {
      const mode = modeById.get(modeId);
      return mode && mode.strategicScenarioId === scenario.strategicScenarioId;
    }),
  );

  return {
    scenarios,
    likelihoodInRange,
    scenariosHaveModes,
    modesAlignedWithScenario,
  };
}

function getWorkshopChecklist(study, workshopId) {
  if (!study) return [];

  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length > 0,
      isContextReady(study.workshop1.context),
      asArray(study.workshop1.missions).length > 0,
      asArray(study.workshop1.businessValues).length > 0,
      asArray(study.workshop1.supportingAssets).length > 0,
      asArray(study.workshop1.fearedEvents).length > 0,
      asArray(study.workshop1.isoControls).length > 0,
    ];
  }

  if (workshopId === 2) {
    const pairs = asArray(study.workshop2.sourceObjectivePairs);
    return [
      asArray(study.workshop2.riskSources).length > 0,
      asArray(study.workshop2.targetObjectives).length > 0,
      pairs.length > 0,
      pairs.some((pair) => pair.retained === true),
    ];
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return [
      asArray(study.workshop3.stakeholders).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveStakeholders,
      state.scenariosUseRetainedPairs,
      state.everyScenarioHasTreatment,
      state.oneTreatmentPerScenario,
    ];
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return [
      asArray(study.workshop4.operationalModes).length > 0,
      state.scenarios.length > 0,
      state.likelihoodInRange,
      state.scenariosHaveModes,
      state.modesAlignedWithScenario,
    ];
  }

  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length > 0,
      asArray(study.workshop5.measures).length > 0,
      asArray(study.workshop5.residualRisks).length > 0,
    ];
  }

  return [];
}

function checklistProgress(checks) {
  if (!checks.length) return 0;
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function isWorkshopReadyForValidation(study, workshopId) {
  if (!study) return false;

  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length > 0,
      isContextReady(study.workshop1.context),
      asArray(study.workshop1.missions).length > 0,
      asArray(study.workshop1.businessValues).length > 0,
      asArray(study.workshop1.supportingAssets).length > 0,
      asArray(study.workshop1.fearedEvents).length > 0,
    ].every(Boolean);
  }

  if (workshopId === 2) {
    return [
      asArray(study.workshop2.riskSources).length > 0,
      asArray(study.workshop2.targetObjectives).length > 0,
      asArray(study.workshop2.sourceObjectivePairs).length > 0,
    ].every(Boolean);
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return [
      asArray(study.workshop3.stakeholders).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveStakeholders,
      state.scenariosUseRetainedPairs,
      state.everyScenarioHasTreatment,
    ].every(Boolean);
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return [
      asArray(study.workshop4.operationalModes).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveModes,
      state.modesAlignedWithScenario,
    ].every(Boolean);
  }

  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length > 0,
      asArray(study.workshop5.measures).length > 0,
    ].every(Boolean);
  }

  return false;
}

export function isWorkshopComplete(study, workshopId) {
  if (!study) return false;

  if (workshopId === 1) {
    const controls = asArray(study.workshop1.isoControls);
    return isWorkshopReadyForValidation(study, 1) && controls.length > 0 && controls.every((item) => hasText(item.status));
  }

  if (workshopId === 2) {
    const pairs = asArray(study.workshop2.sourceObjectivePairs);
    return isWorkshopReadyForValidation(study, 2) && pairs.some((pair) => pair.retained === true);
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return isWorkshopReadyForValidation(study, 3) && state.oneTreatmentPerScenario;
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return (
      isWorkshopReadyForValidation(study, 4)
      && state.likelihoodInRange
      && state.scenariosHaveModes
      && state.modesAlignedWithScenario
    );
  }

  if (workshopId === 5) {
    const residual = asArray(study.workshop5.residualRisks);
    return (
      isWorkshopReadyForValidation(study, 5)
      && residual.length > 0
    );
  }

  return false;
}

export function hasWorkshopActivity(study, workshopId) {
  if (!study) return false;
  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length,
      asArray(study.workshop1.missions).length,
      asArray(study.workshop1.businessValues).length,
      asArray(study.workshop1.supportingAssets).length,
      asArray(study.workshop1.fearedEvents).length,
      asArray(study.workshop1.isoControls).length,
    ].some((count) => count > 0) || isContextReady(study.workshop1.context);
  }
  if (workshopId === 2) {
    return [
      asArray(study.workshop2.riskSources).length,
      asArray(study.workshop2.targetObjectives).length,
      asArray(study.workshop2.sourceObjectivePairs).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 3) {
    return [
      asArray(study.workshop3.stakeholders).length,
      asArray(study.workshop3.strategicScenarios).length,
      asArray(study.workshop3.treatments).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 4) {
    return [
      asArray(study.workshop4.operationalModes).length,
      asArray(study.workshop4.operationalScenarios).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length,
      asArray(study.workshop5.measures).length,
      asArray(study.workshop5.residualRisks).length,
    ].some((count) => count > 0);
  }
  return false;
}

export function isWorkshopBlocked(study, workshopId) {
  if (workshopId <= 1) return false;
  return !isWorkshopComplete(study, workshopId - 1);
}

export function mapLegacyStatus(value) {
  const v = String(value || "").toLowerCase();
  if (["completed", "termine", "done"].includes(v)) return "termine";
  if (["in_progress", "en_cours", "ip"].includes(v)) return "en_cours";
  if (["a_valider", "to_validate"].includes(v)) return "a_valider";
  if (["not_started", "non_evalue", "todo"].includes(v)) return "non_evalue";
  return null;
}

export function getComputedWorkshopStatus(study, workshopId) {
  if (isWorkshopBlocked(study, workshopId)) return "bloque";
  if (isWorkshopComplete(study, workshopId)) return "termine";
  if (isWorkshopReadyForValidation(study, workshopId)) return "a_valider";
  if (hasWorkshopActivity(study, workshopId)) return "en_cours";
  return "non_evalue";
}

export function getEffectiveWorkshopStatus(study, workshopId) {
  return getComputedWorkshopStatus(study, workshopId);
}

export function getWorkshopProgress(study, workshopId) {
  const status = getEffectiveWorkshopStatus(study, workshopId);
  if (status === "bloque") return 0;
  const checks = getWorkshopChecklist(study, workshopId);
  if (!checks.length) return status === "termine" ? 100 : 0;
  const progress = checklistProgress(checks);
  return status === "termine" ? 100 : progress;
}

export function getStudyProgress(study) {
  const ids = [1, 2, 3, 4, 5];
  const statuses = ids.map((id) => getEffectiveWorkshopStatus(study, id));
  const progressValues = ids.map((id) => getWorkshopProgress(study, id));

  const done = statuses.filter((x) => x === "termine").length;
  const toValidate = statuses.filter((x) => x === "a_valider").length;
  const inProgress = statuses.filter((x) => x === "en_cours").length;
  const blocked = statuses.filter((x) => x === "bloque").length;
  const pct = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;

  let status = "non_evalue";
  if (done === 5) status = "termine";
  else if (toValidate > 0 && inProgress === 0) status = "a_valider";
  else if (done > 0 || toValidate > 0 || inProgress > 0) status = "en_cours";

  return { done, toValidate, inProgress, blocked, pct, status };
}

export function statusLabel(status) {
  if (status === "termine") return "Termine";
  if (status === "a_valider") return "A valider";
  if (status === "en_cours") return "En cours";
  if (status === "bloque") return "Bloque";
  return "Non evalue";
}

export function statusClass(status) {
  if (status === "termine") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "a_valider") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "en_cours") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "bloque") return "bg-red-100 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export function getWorkshopMeta(workshopId) {
  return WORKSHOP_META.find((workshop) => workshop.id === Number(workshopId));
}

export function normalizeLegacyStudy(study) {
  const next = createEmptyStudy({
    name: study?.name,
    organization: study?.organization,
    description: study?.description,
    perimeter: study?.perimeter,
    author: study?.author,
  });

  const merged = {
    ...next,
    ...study,
    workshopStatuses: {
      1: mapLegacyStatus(study?.workshopStatuses?.[1]),
      2: mapLegacyStatus(study?.workshopStatuses?.[2]),
      3: mapLegacyStatus(study?.workshopStatuses?.[3]),
      4: mapLegacyStatus(study?.workshopStatuses?.[4]),
      5: mapLegacyStatus(study?.workshopStatuses?.[5]),
    },
    workshop1: { ...next.workshop1, ...(study?.workshop1 || {}) },
    workshop2: { ...next.workshop2, ...(study?.workshop2 || {}) },
    workshop3: { ...next.workshop3, ...(study?.workshop3 || {}) },
    workshop4: { ...next.workshop4, ...(study?.workshop4 || {}) },
    workshop5: { ...next.workshop5, ...(study?.workshop5 || {}) },
  };

  if (!merged.id) merged.id = uid();
  if (!merged.createdAt) merged.createdAt = nowDate();
  if (!merged.updatedAt) merged.updatedAt = nowDate();

  return sanitizeStudyIntegrity(merged);
}

export function loadInitialStudies(storageKey = getCurrentRiskStorageKey()) {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeLegacyStudy);
    }
  } catch {
    // ignore parse errors and continue with fallback
  }

  if (isAnonymousStorageKey(storageKey)) {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        const list = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
        if (list.length) return list.map(normalizeLegacyStudy);
      }
    } catch {
      // ignore parse errors and continue with seed
    }

    return createDemoStudies();
  }

  return [];
}
