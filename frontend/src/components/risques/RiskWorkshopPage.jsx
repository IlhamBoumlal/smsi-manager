
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useRiskStudies } from "./RiskStudiesContext";
import {
  G_LABELS,
  MEASURE_CATEGORIES,
  MITRE_TACTICS,
  RISK_ENTRY_STATUS_OPTIONS,
  V_LABELS,
  getWorkshopMeta,
  getEffectiveWorkshopStatus,
  getWorkshopProgress,
  isWorkshopBlocked,
  normalizeRiskEntryStatus,
  riskLevel,
  riskEntryStatusLabel,
} from "./riskModel";
import { printWorkshopLivrable } from "./riskExport";
import { RiskCallout, RiskCard, RiskCrudTable, RiskKpiTile, RiskPageHeader, RiskSectionHeader, RiskStatusBadge } from "./RiskUi";

const SCALE_1_4_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `${value}/4` }));
const GRAVITY_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `G${value} - ${G_LABELS[value]}` }));
const LIKELIHOOD_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `V${value} - ${V_LABELS[value]}` }));
const YES_NO_OPTIONS = [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }];
const TREATMENT_OPTIONS = [
  { value: "Reduction", label: "Reduction" },
  { value: "Acceptation", label: "Acceptation" },
  { value: "Partage", label: "Partage" },
  { value: "Refus", label: "Refus" },
];
const TREATMENT_LABEL_BY_VALUE = new Map(TREATMENT_OPTIONS.map((option) => [option.value, option.label]));
const TEAM_ROLE_OPTIONS = ["RSSI", "DSI", "Direction metier", "Architecte", "Exploitant", "Conformite", "Juridique", "DPO", "Autre"].map((value) => ({ value, label: value }));
const BUSINESS_VALUE_TYPE_OPTIONS = ["Donnees", "Service", "Processus", "Image", "Conformite", "Financier", "Autre"].map((value) => ({ value, label: value }));
const SUPPORTING_ASSET_TYPE_OPTIONS = ["Application", "Serveur", "Base de donnees", "Reseau", "Cloud", "Poste", "Prestataire", "Autre"].map((value) => ({ value, label: value }));
const CRITICALITY_OPTIONS = ["Faible", "Moyenne", "Elevee", "Critique"].map((value) => ({ value, label: value }));
const RISK_SOURCE_TYPE_OPTIONS = ["Interne", "Externe"].map((value) => ({ value, label: value }));
const ISO_STATUS_OPTIONS = [
  { value: "applique", label: "Applique" },
  { value: "partiel", label: "Partiel" },
  { value: "en_cours", label: "En cours" },
  { value: "non_applique", label: "Non applique" },
];
const STAKEHOLDER_TYPE_OPTIONS = ["Interne", "Fournisseur", "Sous-traitant", "Partenaire", "Client", "Autorite", "Autre"].map((value) => ({ value, label: value }));
const STAKEHOLDER_ACCESS_OPTIONS = ["Aucun acces", "Acces limite", "Acces metier", "Acces privilegie", "Acces administrateur"].map((value) => ({ value, label: value }));
const MEASURE_PRIORITY_OPTIONS = ["Faible", "Moyenne", "Haute", "Critique"].map((value) => ({ value, label: value }));
const MEASURE_STATUS_OPTIONS = ["A faire", "En cours", "Fait"].map((value) => ({ value, label: value }));
const SOA_IMPLEMENTATION_OPTIONS = [
  { value: "implemente", label: "Implemente" },
  { value: "partiel", label: "Partiel" },
  { value: "planifie", label: "Planifie" },
  { value: "non_implemente", label: "Non implemente" },
];

function normalizeScale(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(4, Math.max(1, Math.round(numeric)));
}

function truncateLabel(value, max = 72) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeTreatmentValue(value) {
  const token = normalizeToken(value);
  if (!token) return "";
  if (token === "reduction") return "Reduction";
  if (token === "acceptation") return "Acceptation";
  if (token === "partage") return "Partage";
  if (token === "refus") return "Refus";
  return String(value || "").trim();
}

function decisionBadgeClass(decision) {
  const value = String(decision || "").trim();
  if (value === "Reduction") return "risk-cell-badge-warning";
  if (value === "Partage") return "risk-cell-badge-info";
  if (value === "Acceptation") return "risk-cell-badge-neutral";
  if (value === "Refus") return "risk-cell-badge-danger";
  return "risk-cell-badge-neutral";
}

const TECHNIQUE_CODE_PATTERN = /\bT\d{4}(?:\.\d{3})?\b/i;

function escapeForRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTechniqueCode(value) {
  const match = String(value || "").toUpperCase().match(TECHNIQUE_CODE_PATTERN);
  return match ? match[0] : "";
}

function extractTechniqueName(value, code) {
  const text = String(value || "").trim();
  if (!text || !code || text.toUpperCase() === code) return "";

  const withoutTrailingCode = text.replace(/\(\s*T\d{4}(?:\.\d{3})?\s*\)/i, "").trim();
  if (withoutTrailingCode && withoutTrailingCode.toUpperCase() !== code) return withoutTrailingCode;

  const leadingCodePattern = new RegExp(`^${escapeForRegex(code)}\\s*(?:[-:]\\s*)?`, "i");
  const afterLeadingCode = text.replace(leadingCodePattern, "").trim();
  const unwrapped = afterLeadingCode.replace(/^\((.*)\)$/, "$1").trim();
  if (unwrapped && unwrapped.toUpperCase() !== code) return unwrapped;

  return "";
}

function buildMitreTechniqueNameMap() {
  const map = new Map();
  MITRE_TACTICS.forEach((tactic) => {
    (tactic.techniques || []).forEach((entry) => {
      const code = extractTechniqueCode(entry);
      if (!code) return;
      const name = extractTechniqueName(entry, code);
      if (name) map.set(code, name);
    });
  });
  return map;
}

const MITRE_TECHNIQUE_NAMES = buildMitreTechniqueNameMap();

function normalizeTechniqueValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const code = extractTechniqueCode(raw);
  return code || raw;
}

function normalizeTechniqueList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const normalized = [];
  value.forEach((entry) => {
    const technique = normalizeTechniqueValue(entry);
    if (!technique || seen.has(technique)) return;
    seen.add(technique);
    normalized.push(technique);
  });
  return normalized;
}

function formatTechniqueLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const code = extractTechniqueCode(raw);
  if (!code) return raw;

  const explicitName = extractTechniqueName(raw, code);
  const catalogName = MITRE_TECHNIQUE_NAMES.get(code);
  const name = explicitName || catalogName;
  return name ? `${code} (${name})` : code;
}

function buildTechniqueOptions(modes) {
  const optionMap = new Map();
  const upsertOption = (value, label) => {
    const normalizedValue = normalizeTechniqueValue(value);
    if (!normalizedValue) return;
    const displayLabel = String(label || formatTechniqueLabel(normalizedValue)).trim() || normalizedValue;
    optionMap.set(normalizedValue, displayLabel);
  };

  Array.from(MITRE_TECHNIQUE_NAMES.entries()).forEach(([code, name]) => {
    upsertOption(code, `${code} (${name})`);
  });

  (modes || []).forEach((mode) => {
    (mode.technics || []).forEach((technique) => {
      upsertOption(technique, formatTechniqueLabel(technique));
    });
  });

  return Array.from(optionMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

function ContextEditor({ context, onSave, readOnly = false }) {
  const [draft, setDraft] = useState(context || {});

  return (
    <RiskCard>
      <RiskSectionHeader title="Contexte de l'etude" subtitle="Edition des informations generales de l'atelier" />
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.description || ""} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Perimetre</label>
          <input disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.perimeter || ""} onChange={(event) => setDraft((prev) => ({ ...prev, perimeter: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Environnement</label>
          <input disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.environment || ""} onChange={(event) => setDraft((prev) => ({ ...prev, environment: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Hypotheses</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.hypotheses || ""} onChange={(event) => setDraft((prev) => ({ ...prev, hypotheses: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Contraintes</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.constraints || ""} onChange={(event) => setDraft((prev) => ({ ...prev, constraints: event.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-200 p-4">
        <button type="button" disabled={readOnly} onClick={() => onSave(draft)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          Enregistrer le contexte
        </button>
      </div>
    </RiskCard>
  );
}

function MatrixCard({ title, children }) {
  return (
    <RiskCard>
      <RiskSectionHeader title={title} />
      <div className="p-5">{children}</div>
    </RiskCard>
  );
}

function getVisibleWorkshopSteps(study, workshopMeta) {
  if (!workshopMeta?.steps?.length) return [];
  if (workshopMeta.id !== 5) return workshopMeta.steps;

  const hiddenStepIds = new Set([
    "risk_map",
    "criteria",
    "residual_matrix",
    "governance",
    "protection",
    "defense",
    "resilience",
    "conformite",
  ]);

  return workshopMeta.steps.filter((step) => !hiddenStepIds.has(step.id));
}

function workshopStepRenderer({ study, workshopId, stepId, upsert, remove, updateContext, readOnly, riskOwners }) {
  const w1 = study.workshop1;
  const w2 = study.workshop2;
  const w3 = study.workshop3;
  const w4 = study.workshop4;
  const w5 = study.workshop5;

  const missionOptions = (w1.missions || []).map((mission) => ({ value: mission.id, label: mission.name }));
  const businessValueOptions = (w1.businessValues || []).map((value) => ({ value: value.id, label: value.name }));
  const fearedOptions = (w1.fearedEvents || []).map((event) => ({ value: event.id, label: event.description?.slice(0, 45) || "Evenement" }));
  const sourceOptions = (w2.riskSources || []).map((source) => ({ value: source.id, label: source.name }));
  const objectiveOptions = (w2.targetObjectives || []).map((objective) => ({ value: objective.id, label: objective.name }));
  const pairOptions = (w2.sourceObjectivePairs || [])
    .filter((pair) => pair.retained === true || pair.retained === "true")
    .map((pair) => {
      const source = w2.riskSources.find((entry) => entry.id === pair.riskSourceId);
      const objective = w2.targetObjectives.find((entry) => entry.id === pair.targetObjectiveId);
      return { value: pair.id, label: `${source?.name || "Source"} -> ${objective?.name || "Objectif"}` };
    });
  const stakeholderOptions = (w3.stakeholders || []).map((stakeholder) => ({ value: stakeholder.id, label: stakeholder.name }));
  const strategicScenarioOptions = (w3.strategicScenarios || []).map((scenario) => ({ value: scenario.id, label: scenario.name }));
  const strategicScenarioLabelById = new Map((w3.strategicScenarios || []).map((scenario) => [scenario.id, scenario.name]));
  const operationalModeOptions = (w4.operationalModes || []).map((mode) => {
    const scenarioLabel = strategicScenarioLabelById.get(mode.strategicScenarioId);
    return {
      value: mode.id,
      label: scenarioLabel ? `${mode.name} (${scenarioLabel})` : mode.name,
      strategicScenarioId: mode.strategicScenarioId,
    };
  });
  const supportingAssetOptions = (w1.supportingAssets || []).map((asset) => ({ value: asset.id, label: asset.name }));
  const operationalScenarioOptions = (w4.operationalScenarios || []).map((scenario) => ({ value: scenario.id, label: scenario.name }));
  const riskEntryOptions = (w5.riskEntries || []).map((risk) => ({ value: risk.id, label: w4.operationalScenarios.find((scenario) => scenario.id === risk.operationalScenarioId)?.name || "Risque" }));
  const measureOptions = (w5.measures || []).map((measure) => ({ value: measure.id, label: measure.name }));
  const ownerNameById = new Map((riskOwners || []).map((owner) => [owner.id, owner.name]));
  const ownerOptionsMap = new Map(
    (riskOwners || []).map((owner) => [owner.id, owner.email ? `${owner.name} (${owner.email})` : owner.name]),
  );
  (w5.riskEntries || []).forEach((entry) => {
    const ownerId = String(entry?.ownerUserId || "").trim();
    if (!ownerId || ownerOptionsMap.has(ownerId)) return;
    ownerOptionsMap.set(ownerId, entry.ownerName || ownerId);
  });
  const ownerOptions = Array.from(ownerOptionsMap.entries()).map(([value, label]) => ({ value, label }));

  if (workshopId === 1 && stepId === "team") {
    return (
      <RiskCrudTable
        title="Equipe et Responsabilites"
        subtitle="Definir les membres de l'etude"
        rows={w1.team || []}
        columns={[
          { key: "role", label: "Role" },
          { key: "name", label: "Nom" },
          { key: "responsibility", label: "Responsabilite" },
          { key: "contact", label: "Contact" },
        ]}
        fields={[
          { key: "role", label: "Role", type: "select", required: true, options: TEAM_ROLE_OPTIONS },
          { key: "name", label: "Nom", required: true },
          { key: "responsibility", label: "Responsabilite", required: true, full: true },
          { key: "contact", label: "Contact" },
        ]}
        onSave={(item) => upsert(1, "team", item)}
        onDelete={(id) => remove(1, "team", id)}
        deleteConfirmMessage={(row) => `Supprimer le membre "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un membre"
      />
    );
  }

  if (workshopId === 1 && stepId === "context") {
    return <ContextEditor context={w1.context} onSave={(ctx) => updateContext(1, ctx)} readOnly={readOnly} />;
  }

  if (workshopId === 1 && stepId === "missions") {
    return (
      <div className="space-y-4">
        <RiskCrudTable
          title="Missions"
          subtitle="Identifier les missions du perimetre"
          rows={w1.missions || []}
          columns={[{ key: "name", label: "Mission" }, { key: "description", label: "Description" }]}
          fields={[
            { key: "name", label: "Mission", required: true },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
          onSave={(item) => upsert(1, "missions", item)}
          onDelete={(id) => remove(1, "missions", id)}
          deleteConfirmMessage={(row) => `Supprimer la mission "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une mission"
        />
        <RiskCrudTable
          title="Valeurs Metier"
          subtitle="Lier les valeurs metier aux missions"
          rows={w1.businessValues || []}
          columns={[
            {
              key: "missionId",
              label: "Mission",
              render: (row) => w1.missions.find((mission) => mission.id === row.missionId)?.name || "-",
            },
            { key: "name", label: "Valeur" },
            { key: "type", label: "Type" },
            { key: "description", label: "Description" },
          ]}
          fields={[
            { key: "missionId", label: "Mission", type: "select", required: true, options: missionOptions },
            { key: "name", label: "Valeur metier", required: true },
            { key: "type", label: "Type", type: "select", required: true, options: BUSINESS_VALUE_TYPE_OPTIONS },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
          onSave={(item) => upsert(1, "businessValues", item)}
          onDelete={(id) => remove(1, "businessValues", id)}
          deleteConfirmMessage={(row) => `Supprimer la valeur metier "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une valeur"
        />
      </div>
    );
  }
  if (workshopId === 1 && stepId === "assets") {
    return (
      <RiskCrudTable
        title="Biens supports"
        subtitle="Associer les biens supports aux valeurs metier"
        rows={w1.supportingAssets || []}
        columns={[
          {
            key: "businessValueId",
            label: "Valeur metier",
            render: (row) => w1.businessValues.find((value) => value.id === row.businessValueId)?.name || "-",
          },
          { key: "name", label: "Bien" },
          { key: "type", label: "Type" },
          { key: "location", label: "Localisation" },
          { key: "criticality", label: "Criticite" },
        ]}
        fields={[
          { key: "businessValueId", label: "Valeur metier", type: "select", required: true, options: businessValueOptions },
          { key: "name", label: "Bien support", required: true },
          { key: "type", label: "Type", type: "select", required: true, options: SUPPORTING_ASSET_TYPE_OPTIONS },
          { key: "location", label: "Localisation" },
          {
            key: "criticality",
            label: "Criticite",
            type: "select",
            required: true,
            options: CRITICALITY_OPTIONS,
          },
        ]}
        onSave={(item) => upsert(1, "supportingAssets", item)}
        onDelete={(id) => remove(1, "supportingAssets", id)}
        deleteConfirmMessage={(row) => `Supprimer le bien support "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un bien"
      />
    );
  }

  if (workshopId === 1 && stepId === "feared") {
    return (
      <RiskCrudTable
        title="Evenements redoutes"
        subtitle="Evaluer les impacts redoutes"
        rows={w1.fearedEvents || []}
        columns={[
          {
            key: "businessValueId",
            label: "Valeur metier",
            render: (row) => w1.businessValues.find((value) => value.id === row.businessValueId)?.name || "-",
          },
          { key: "description", label: "Evenement" },
          { key: "impact", label: "Impact" },
          { key: "gravity", label: "Gravite", render: (row) => `G${row.gravity} - ${G_LABELS[row.gravity] || "-"}` },
        ]}
        fields={[
          { key: "businessValueId", label: "Valeur metier", type: "select", required: true, options: businessValueOptions },
          { key: "description", label: "Evenement", required: true, full: true },
          { key: "impact", label: "Impact", type: "textarea", full: true },
          {
            key: "gravity",
            label: "Gravite",
            type: "select",
            required: true,
            options: GRAVITY_OPTIONS,
          },
        ]}
        onSave={(item) => upsert(1, "fearedEvents", { ...item, gravity: normalizeScale(item.gravity) })}
        onDelete={(id) => remove(1, "fearedEvents", id)}
        deleteConfirmMessage={(row) => `Supprimer l'evenement "${row?.description || "sans description"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un evenement"
      />
    );
  }

  if (workshopId === 1 && stepId === "iso") {
    return (
      <RiskCrudTable
        title="Controles ISO 27001:2022"
        rows={w1.isoControls || []}
        columns={[
          { key: "reference", label: "Reference" },
          { key: "name", label: "Controle" },
          { key: "status", label: "Statut" },
          { key: "comments", label: "Commentaires" },
        ]}
        fields={[
          { key: "reference", label: "Reference", required: true },
          { key: "name", label: "Controle", required: true, full: true },
          {
            key: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: ISO_STATUS_OPTIONS,
          },
          { key: "comments", label: "Commentaires", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(1, "isoControls", item)}
        onDelete={(id) => remove(1, "isoControls", id)}
        deleteConfirmMessage={(row) => `Supprimer le controle "${row?.reference || row?.name || "sans reference"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un controle"
      />
    );
  }

  if (workshopId === 2 && stepId === "pairs") {
    return (
      <RiskCrudTable
        title="Identification des couples"
        rows={w2.sourceObjectivePairs || []}
        columns={[
          { key: "riskSourceId", label: "Source", render: (row) => w2.riskSources.find((source) => source.id === row.riskSourceId)?.name || "-" },
          { key: "targetObjectiveId", label: "Objectif", render: (row) => w2.targetObjectives.find((objective) => objective.id === row.targetObjectiveId)?.name || "-" },
          { key: "retained", label: "Pertinent", render: (row) => (row.retained ? "Oui" : "Non") },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          { key: "riskSourceId", label: "Source", type: "select", required: true, options: sourceOptions },
          {
            key: "targetObjectiveId",
            label: "Objectif",
            type: "select",
            required: true,
            options: objectiveOptions,
            validate: (value, draft) => {
              if (!draft?.riskSourceId || !value) return "";
              const duplicate = (w2.sourceObjectivePairs || []).some(
                (pair) =>
                  pair.riskSourceId === draft.riskSourceId
                  && pair.targetObjectiveId === value
                  && pair.id !== draft.id,
              );
              return duplicate ? "Ce couple Source / Objectif existe deja." : "";
            },
          },
          { key: "retained", label: "Pertinence", type: "select", required: true, options: [{ value: "true", label: "Pertinent" }, { value: "false", label: "Non pertinent" }] },
          {
            key: "justification",
            label: "Justification",
            type: "textarea",
            full: true,
            requiredWhen: (draft) => draft?.retained === "false" || draft?.retained === false,
            requiredMessage: "La justification est obligatoire pour un couple non pertinent.",
          },
        ]}
        onSave={(item) => upsert(2, "sourceObjectivePairs", { ...item, retained: item.retained === true || item.retained === "true" })}
        onDelete={(id) => remove(2, "sourceObjectivePairs", id)}
        deleteConfirmMessage="Supprimer ce couple source/objectif ?"
        readOnly={readOnly}
        addLabel="Ajouter un couple"
      />
    );
  }

  if (workshopId === 2 && stepId === "matrix") {
    return (
      <MatrixCard title="Tableau de Reference (Pertinence)">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Source / Objectif</th>
                {(w2.targetObjectives || []).map((objective) => (
                  <th key={objective.id} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{objective.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(w2.riskSources || []).map((source) => (
                <tr key={source.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-semibold text-slate-800">{source.name}</td>
                  {(w2.targetObjectives || []).map((objective) => {
                    const pair = (w2.sourceObjectivePairs || []).find((entry) => entry.riskSourceId === source.id && entry.targetObjectiveId === objective.id);
                    const value = pair ? (pair.retained ? "Oui" : "Non") : "-";
                    return (
                      <td key={`${source.id}-${objective.id}`} className="px-3 py-2 text-sm text-slate-700">
                        <span className={`risk-cell-badge ${value === "Oui" ? "risk-cell-badge-success" : "risk-cell-badge-neutral"}`}>{value}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 2 && stepId === "sources") {
    return (
      <div className="space-y-4">
        <RiskCrudTable
          title="Caracterisation des Sources de Risque"
          rows={w2.riskSources || []}
          columns={[{ key: "name", label: "Source" }, { key: "type", label: "Type" }, { key: "motivation", label: "Motivation" }, { key: "capability", label: "Capacite" }]}
          fields={[
            { key: "name", label: "Source", required: true },
            { key: "type", label: "Type", type: "select", required: true, options: RISK_SOURCE_TYPE_OPTIONS },
            { key: "motivation", label: "Motivation", type: "textarea", full: true },
            { key: "capability", label: "Capacite", type: "select", options: SCALE_1_4_OPTIONS, required: true },
          ]}
          onSave={(item) => upsert(2, "riskSources", { ...item, capability: normalizeScale(item.capability) })}
          onDelete={(id) => remove(2, "riskSources", id)}
          deleteConfirmMessage={(row) => `Supprimer la source "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une source"
        />
        <RiskCrudTable
          title="Objectifs vises"
          rows={w2.targetObjectives || []}
          columns={[
            { key: "name", label: "Objectif" },
            { key: "description", label: "Description" },
            {
              key: "fearedEventIds",
              label: "Evenements associes",
              render: (row) => {
                const names = (row.fearedEventIds || [])
                  .map((eventId) => w1.fearedEvents.find((event) => event.id === eventId)?.description)
                  .filter(Boolean);
                if (!names.length) return "-";
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {names.map((name, index) => (
                      <span
                        key={`${row.id || "objectif"}-event-${index}`}
                        className="risk-cell-badge risk-cell-badge-info"
                        title={name}
                      >
                        {truncateLabel(name)}
                      </span>
                    ))}
                  </div>
                );
              },
            },
          ]}
          fields={[
            { key: "name", label: "Objectif", required: true },
            { key: "description", label: "Description", type: "textarea", full: true },
            { key: "fearedEventIds", label: "Evenements redoutes associes", type: "multiselect", options: fearedOptions, full: true },
          ]}
          onSave={(item) => upsert(2, "targetObjectives", item)}
          onDelete={(id) => remove(2, "targetObjectives", id)}
          deleteConfirmMessage={(row) => `Supprimer l'objectif "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter un objectif"
        />
      </div>
    );
  }
  if (workshopId === 3 && stepId === "stakeholder_matrix") {
    return (
      <MatrixCard title="Matrice de Criticite des Parties Prenantes">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Partie prenante</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Exposition</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Fiabilite</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Zone</th>
              </tr>
            </thead>
            <tbody>
              {(w3.stakeholders || []).map((stakeholder) => {
                const score = Number(stakeholder.exposure || 1) * Number(stakeholder.reliability || 1);
                const zone = score >= 9 ? "Critique" : score >= 6 ? "Elevee" : score >= 3 ? "Moderee" : "Faible";
                return (
                  <tr key={stakeholder.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-semibold text-slate-800">{stakeholder.name}</td>
                    <td className="px-3 py-2 text-slate-600"><span className="risk-cell-badge risk-cell-badge-info">{stakeholder.type || "-"}</span></td>
                    <td className="px-3 py-2 text-slate-600"><span className={`risk-cell-badge ${Number(stakeholder.exposure || 1) >= 4 ? "risk-cell-badge-danger" : Number(stakeholder.exposure || 1) >= 3 ? "risk-cell-badge-orange" : Number(stakeholder.exposure || 1) >= 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{stakeholder.exposure || "-"}/4</span></td>
                    <td className="px-3 py-2 text-slate-600"><span className={`risk-cell-badge ${Number(stakeholder.reliability || 1) >= 4 ? "risk-cell-badge-danger" : Number(stakeholder.reliability || 1) >= 3 ? "risk-cell-badge-orange" : Number(stakeholder.reliability || 1) >= 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{stakeholder.reliability || "-"}/4</span></td>
                    <td className="px-3 py-2 text-slate-700"><span className={`risk-cell-badge ${zone === "Critique" ? "risk-cell-badge-danger" : zone === "Elevee" ? "risk-cell-badge-orange" : zone === "Moderee" ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{zone}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 3 && stepId === "threat_zones") {
    return (
      <MatrixCard title="Zones de menace des parties prenantes">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { label: "Zone critique", min: 9, max: 16, tone: "border-red-200 bg-red-50 text-red-700" },
            { label: "Zone elevee", min: 6, max: 8, tone: "border-amber-200 bg-amber-50 text-amber-700" },
            { label: "Zone moderee", min: 3, max: 5, tone: "border-blue-200 bg-blue-50 text-blue-700" },
            { label: "Zone faible", min: 1, max: 2, tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          ].map((zone) => {
            const people = (w3.stakeholders || []).filter((stakeholder) => {
              const score = Number(stakeholder.exposure || 1) * Number(stakeholder.reliability || 1);
              return score >= zone.min && score <= zone.max;
            });
            return (
              <div key={zone.label} className={`rounded-xl border p-4 ${zone.tone}`}>
                <div className="text-sm font-bold">{zone.label}</div>
                <div className="mt-2 flex flex-wrap gap-2">{people.length ? people.map((p) => <span key={p.id} className="rounded-full border border-current/30 bg-white/80 px-2 py-1 text-xs font-semibold">{p.name}</span>) : <span className="text-xs">Aucune partie prenante</span>}</div>
              </div>
            );
          })}
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 3 && stepId === "stakeholders") {
    return (
      <RiskCrudTable
        title="Parties prenantes"
        rows={w3.stakeholders || []}
        columns={[{ key: "name", label: "Nom" }, { key: "type", label: "Type" }, { key: "exposure", label: "Exposition" }, { key: "reliability", label: "Fiabilite" }, { key: "access", label: "Acces" }]}
        fields={[
          { key: "name", label: "Nom", required: true },
          { key: "type", label: "Type", type: "select", required: true, options: STAKEHOLDER_TYPE_OPTIONS },
          { key: "exposure", label: "Exposition", type: "select", required: true, options: SCALE_1_4_OPTIONS },
          { key: "reliability", label: "Fiabilite", type: "select", required: true, options: SCALE_1_4_OPTIONS },
          { key: "access", label: "Acces", type: "select", required: true, options: STAKEHOLDER_ACCESS_OPTIONS },
        ]}
        onSave={(item) => upsert(3, "stakeholders", { ...item, exposure: normalizeScale(item.exposure), reliability: normalizeScale(item.reliability) })}
        onDelete={(id) => remove(3, "stakeholders", id)}
        deleteConfirmMessage={(row) => `Supprimer la partie prenante "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une partie prenante"
      />
    );
  }

  if (workshopId === 3 && stepId === "strategic") {
    const pairLabelById = (pairId) => {
      const pair = (w2.sourceObjectivePairs || []).find((entry) => entry.id === pairId);
      if (!pair) return "-";
      const source = w2.riskSources.find((entry) => entry.id === pair.riskSourceId)?.name || "Source";
      const objective = w2.targetObjectives.find((entry) => entry.id === pair.targetObjectiveId)?.name || "Objectif";
      return `${source} -> ${objective}`;
    };

    return (
      <RiskCrudTable
        title="Scenarios strategiques"
        rows={w3.strategicScenarios || []}
        columns={[
          { key: "name", label: "Scenario" },
          { key: "coupleId", label: "Couple SR/OV", render: (row) => pairLabelById(row.coupleId) },
          {
            key: "stakeholderIds",
            label: "Parties prenantes",
            render: (row) => {
              const names = (row.stakeholderIds || [])
                .map((id) => w3.stakeholders.find((item) => item.id === id)?.name)
                .filter(Boolean);
              if (!names.length) return "-";
              return (
                <div className="flex flex-wrap gap-1.5">
                  {names.map((name, index) => (
                    <span key={`${row.id || "scenario"}-stakeholder-${index}`} className="risk-cell-badge risk-cell-badge-info" title={name}>
                      {truncateLabel(name, 48)}
                    </span>
                  ))}
                </div>
              );
            },
          },
          { key: "gravity", label: "Gravite" },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "name", label: "Scenario", required: true, full: true },
          { key: "coupleId", label: "Couple SR/OV", type: "select", required: true, options: pairOptions },
          { key: "gravity", label: "Gravite", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "stakeholderIds", label: "Parties prenantes", type: "multiselect", options: stakeholderOptions, required: true, full: true },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(3, "strategicScenarios", { ...item, gravity: normalizeScale(item.gravity) })}
        onDelete={(id) => remove(3, "strategicScenarios", id)}
        deleteConfirmMessage={(row) => `Supprimer le scenario strategique "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un scenario"
      />
    );
  }

  if (workshopId === 3 && stepId === "strategic_treat") {
    return (
      <RiskCrudTable
        title="Traitement des risques strategiques"
        rows={w3.treatments || []}
        columns={[
          {
            key: "scenarioId",
            label: "Scenario",
            render: (row) => {
              const label = w3.strategicScenarios.find((entry) => entry.id === row.scenarioId)?.name || "-";
              if (label === "-") return "-";
              return <span className="risk-cell-badge risk-cell-badge-info" title={label}>{truncateLabel(label, 56)}</span>;
            },
          },
          {
            key: "decision",
            label: "Decision",
            render: (row) => {
              const decision = row.decision || "-";
              if (decision === "-") return "-";
              return <span className={`risk-cell-badge ${decisionBadgeClass(decision)}`}>{decision}</span>;
            },
          },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          {
            key: "scenarioId",
            label: "Scenario",
            type: "select",
            required: true,
            options: strategicScenarioOptions,
            validate: (value, draft) => {
              if (!value) return "";
              const duplicate = (w3.treatments || []).some((item) => item.scenarioId === value && item.id !== draft.id);
              return duplicate ? "Un traitement existe deja pour ce scenario." : "";
            },
          },
          { key: "decision", label: "Decision", type: "select", required: true, options: TREATMENT_OPTIONS },
          { key: "justification", label: "Justification", type: "textarea", required: true, full: true },
        ]}
        onSave={(item) => upsert(3, "treatments", item)}
        onDelete={(id) => remove(3, "treatments", id)}
        deleteConfirmMessage="Supprimer ce traitement strategique ?"
        readOnly={readOnly}
        addLabel="Ajouter un traitement"
      />
    );
  }

  if (workshopId === 4 && stepId === "likelihood_scale") {
    return (
      <MatrixCard title="Echelle de calcul de vraisemblance">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Niveau</th><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Libelle</th><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Description</th></tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((v) => (
                <tr key={v} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-semibold text-slate-800"><span className={`risk-cell-badge ${v === 4 ? "risk-cell-badge-danger" : v === 3 ? "risk-cell-badge-orange" : v === 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>V{v}</span></td>
                  <td className="px-3 py-2 text-slate-700"><span className={`risk-cell-badge ${v === 4 ? "risk-cell-badge-danger" : v === 3 ? "risk-cell-badge-orange" : v === 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{V_LABELS[v]}</span></td>
                  <td className="px-3 py-2 text-slate-600">{v === 1 ? "Attaque peu probable" : v === 2 ? "Attaque possible" : v === 3 ? "Attaque probable" : "Attaque tres probable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 4 && stepId === "op_modes") {
    const operationalModeRows = (w4.operationalModes || []).map((mode) => ({
      ...mode,
      technics: normalizeTechniqueList(mode.technics),
    }));
    const techniqueOptions = buildTechniqueOptions(operationalModeRows);
    const techniqueLabelByValue = new Map(techniqueOptions.map((option) => [option.value, option.label]));

    return (
      <RiskCrudTable
        title="Modes operatoires"
        rows={operationalModeRows}
        columns={[
          { key: "name", label: "Mode" },
          { key: "strategicScenarioId", label: "Scenario strategique", render: (row) => w3.strategicScenarios.find((entry) => entry.id === row.strategicScenarioId)?.name || "-" },
          {
            key: "technics",
            label: "Techniques",
            render: (row) => {
              const labels = normalizeTechniqueList(row.technics)
                .map((technique) => techniqueLabelByValue.get(technique) || formatTechniqueLabel(technique))
                .filter(Boolean);
              return labels.length ? labels : "-";
            },
          },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "name", label: "Mode", required: true },
          { key: "strategicScenarioId", label: "Scenario strategique", type: "select", required: true, options: strategicScenarioOptions },
          {
            key: "technics",
            label: `Techniques (${techniqueOptions.length})`,
            type: "multiselect",
            options: techniqueOptions,
            searchPlaceholder: "Rechercher un code ou libelle MITRE...",
          },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(4, "operationalModes", { ...item, technics: normalizeTechniqueList(item.technics) })}
        onDelete={(id) => remove(4, "operationalModes", id)}
        deleteConfirmMessage={(row) => `Supprimer le mode operatoire "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un mode"
      />
    );
  }
  if (workshopId === 4 && stepId === "op_scenarios") {
    const modeLabelById = (modeId) => w4.operationalModes.find((entry) => entry.id === modeId)?.name;
    const assetLabelById = (assetId) => w1.supportingAssets.find((entry) => entry.id === assetId)?.name;
    const renderTagList = (labels) => {
      if (!labels.length) return "-";
      return (
        <div className="risk-cell-tag-list">
          {labels.map((label) => (
            <span key={label} className="risk-cell-tag">{label}</span>
          ))}
        </div>
      );
    };

    return (
      <RiskCrudTable
        title="Scenarios operationnels"
        rows={w4.operationalScenarios || []}
        columns={[
          { key: "name", label: "Scenario" },
          { key: "description", label: "Description", render: (row) => truncateLabel(row.description || "-", 110) },
          { key: "strategicScenarioId", label: "Scenario strategique", render: (row) => w3.strategicScenarios.find((entry) => entry.id === row.strategicScenarioId)?.name || "-" },
          {
            key: "operationalModeIds",
            label: "Modes operatoires",
            render: (row) => {
              const labels = (row.operationalModeIds || []).map((id) => modeLabelById(id)).filter(Boolean);
              return renderTagList(labels);
            },
          },
          {
            key: "supportingAssetIds",
            label: "Biens supports",
            render: (row) => {
              const labels = (row.supportingAssetIds || []).map((id) => assetLabelById(id)).filter(Boolean);
              return renderTagList(labels);
            },
          },
          { key: "likelihood", label: "Vraisemblance", render: (row) => `V${row.likelihood} - ${V_LABELS[row.likelihood] || "-"}` },
        ]}
        fields={[
          { key: "name", label: "Scenario", required: true, full: true },
          { key: "strategicScenarioId", label: "Scenario strategique", type: "select", required: true, options: strategicScenarioOptions },
          {
            key: "operationalModeIds",
            label: "Modes operatoires",
            type: "multiselect",
            options: (draft) => {
              const scenarioId = draft?.strategicScenarioId;
              const filtered = scenarioId
                ? operationalModeOptions.filter((option) => option.strategicScenarioId === scenarioId)
                : operationalModeOptions;
              return filtered.map((option) => ({ value: option.value, label: option.label }));
            },
            required: true,
            full: true,
            searchPlaceholder: "Rechercher un mode operatoire...",
            validate: (value, draft) => {
              if (!Array.isArray(value) || !value.length) return "";
              if (!draft?.strategicScenarioId) return "";
              const invalid = value.some((modeId) => {
                const mode = w4.operationalModes.find((entry) => entry.id === modeId);
                return mode && mode.strategicScenarioId !== draft.strategicScenarioId;
              });
              return invalid ? "Les modes operatoires doivent appartenir au meme scenario strategique." : "";
            },
          },
          { key: "supportingAssetIds", label: "Biens supports", type: "multiselect", options: supportingAssetOptions, full: true },
          { key: "likelihood", label: "Vraisemblance", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(4, "operationalScenarios", {
          ...item,
          likelihood: normalizeScale(item.likelihood),
          operationalModeIds: (item.operationalModeIds || []).filter((modeId) => {
            const mode = w4.operationalModes.find((entry) => entry.id === modeId);
            return mode && mode.strategicScenarioId === item.strategicScenarioId;
          }),
        })}
        onDelete={(id) => remove(4, "operationalScenarios", id)}
        deleteConfirmMessage={(row) => `Supprimer le scenario operationnel "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un scenario"
      />
    );
  }

  if (workshopId === 5 && stepId === "risk_register") {
    return (
      <RiskCrudTable
        title="Registre des Risques"
        rows={w5.riskEntries || []}
        columns={[
          { key: "operationalScenarioId", label: "Scenario", render: (row) => w4.operationalScenarios.find((entry) => entry.id === row.operationalScenarioId)?.name || "-" },
          { key: "gravity", label: "Gravite", render: (row) => `G${row.gravity} - ${G_LABELS[row.gravity] || "-"}` },
          { key: "likelihood", label: "Vraisemblance", render: (row) => `V${row.likelihood} - ${V_LABELS[row.likelihood] || "-"}` },
          { key: "level", label: "Niveau", render: (row) => `${riskLevel(row.gravity, row.likelihood).label} (${riskLevel(row.gravity, row.likelihood).score})` },
          { key: "status", label: "Statut", render: (row) => riskEntryStatusLabel(row.status) },
          { key: "ownerUserId", label: "Responsable", render: (row) => ownerNameById.get(row.ownerUserId) || row.ownerName || "-" },
          { key: "treatment", label: "Traitement", render: (row) => TREATMENT_LABEL_BY_VALUE.get(normalizeTreatmentValue(row.treatment)) || row.treatment || "-" },
          { key: "notes", label: "Notes", render: (row) => truncateLabel(row.notes || "-", 110) },
        ]}
        fields={[
          { key: "operationalScenarioId", label: "Scenario operationnel", type: "select", required: true, options: operationalScenarioOptions },
          { key: "gravity", label: "Gravite", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "likelihood", label: "Vraisemblance", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "status", label: "Statut", type: "select", required: true, options: RISK_ENTRY_STATUS_OPTIONS },
          {
            key: "ownerUserId",
            label: "Responsable",
            type: "select",
            options: ownerOptions,
            requiredWhen: (draft) => ["en_traitement", "traite", "accepte"].includes(normalizeRiskEntryStatus(draft.status)),
            validate: (value, draft) => {
              const status = normalizeRiskEntryStatus(draft.status);
              if (["en_traitement", "traite", "accepte"].includes(status) && !String(value || "").trim()) {
                return "Le responsable est requis pour ce statut.";
              }
              return "";
            },
          },
          { key: "treatment", label: "Traitement", type: "select", required: true, options: TREATMENT_OPTIONS },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(5, "riskEntries", {
          ...item,
          gravity: normalizeScale(item.gravity),
          likelihood: normalizeScale(item.likelihood),
          status: normalizeRiskEntryStatus(item.status),
          ownerUserId: String(item.ownerUserId || "").trim(),
          ownerName: ownerNameById.get(String(item.ownerUserId || "").trim()) || "",
          treatment: normalizeTreatmentValue(item.treatment),
        })}
        onDelete={(id) => remove(5, "riskEntries", id)}
        deleteConfirmMessage="Supprimer cette entree du registre des risques ?"
        readOnly={readOnly}
        addLabel="Ajouter un risque"
      />
    );
  }

  if (workshopId === 5 && stepId === "risk_map") {
    return <MatrixCard title="Matrice de Risque / Cartographie"><p className="text-sm text-slate-600">La cartographie est calculee automatiquement a partir du registre des risques (gravite x vraisemblance).</p></MatrixCard>;
  }
  if (workshopId === 5 && stepId === "criteria") {
    return <MatrixCard title="Tableau des Criteres de Traitement"><p className="text-sm text-slate-600">Les criteres de traitement sont derives du registre des risques et des decisions associees.</p></MatrixCard>;
  }
  if (workshopId === 5 && stepId === "residual_matrix") {
    return <MatrixCard title="Matrice des Risques Residuels"><p className="text-sm text-slate-600">La matrice residuelle est calculee a partir des risques residuels saisis.</p></MatrixCard>;
  }

  if (workshopId === 5 && ["measures", "governance", "protection", "defense", "resilience", "conformite"].includes(stepId)) {
    const categoryMap = { governance: "Gouvernance", protection: "Protection", defense: "Defense", resilience: "Resilience", conformite: "Conformite" };
    const filtered = stepId === "measures" ? w5.measures || [] : (w5.measures || []).filter((entry) => entry.category === categoryMap[stepId]);
    return (
      <RiskCrudTable
        title={stepId === "measures" ? "Tableau des Mesures de Securite" : categoryMap[stepId]}
        rows={filtered}
        columns={[{ key: "category", label: "Categorie" }, { key: "name", label: "Mesure" }, { key: "priority", label: "Priorite" }, { key: "status", label: "Statut" }]}
        fields={[
          { key: "category", label: "Categorie", type: "select", required: true, options: MEASURE_CATEGORIES.map((value) => ({ value, label: value })) },
          { key: "name", label: "Mesure", required: true, full: true },
          { key: "description", label: "Description", type: "textarea", full: true },
          { key: "priority", label: "Priorite", type: "select", required: true, options: MEASURE_PRIORITY_OPTIONS },
          { key: "status", label: "Statut", type: "select", required: true, options: MEASURE_STATUS_OPTIONS },
        ]}
        onSave={(item) => upsert(5, "measures", item)}
        onDelete={(id) => remove(5, "measures", id)}
        deleteConfirmMessage={(row) => `Supprimer la mesure "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une mesure"
      />
    );
  }

  if (workshopId === 5 && stepId === "soa") {
    return (
      <RiskCrudTable
        title="SoA minimal"
        subtitle="Applicabilite des controles et lien avec les mesures de traitement."
        rows={w5.soa || []}
        columns={[
          { key: "reference", label: "Reference" },
          { key: "objective", label: "Objectif" },
          { key: "applicable", label: "Applicable", render: (row) => (row.applicable === "oui" ? "Oui" : "Non") },
          { key: "implementationStatus", label: "Mise en oeuvre" },
        ]}
        fields={[
          { key: "reference", label: "Reference controle", required: true, placeholder: "Ex: A.5.1" },
          { key: "objective", label: "Objectif", required: true, full: true },
          { key: "applicable", label: "Applicable", type: "select", required: true, options: YES_NO_OPTIONS },
          {
            key: "justification",
            label: "Justification",
            type: "textarea",
            full: true,
            requiredWhen: (draft) => draft?.applicable === "non",
            requiredMessage: "La justification est obligatoire quand le controle n'est pas applicable.",
          },
          { key: "implementationStatus", label: "Mise en oeuvre", type: "select", required: true, options: SOA_IMPLEMENTATION_OPTIONS },
          { key: "linkedMeasureIds", label: "Mesures associees", type: "multiselect", options: measureOptions, full: true },
        ]}
        onSave={(item) => upsert(5, "soa", item)}
        onDelete={(id) => remove(5, "soa", id)}
        deleteConfirmMessage={(row) => `Supprimer l'entree SoA "${row?.reference || "sans reference"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une entree SoA"
      />
    );
  }

  if (workshopId === 5 && stepId === "residual_form") {
    return (
      <RiskCrudTable
        title="Risques residuels"
        rows={w5.residualRisks || []}
        columns={[
          { key: "riskEntryId", label: "Risque", render: (row) => w4.operationalScenarios.find((scenario) => scenario.id === w5.riskEntries.find((risk) => risk.id === row.riskEntryId)?.operationalScenarioId)?.name || "-" },
          { key: "residualGravity", label: "Gravite", render: (row) => `G${row.residualGravity} - ${G_LABELS[row.residualGravity] || "-"}` },
          { key: "residualLikelihood", label: "Vraisemblance", render: (row) => `V${row.residualLikelihood} - ${V_LABELS[row.residualLikelihood] || "-"}` },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          { key: "riskEntryId", label: "Risque reference", type: "select", required: true, options: riskEntryOptions },
          { key: "residualGravity", label: "Gravite residuelle", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "residualLikelihood", label: "Vraisemblance residuelle", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "justification", label: "Justification", type: "textarea", required: true, full: true },
        ]}
        onSave={(item) => upsert(5, "residualRisks", { ...item, residualGravity: normalizeScale(item.residualGravity), residualLikelihood: normalizeScale(item.residualLikelihood) })}
        onDelete={(id) => remove(5, "residualRisks", id)}
        deleteConfirmMessage="Supprimer ce risque residuel ?"
        readOnly={readOnly}
        addLabel="Ajouter un risque residuel"
      />
    );
  }

  return <RiskCard className="p-8 text-center text-sm text-slate-500">Etape non disponible pour cet atelier.</RiskCard>;
}

export default function RiskWorkshopPage() {
  const navigate = useNavigate();
  const { id, atelierId } = useParams();
  const workshopId = Number(atelierId);

  const { getStudyById, updateWorkshopContext, upsertWorkshopItem, deleteWorkshopItem, owners, refreshOwners, loading } = useRiskStudies();
  const study = getStudyById(id);
  const workshopMeta = getWorkshopMeta(workshopId);
  const visibleSteps = useMemo(() => getVisibleWorkshopSteps(study, workshopMeta), [study, workshopMeta]);

  const [activeStep, setActiveStep] = useState(() => visibleSteps?.[0]?.id || workshopMeta?.steps?.[0]?.id || null);

  useEffect(() => {
    if (!visibleSteps?.length) {
      setActiveStep(null);
      return;
    }

    setActiveStep((prev) => {
      if (prev && visibleSteps.some((step) => step.id === prev)) return prev;
      return visibleSteps[0].id;
    });
  }, [visibleSteps]);

  useEffect(() => {
    if (Array.isArray(owners) && owners.length > 0) return;
    void refreshOwners();
  }, [owners, refreshOwners]);

  if (loading && !study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Chargement de l'atelier...</h2>
          <p className="mt-2 text-sm text-slate-500">Recuperation des donnees de l'etude en cours.</p>
        </RiskCard>
      </div>
    );
  }

  if (!study || !workshopMeta) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Atelier introuvable</h2>
          <button type="button" onClick={() => navigate("/risques")} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Retour
          </button>
        </RiskCard>
      </div>
    );
  }

  const status = getEffectiveWorkshopStatus(study, workshopId);
  const blocked = isWorkshopBlocked(study, workshopId);
  const progress = getWorkshopProgress(study, workshopId);
  const currentStep = visibleSteps.find((step) => step.id === activeStep) || visibleSteps[0];
  const stepCount = visibleSteps.length || 1;
  const stepIndex = Math.max(0, visibleSteps.findIndex((step) => step.id === currentStep.id));
  const prevStep = stepIndex > 0 ? visibleSteps[stepIndex - 1] : null;
  const nextStep = stepIndex < visibleSteps.length - 1 ? visibleSteps[stepIndex + 1] : null;
  const stepPathPct = Math.round(((stepIndex + 1) / stepCount) * 100);

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          variant="hero"
          title={workshopMeta.title}
          subtitle={workshopMeta.description}
          actions={(
            <>
              <button
                type="button"
                onClick={() => navigate(`/risques/etudes/${study.id}`)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={14} /> Retour etude
              </button>
              {status === "termine" ? (
                <button
                  type="button"
                  onClick={() => printWorkshopLivrable(study, workshopId)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <FileText size={14} /> Telecharger livrable
                </button>
              ) : null}
            </>
          )}
        />

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile label="Finalisation atelier" value={`${progress}%`} helper={`${stepCount} etapes`} primary progress={progress} />
            <RiskKpiTile label="Etape active" value={`${stepIndex + 1}/${stepCount}`} helper={currentStep.label} />
            <RiskKpiTile label="Etapes configurees" value={stepCount} helper={`Atelier ${workshopId}`} />
          </div>
        </div>

        <RiskCard className="risk-step-nav p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Parcours atelier</div>
          <div className="risk-workshop-step-summary mb-3">
            <div className="risk-workshop-step-summary-head">
              <span>Progression atelier</span>
              <span>{progress}%</span>
            </div>
            <div className="risk-workshop-step-summary-track">
              <span className="risk-workshop-step-summary-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="risk-step-list">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep.id === step.id;
              const isPassed = index < stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`risk-step-btn w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                    isActive
                      ? "risk-step-active"
                      : isPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="risk-step-index mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold">
                    {isPassed ? <Check size={11} /> : index + 1}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
        </RiskCard>

        <main className="space-y-4">
            {blocked ? (
              <RiskCallout tone="danger" title="Atelier bloque">
                Termine d'abord l'atelier precedent pour debloquer le workflow.
              </RiskCallout>
            ) : null}

            {workshopId === 5 && currentStep?.id === "risk_register" ? (
              <RiskCallout tone="info" title="Calcul automatique du niveau de risque">
                Le niveau est calcule automatiquement selon la formule Gravite x Vraisemblance.
              </RiskCallout>
            ) : null}

            <RiskCard className="risk-command-toolbar p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">Etape active</div>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{currentStep.label}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <RiskStatusBadge status={status} />
                </div>
              </div>

              <div className="risk-workshop-stepbar mt-3">
                <div className="risk-workshop-stepbar-head">
                  <span>Parcours interne</span>
                  <span>{stepIndex + 1}/{stepCount}</span>
                </div>
                <div className="risk-workshop-stepbar-track">
                  <span className="risk-workshop-stepbar-fill" style={{ width: `${stepPathPct}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!prevStep}
                    onClick={() => prevStep && setActiveStep(prevStep.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> Precedent
                  </button>
                  <button
                    type="button"
                    disabled={!nextStep}
                    onClick={() => nextStep && setActiveStep(nextStep.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Suivant <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </RiskCard>

            {workshopStepRenderer({
              study,
              workshopId,
              stepId: currentStep.id,
              upsert: (wid, key, item) => upsertWorkshopItem(study.id, wid, key, item),
              remove: (wid, key, itemId) => deleteWorkshopItem(study.id, wid, key, itemId),
              updateContext: (wid, payload) => updateWorkshopContext(study.id, wid, payload),
              readOnly: blocked,
              riskOwners: owners,
            })}
        </main>
      </div>
    </div>
  );
}
