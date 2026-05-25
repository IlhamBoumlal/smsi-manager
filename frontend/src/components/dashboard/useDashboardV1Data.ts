import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../services/api/axiosInstance";
import { getAllAudits, getAllNCs, getAllSimulations } from "../../api/audits";
import { getGlobalStats, getDashboard as getClausesDashboard } from "../../api/clauses";
import { getCycles, getCycle } from "../../api/pdca";
import { getRiskStudies } from "../../features/risques/services/risques";
import { getDashboard as getTrainingDashboard, getFormations } from "../../api/sensibilisation";
import { getEffectiveWorkshopStatus, getStudyProgress, getWorkshopProgress } from "../../features/risques/riskModel";

const safeArray = (value: any): any[] => (Array.isArray(value) ? value : []);
const toNum = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const average = (values: number[]): number =>
  values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
const pct = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);
const normalize = (value: any): string => String(value ?? "").trim().toLowerCase();
const normalizeToken = (value: any): string =>
  normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]/g, "");
const getErrorStatus = (reason: any): number | null => {
  const status = Number(reason?.response?.status);
  return Number.isFinite(status) ? status : null;
};

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date: Date): string =>
  date.toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

function parseDate(...values: any[]): Date | null {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function normalizeControlStatus(raw: any): "conforme" | "nc_majeure" | "nc_mineure" | "non_conforme" | "remarque" | "non_evalue" {
  const status = normalizeToken(raw);
  if (!status) return "non_evalue";
  if (status === "4" || status.includes("ncmajeure") || status.includes("majeure")) return "nc_majeure";
  if (status === "3" || status.includes("ncmineure") || status.includes("mineure")) return "nc_mineure";
  if (status === "2" || status.includes("remarque") || status.includes("observation")) return "remarque";
  if (status.includes("nonconforme") || status.includes("notcompliant")) return "non_conforme";
  if (status === "1" || status === "conforme" || status.includes("compliant") || status.includes("conforme")) return "conforme";
  return "non_evalue";
}

function isApprovedDocumentStatus(raw: any): boolean {
  const status = normalizeToken(raw);
  if (!status) return false;
  if (status.includes("nonapprouve") || status.includes("notapproved") || status.includes("reject")) return false;
  return status.includes("approuve") || status.includes("approve") || status.includes("valide");
}

function isValidationDocumentStatus(raw: any): boolean {
  const status = normalizeToken(raw);
  return status.includes("validation") || status.includes("avalider");
}

function isReviewDocumentStatus(raw: any): boolean {
  const status = normalizeToken(raw);
  return status.includes("arevoir") || status.includes("review");
}

function isDraftDocumentStatus(raw: any): boolean {
  const status = normalizeToken(raw);
  return status.includes("brouillon") || status.includes("draft");
}

function computeClauseSubConformity(clauseDashboard: any[]) {
  let totalSubClauses = 0;
  let conformes = 0;
  let nonConformes = 0;

  clauseDashboard.forEach((entry: any) => {
    const clause = entry?.clause ?? entry?.Clause ?? {};
    const subClauses = safeArray(clause?.subClauses ?? clause?.SubClauses);
    const subConformities = entry?.subConformities ?? entry?.SubConformities ?? {};
    const conformityById = new Map<string, any>(Object.entries(subConformities).map(([id, value]) => [String(id), value]));

    totalSubClauses += subClauses.length;

    subClauses.forEach((sub: any) => {
      const subId = String(sub?.id ?? sub?.Id ?? "");
      if (!subId) return;
      const conformity = conformityById.get(subId);
      if (!conformity) return;
      const status = normalizeToken(conformity?.status ?? conformity?.Status);

      if (status === "conforme") conformes += 1;
      else if (status.includes("nonconforme")) nonConformes += 1;
    });
  });

  return { totalSubClauses, conformes, nonConformes };
}

function normalizeAuditStatus(raw: any): "planned" | "in_progress" | "completed" {
  const status = normalize(raw);
  if (status.includes("complete") || status.includes("termine")) return "completed";
  if (status.includes("progress") || status.includes("cours")) return "in_progress";
  return "planned";
}

function normalizeTrainingStatus(raw: any): "planned" | "in_progress" | "completed" {
  const status = normalize(raw);
  if (status.includes("termine") || status.includes("complete")) return "completed";
  if (status.includes("cours") || status.includes("progress")) return "in_progress";
  return "planned";
}

function normalizeIncidentStatus(raw: any): "in_progress" | "resolved" {
  const status = normalize(raw);
  if (status === "1" || status.includes("resolu") || status.includes("resolved") || status.includes("closed")) {
    return "resolved";
  }
  return "in_progress";
}

function normalizeControlPlanStatus(raw: any): "todo" | "in_progress" | "done" | "unknown" {
  const status = normalize(raw).replace(/[\s_-]/g, "");
  if (!status) return "unknown";
  if (status === "2" || status.includes("termine") || status.includes("complete") || status === "done") return "done";
  if (status === "1" || status.includes("encours") || status.includes("inprogress") || status.includes("progress")) {
    return "in_progress";
  }
  if (status === "0" || status.includes("nondemarre") || status.includes("todo") || status.includes("pending")) {
    return "todo";
  }
  return "unknown";
}

function normalizeCorrectiveActionStatus(raw: any): "todo" | "in_progress" | "done" {
  const status = normalize(raw).replace(/[\s_-]/g, "");
  if (status === "2" || status.includes("complete") || status.includes("termine") || status.includes("resolved")) {
    return "done";
  }
  if (status === "1" || status.includes("inprogress") || status.includes("encours") || status.includes("progress")) {
    return "in_progress";
  }
  return "todo";
}

function incidentPriorityLabel(raw: any): string {
  const priority = normalize(raw).replace(/[\s_-]/g, "");
  if (priority === "3" || priority.includes("critique")) return "Critique";
  if (priority === "2" || priority.includes("haute") || priority.includes("high")) return "Haute";
  if (priority === "1" || priority.includes("moyenne") || priority.includes("medium")) return "Moyenne";
  return "Basse";
}

function classifyPdcaStatus(raw: any): "done" | "in_progress" | "todo" {
  const status = normalize(raw);
  if (status === "done" || status === "completed" || status === "termine" || status === "complete") {
    return "done";
  }
  if (status === "in_progress" || status === "in-progress" || status === "progress" || status === "en_cours") {
    return "in_progress";
  }
  return "todo";
}

function computePdcaRate(cyclePayload: any) {
  const phases = safeArray(cyclePayload?.phases);
  const phaseProgress = {
    plan: { value: 0, done: 0, total: 0 },
    do: { value: 0, done: 0, total: 0 },
    check: { value: 0, done: 0, total: 0 },
    act: { value: 0, done: 0, total: 0 },
  };

  let done = 0;
  let inProgress = 0;
  let total = 0;

  phases.forEach((phase: any) => {
    const key = normalize(phase?.key);
    const items = safeArray(phase?.sections).flatMap((section: any) => safeArray(section?.items));
    const phaseDone = items.filter((item: any) => classifyPdcaStatus(item?.status) === "done").length;
    const phaseInProgress = items.filter((item: any) => classifyPdcaStatus(item?.status) === "in_progress").length;
    const phaseTotal = items.length;

    done += phaseDone;
    inProgress += phaseInProgress;
    total += phaseTotal;

    if (key in phaseProgress) {
      (phaseProgress as any)[key] = {
        value: Math.round(pct(phaseDone, phaseTotal)),
        done: phaseDone,
        total: phaseTotal,
      };
    }
  });

  return {
    global: Math.round(pct(done, total)),
    done,
    inProgress,
    total,
    todo: Math.max(total - done - inProgress, 0),
    ...phaseProgress,
  };
}

function buildIncidentsTrend(incidents: any[], months = 6) {
  const now = new Date();
  const buckets = [] as Array<{ key: string; m: string; open: number; resolved: number }>;

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({ key: monthKey(date), m: monthLabel(date), open: 0, resolved: 0 });
  }

  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  incidents.forEach((incident) => {
    const date = parseDate(
      incident?.date,
      incident?.Date,
      incident?.createdAt,
      incident?.CreatedAt,
      incident?.updatedAt,
      incident?.UpdatedAt
    );
    if (!date) return;
    const bucket = index.get(monthKey(date));
    if (!bucket) return;

    if (normalizeIncidentStatus(incident?.statut ?? incident?.Status) === "resolved") {
      bucket.resolved += 1;
    } else {
      bucket.open += 1;
    }
  });

  return buckets;
}

function buildRiskWorkshopStatus(studies: any[]) {
  return [1, 2, 3, 4, 5].map((id) => {
    let done = 0;
    let validate = 0;
    let blocked = 0;

    studies.forEach((study) => {
      const status = getEffectiveWorkshopStatus(study, id);
      if (status === "termine") done += 1;
      if (status === "a_valider") validate += 1;
      if (status === "bloque") blocked += 1;
    });

    return { name: `W${id}`, done, validate, blocked };
  });
}

function buildRiskStudiesProgress(studies: any[]) {
  return studies.map((study) => ({
    name: String(study?.name || "Etude"),
    w1: getWorkshopProgress(study, 1),
    w2: getWorkshopProgress(study, 2),
    w3: getWorkshopProgress(study, 3),
    w4: getWorkshopProgress(study, 4),
    w5: getWorkshopProgress(study, 5),
  }));
}

function buildRiskStudiesStatus(studies: any[]) {
  return studies.map((study, index) => ({
    id: String(study?.id ?? study?.Id ?? study?.studyId ?? study?.StudyId ?? index),
    name: String(study?.name || `Etude ${index + 1}`),
    workshopStatus: buildRiskWorkshopStatus([study]),
  }));
}

function getCycleId(cycle: any): string | null {
  const id = cycle?.id ?? cycle?.Id;
  return id ? String(id) : null;
}

function isActiveCycle(cycle: any): boolean {
  const activeFlag = cycle?.isActive ?? cycle?.IsActive;
  if (typeof activeFlag === "boolean") return activeFlag;

  const status = normalize(cycle?.status ?? cycle?.Status);
  return status === "active" || status === "en_cours" || status === "encours";
}

function cycleSortTime(cycle: any): number {
  return (
    parseDate(
      cycle?.createdAt,
      cycle?.CreatedAt,
      cycle?.updatedAt,
      cycle?.UpdatedAt,
      cycle?.dateDebut,
      cycle?.DateDebut,
      cycle?.startDate,
      cycle?.StartDate
    )?.getTime() ?? 0
  );
}

function pickPdcaCycleId(cycles: any[]): string | null {
  if (!cycles.length) return null;

  const activeCycle = cycles.find((cycle) => isActiveCycle(cycle));
  if (activeCycle) return getCycleId(activeCycle);

  const sortedCycles = [...cycles].sort((a, b) => cycleSortTime(b) - cycleSortTime(a));
  return getCycleId(sortedCycles[0]);
}

function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

function buildRollingWindow(days = 30) {
  const now = new Date();
  const startUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1));

  const buckets = [] as Array<{ key: string; d: string; created: number; completed: number }>;
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startUtc);
    date.setUTCDate(startUtc.getUTCDate() + i);
    buckets.push({ key: dayKey(date), d: dayLabel(date), created: 0, completed: 0 });
  }

  return {
    startUtc,
    buckets,
    index: new Map(buckets.map((bucket) => [bucket.key, bucket])),
  };
}

function addDailyEvent(
  index: Map<string, { key: string; d: string; created: number; completed: number }>,
  date: Date | null,
  field: "created" | "completed"
) {
  if (!date) return;
  const bucket = index.get(dayKey(date));
  if (bucket) bucket[field] += 1;
}

function cleanOwner(...candidates: any[]): string {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (value === "-") continue;
    return value;
  }
  return "Non assigne";
}

function normalizeActionLabel(raw: any): "todo" | "in_progress" | "done" {
  const status = normalize(raw).replace(/[\s_-]/g, "");
  if (!status) return "todo";
  if (status.includes("done") || status.includes("complete") || status.includes("termine") || status.includes("resolved")) {
    return "done";
  }
  if (status.includes("inprogress") || status.includes("encours") || status.includes("progress")) {
    return "in_progress";
  }
  return "todo";
}

function isActionStatusKnown(raw: any): boolean {
  const status = normalize(raw).replace(/[\s_-]/g, "");
  if (!status) return false;
  return (
    status.includes("done") ||
    status.includes("complete") ||
    status.includes("termine") ||
    status.includes("resolved") ||
    status.includes("inprogress") ||
    status.includes("encours") ||
    status.includes("progress") ||
    status.includes("todo") ||
    status.includes("pending") ||
    status.includes("open")
  );
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function inUtcRange(date: Date | null, start: Date, endExclusive: Date): boolean {
  if (!date) return false;
  const ts = date.getTime();
  return ts >= start.getTime() && ts < endExclusive.getTime();
}

function daysBetween(from: Date | null, to: Date | null): number | null {
  if (!from || !to) return null;
  const diff = to.getTime() - from.getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60 * 24);
}

function averageDays(values: Array<number | null>): number | null {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (clean.length === 0) return null;
  return Number((clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(1));
}

function computePercentChange(current: number, previous: number): number | null {
  if (previous > 0) return Number((((current - previous) / previous) * 100).toFixed(1));
  if (previous === 0 && current === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  return null;
}

function isCurrentWeek(date: Date | null, now: Date): boolean {
  if (!date) return false;
  const today = startOfUtcDay(now);
  const dayIndex = (today.getUTCDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - dayIndex);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return inUtcRange(date, weekStart, weekEnd);
}

type DashboardV1Options = {
  canPersistSnapshots?: boolean;
};

export function useDashboardV1Data(options?: DashboardV1Options) {
  const canPersistSnapshots = options?.canPersistSnapshots ?? false;
  const [state, setState] = useState({
    data: null as any,
    loading: true,
    refreshing: false,
    error: "",
    warnings: [] as string[],
  });

  const loadData = useCallback(async (refresh = false) => {
    setState((prev) => ({
      ...prev,
      loading: refresh ? prev.loading : true,
      refreshing: refresh,
      error: "",
      warnings: [],
    }));

    try {
      const warnings: string[] = [];
      const addWarning = (message: string) => {
        if (!warnings.includes(message)) warnings.push(message);
      };

      const readSettled = <T,>(
        result: PromiseSettledResult<T>,
        fallback: T,
        label: string,
        options?: {
          ignoreStatuses?: number[];
          optional?: boolean;
        }
      ): T => {
        if (result.status === "fulfilled") return result.value;
        const status = getErrorStatus((result as PromiseRejectedResult).reason);
        const ignoreStatuses = options?.ignoreStatuses ?? [401, 403];
        if (status !== null && ignoreStatuses.includes(status)) {
          return fallback;
        }
        if (!options?.optional) addWarning(`${label} indisponible.`);
        return fallback;
      };

      const cyclesResult = await getCycles()
        .then((value) => ({ value }))
        .catch(() => {
          addWarning("Cycles PDCA indisponibles.");
          return { value: [] as any[] };
        });
      const cycles = safeArray(cyclesResult.value);
      const preferredCycleId = pickPdcaCycleId(cycles);

      if (cycles.length > 0 && !preferredCycleId) {
        addWarning("Cycle PDCA exploitable introuvable.");
      }

      const cyclePayload = preferredCycleId
        ? await getCycle(preferredCycleId).catch(() => {
            addWarning("Detail du cycle PDCA indisponible.");
            return null;
          })
        : null;

      const [
        clauseStatsResult,
        clauseDashboardResult,
        controlsResult,
        docsResult,
        assetsResult,
        riskStudiesResult,
        auditsResult,
        trainingDashboardResult,
        formationsResult,
        incidentsResult,
        auditNcResult,
        auditSimResult,
        snapshotsResult,
      ] = await Promise.allSettled([
        getGlobalStats(),
        getClausesDashboard(),
        axiosInstance.get("/api/controles"),
        axiosInstance.get("/api/documentation"),
        axiosInstance.get("/api/actifs"),
        getRiskStudies(),
        getAllAudits(),
        getTrainingDashboard(),
        getFormations(),
        axiosInstance.get("/api/incidents"),
        getAllNCs(),
        getAllSimulations(),
        axiosInstance.get("/api/dashboard/snapshots", { params: { months: 12 } }),
      ]);

      const clauseStats = readSettled<any>(clauseStatsResult as any, { averageConformity: 0 }, "Statistiques clauses");
      const clauseDashboard = safeArray(readSettled<any[]>(clauseDashboardResult as any, [], "Dashboard clauses"));

      const controlsResponse = readSettled<any>(controlsResult as any, { data: [] }, "Controles");
      const docsResponse = readSettled<any>(docsResult as any, { data: [] }, "Documentation");
      const assetsResponse = readSettled<any>(assetsResult as any, { data: [] }, "Actifs");
      const incidentsResponse = readSettled<any>(incidentsResult as any, { data: [] }, "Incidents", {
        ignoreStatuses: [401, 403],
        optional: true,
      });

      const controls = safeArray((controlsResponse as any)?.data);
      const documents = safeArray((docsResponse as any)?.data);
      const assets = safeArray((assetsResponse as any)?.data);
      const incidents = safeArray((incidentsResponse as any)?.data);

      const riskStudies = safeArray(readSettled<any[]>(riskStudiesResult as any, [], "Etudes de risques"));
      const audits = safeArray(readSettled<any[]>(auditsResult as any, [], "Audits", {
        ignoreStatuses: [401, 403],
        optional: true,
      }));
      const trainingDashboard = readSettled<any>(trainingDashboardResult as any, { tauxMoyen: 0 }, "Dashboard formations", {
        ignoreStatuses: [401, 403],
        optional: true,
      });
      const formations = safeArray(readSettled<any[]>(formationsResult as any, [], "Formations", {
        ignoreStatuses: [401, 403],
        optional: true,
      }));
      const auditNcs = safeArray(readSettled<any[]>(auditNcResult as any, [], "Non-conformites audits", {
        ignoreStatuses: [401, 403],
        optional: true,
      }));
      const auditSims = safeArray(readSettled<any[]>(auditSimResult as any, [], "Simulations d'audit", {
        ignoreStatuses: [401, 403],
        optional: true,
      }));
      const snapshotsResponse = readSettled<any>(snapshotsResult as any, { data: [] }, "Snapshots dashboard", {
        ignoreStatuses: [401, 403],
        optional: true,
      });
      const dashboardSnapshots = safeArray((snapshotsResponse as any)?.data);

      let controlsConforme = 0;
      let controlsNcMineure = 0;
      let controlsNcMajeure = 0;
      let controlsNonConforme = 0;
      let controlsActionsRetard = 0;
      let controlsInProgressActions = 0;

      const controlsByDomainMap = new Map<string, { name: string; total: number; conformes: number; score: number }>();
      const now = new Date();

      controls.forEach((control) => {
        const status = normalizeControlStatus(control?.statut ?? control?.Statut);
        const domain = String(control?.domaine ?? control?.Domaine ?? "Domaine");
        const planStatus = normalizeControlPlanStatus(control?.statutPlan ?? control?.StatutPlan);
        const dueDate = parseDate(control?.dateEcheance, control?.DateEcheance);
        const hasPlanData =
          planStatus !== "unknown" ||
          Boolean(dueDate) ||
          Boolean(control?.steps ?? control?.Steps);

        if (!controlsByDomainMap.has(domain)) {
          controlsByDomainMap.set(domain, { name: domain, total: 0, conformes: 0, score: 0 });
        }
        const bucket = controlsByDomainMap.get(domain)!;
        bucket.total += 1;

        if (status === "conforme") {
          controlsConforme += 1;
          bucket.conformes += 1;
        } else if (status === "nc_mineure") {
          controlsNcMineure += 1;
          controlsNonConforme += 1;
        } else if (status === "nc_majeure") {
          controlsNcMajeure += 1;
          controlsNonConforme += 1;
          bucket.score += 1;
        } else if (status === "non_conforme") {
          controlsNonConforme += 1;
        } else if (status === "remarque") {
          controlsNonConforme += 1;
        }

        if (hasPlanData && planStatus === "in_progress") {
          controlsInProgressActions += 1;
        }

        if (hasPlanData && planStatus !== "done" && dueDate && dueDate.getTime() < now.getTime()) {
          controlsActionsRetard += 1;
        }
      });

      let docsApproved = 0;
      let docsValidation = 0;
      let docsReview = 0;
      let docsDraft = 0;

      documents.forEach((doc) => {
        const status = doc?.status ?? doc?.Status;
        if (isApprovedDocumentStatus(status)) docsApproved += 1;
        else if (isValidationDocumentStatus(status)) docsValidation += 1;
        else if (isReviewDocumentStatus(status)) docsReview += 1;
        else if (isDraftDocumentStatus(status)) docsDraft += 1;
      });

      let assetPrimaires = 0;
      let assetSupports = 0;
      let assetSecret = 0;
      let assetTopSecret = 0;

      assets.forEach((asset) => {
        const type = normalize(asset?.type ?? asset?.Type).replace(/[\s_-]/g, "");
        const classificationRaw = normalize(asset?.classification ?? asset?.Classification);
        const classification = classificationRaw.replace(/[\s_-]/g, "");

        if (type === "1" || type.includes("primaire")) assetPrimaires += 1;
        else if (type === "0" || type.includes("support")) assetSupports += 1;

        if (classification === "3" || classification.includes("topsecret")) {
          assetTopSecret += 1;
        } else if (classification === "2" || classification.includes("secret")) {
          assetSecret += 1;
        }
      });

      const totalAssets = assets.length;
      const clampedAssetPrimaires = Math.min(assetPrimaires, totalAssets);
      const clampedAssetSupports = Math.min(assetSupports, Math.max(totalAssets - clampedAssetPrimaires, 0));
      const assetsToReview = Math.max(totalAssets - clampedAssetPrimaires - clampedAssetSupports, 0);
      const clauseSubConformity = computeClauseSubConformity(clauseDashboard);
      const clausesConformityRate = clauseSubConformity.totalSubClauses
        ? Math.round(pct(clauseSubConformity.conformes, clauseSubConformity.totalSubClauses))
        : Math.round(toNum(clauseStats?.averageConformity));
      const clausesConformesCount = clauseSubConformity.totalSubClauses
        ? clauseSubConformity.conformes
        : toNum(clauseStats?.conformeClauses);
      const clausesNonConformesCount = clauseSubConformity.totalSubClauses
        ? clauseSubConformity.nonConformes
        : toNum(clauseStats?.nonConformeClauses);

      const pdca = computePdcaRate(cyclePayload);

      const riskProgressList = riskStudies.map((study) => {
        try {
          return getStudyProgress(study);
        } catch {
          return { done: 0, toValidate: 0, inProgress: 0, blocked: 0, pct: 0, status: "non_evalue" };
        }
      });

      const riskAverageProgress = riskProgressList.length
        ? Math.round(average(riskProgressList.map((progress) => toNum(progress.pct))))
        : 0;
      const riskDoneStudies = riskProgressList.filter((progress) => progress.done === 5).length;
      const riskOngoingStudies = riskProgressList.filter((progress) => progress.status === "en_cours").length;
      const riskToValidateWorkshops = riskProgressList.reduce((sum, progress) => sum + toNum(progress.toValidate), 0);
      const riskBlockedWorkshops = riskProgressList.reduce((sum, progress) => sum + toNum(progress.blocked), 0);

      const auditPlannedCount = audits.filter((audit) => normalizeAuditStatus(audit?.status) === "planned").length;
      const auditInProgressCount = audits.filter((audit) => normalizeAuditStatus(audit?.status) === "in_progress").length;
      const auditCompletedCount = audits.filter((audit) => normalizeAuditStatus(audit?.status) === "completed").length;
      const auditOpenNcCount = auditNcs.filter((nc) => {
        const status = normalize(nc?.status);
        return status.includes("open") || status.includes("ouverte");
      }).length;

      const formationsCompleted = formations.filter((formation) => normalizeTrainingStatus(formation?.status) === "completed").length;
      const formationsInProgress = formations.filter((formation) => normalizeTrainingStatus(formation?.status) === "in_progress").length;
      const formationsPlanned = formations.filter((formation) => normalizeTrainingStatus(formation?.status) === "planned").length;

      const participantsInvited = formations.reduce((sum, formation) => sum + toNum(formation?.participants), 0);
      const participantsAttended = formations.reduce((sum, formation) => sum + toNum(formation?.presents), 0);

      const attendanceRateGlobal = toNum(trainingDashboard?.tauxMoyen) || pct(participantsAttended, participantsInvited);

      const incidentsInProgress = incidents.filter(
        (incident) => normalizeIncidentStatus(incident?.statut ?? incident?.Status) === "in_progress"
      ).length;
      const incidentsResolved = incidents.filter(
        (incident) => normalizeIncidentStatus(incident?.statut ?? incident?.Status) === "resolved"
      ).length;

      // Conformite stricte: 100% uniquement si tous les controles du perimetre sont conformes.
      const controlsConformityRate = Math.round(pct(controlsConforme, controls.length));
      const docsConformityRate = Math.round(pct(docsApproved, documents.length));
      const assetsConformityRate = totalAssets
        ? Math.round(((clampedAssetSupports + clampedAssetPrimaires) / totalAssets) * 100)
        : 0;

      const globalConformity = Math.round(
        average([
          clausesConformityRate,
          controlsConformityRate,
          docsConformityRate,
          assetsConformityRate,
          toNum(pdca.global),
          riskAverageProgress,
        ])
      );

      const controlsByDomain = Array.from(controlsByDomainMap.values())
        .map((item) => ({
          ...item,
          value: Math.round(pct(item.conformes, item.total)),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      const clausesTable = clauseDashboard.map((entry: any, index: number) => {
        const clause = entry?.clause ?? entry?.Clause ?? {};
        const number = String(clause?.number ?? clause?.Number ?? `C${index + 1}`);
        const title = String(clause?.title ?? clause?.Title ?? "Clause");
        const subClauses = safeArray(clause?.subClauses ?? clause?.SubClauses);

        return {
          id: number,
          titre: title,
          sousClauses: subClauses.length,
          plans: toNum(entry?.actionCount ?? entry?.ActionCount),
          termines: toNum(entry?.doneCount ?? entry?.DoneCount),
          enCours: toNum(entry?.inProgress ?? entry?.InProgress),
          score: toNum(entry?.computedScore ?? entry?.ComputedScore),
        };
      });

      const trainingBreakdown = [
        { name: "Planifiees", value: toNum(trainingDashboard?.planifiees) || formationsPlanned },
        { name: "En cours", value: toNum(trainingDashboard?.enCours) || formationsInProgress },
        { name: "Terminees", value: toNum(trainingDashboard?.terminees) || formationsCompleted },
      ];

      const incidentsTrend = buildIncidentsTrend(incidents, 6);

      const incidentsList = incidents
        .map((incident: any, index: number) => {
          const incidentDate = parseDate(incident?.date, incident?.Date, incident?.createdAt, incident?.CreatedAt);
          const status = normalizeIncidentStatus(incident?.statut ?? incident?.Status);
          return {
            id: String(incident?.id ?? incident?.Id ?? `INC-${index + 1}`),
            titre: String(incident?.titre ?? incident?.Titre ?? "Incident"),
            statut: status === "resolved" ? "Resolu" : "En cours",
            priorite: incidentPriorityLabel(incident?.priorite ?? incident?.Priorite),
            date: incidentDate
              ? incidentDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "-",
            sortTs: incidentDate?.getTime() ?? 0,
          };
        })
        .sort((a, b) => b.sortTs - a.sortTs)
        .slice(0, 5)
        .map(({ sortTs, ...incident }) => incident);

      const conformityByDomain = [
        { name: "Clauses", value: clausesConformityRate },
        { name: "Controles", value: controlsConformityRate },
        { name: "Documentation", value: docsConformityRate },
        { name: "Actifs", value: assetsConformityRate },
        { name: "PDCA", value: Math.round(toNum(pdca.global)) },
        { name: "Risques", value: riskAverageProgress },
      ];

      const auditsActionPlans = auditNcs.slice(0, 5).map((nc: any, index: number) => {
        const status = normalize(nc?.status);
        const actions = safeArray(nc?.correctiveActions ?? nc?.CorrectiveActions);
        const totalActions = actions.length;
        const doneActions = actions.filter(
          (action: any) => normalizeCorrectiveActionStatus(action?.status ?? action?.Status) === "done"
        ).length;
        const fallbackResponsible = actions.find((action: any) => action?.responsible ?? action?.Responsible);
        const isDone = status.includes("resolved") || status.includes("resol") || status.includes("termine") || status.includes("closed");
        return {
          id: String(nc?.id || `NC-${index + 1}`),
          titre: String(nc?.title || nc?.titre || "Plan d'action"),
          responsable: String(
            nc?.responsible || nc?.actor || fallbackResponsible?.responsible || fallbackResponsible?.Responsible || "Responsable"
          ),
          statut: isDone ? "Terminee" : "En cours",
          progression: isDone ? 100 : totalActions > 0 ? Math.round(pct(doneActions, totalActions)) : 0,
        };
      });

      const pdcaItems = safeArray(cyclePayload?.phases).flatMap((phase: any) =>
        safeArray(phase?.sections).flatMap((section: any) =>
          safeArray(section?.items).map((item: any, itemIndex: number) => ({
            id: String(item?.id ?? item?.Id ?? `${String(phase?.key || "pdca")}-${String(section?.id || "sec")}-${itemIndex}`),
            phaseKey: String(phase?.key ?? "").toLowerCase(),
            phaseLabel: String(phase?.label ?? phase?.title ?? phase?.name ?? phase?.key ?? "PDCA"),
            sectionTitle: String(section?.title ?? section?.name ?? "Section"),
            text: String(item?.text ?? item?.Text ?? "Action PDCA"),
            status: classifyPdcaStatus(item?.status ?? item?.Status),
            createdAt: parseDate(item?.createdAt, item?.CreatedAt),
            updatedAt: parseDate(item?.updatedAt, item?.UpdatedAt),
            owner: cleanOwner(item?.responsable, item?.Responsable, item?.ownerName, item?.OwnerName, item?.owner, item?.Owner),
          }))
        )
      );

      const horizonDate = new Date(now);
      horizonDate.setDate(horizonDate.getDate() + 7);

      const priorityCandidates = [] as Array<{
        id: string;
        module: string;
        title: string;
        owner: string;
        dueDate: string;
        dueSort: number;
        state: string;
        urgency: "critique" | "haute" | "moyenne";
      }>;
      const docValidationDelayThresholdDays = 7;
      let docsValidationAgedCount = 0;
      let ncsOpenThisWeekCount = 0;

      const ownerLoad = new Map<string, { owner: string; total: number; late: number; inProgress: number; done: number }>();
      const moduleActivity = new Map<string, number>();
      const blockerCounts = new Map<string, number>();

      let qualityTotalTracked = 0;
      let qualityMissingOwner = 0;
      let qualityMissingDue = 0;
      let qualityIncoherentStatus = 0;

      const monthStartCurrent = startOfUtcMonth(now);
      const monthStartNext = addUtcMonths(monthStartCurrent, 1);
      const monthStartPrevious = addUtcMonths(monthStartCurrent, -1);

      let incidentsCurrentMonth = 0;
      let incidentsPreviousMonth = 0;
      let auditsCompletedCurrentMonth = 0;
      let auditsCompletedPreviousMonth = 0;
      let pdcaCompletedCurrentMonth = 0;
      let pdcaCompletedPreviousMonth = 0;

      const incidentCloseSlaDays = [] as Array<number | null>;
      const ncTreatmentSlaDays = [] as Array<number | null>;
      const docApprovalSlaDays = [] as Array<number | null>;

      const riskHeatmapCells = new Map<string, number>();
      let residualRiskCriticalCount = 0;

      const addOwnerWork = (
        ownerRaw: any,
        statusRaw: any,
        moduleName: string,
        isLate = false
      ) => {
        const owner = cleanOwner(ownerRaw);
        if (owner === "Non assigne") return;

        const normalizedStatus = normalizeActionLabel(statusRaw);
        const key = `${moduleName.toLowerCase()}::${owner.toLowerCase()}`;
        const existing = ownerLoad.get(key) ?? { owner, total: 0, late: 0, inProgress: 0, done: 0 };
        existing.total += 1;
        if (isLate) existing.late += 1;
        if (normalizedStatus === "done") existing.done += 1;
        else if (normalizedStatus === "in_progress") existing.inProgress += 1;
        ownerLoad.set(key, existing);
      };

      const incrementBlocker = (name: string, count = 1) => {
        if (!name || count <= 0) return;
        blockerCounts.set(name, (blockerCounts.get(name) ?? 0) + count);
      };

      const trackQuality = (options: {
        owner?: string;
        dueDate?: Date | null;
        statusKnown: boolean;
        dueApplicable?: boolean;
      }) => {
        qualityTotalTracked += 1;
        if (!options.statusKnown) qualityIncoherentStatus += 1;
        if (!options.owner || options.owner === "Non assigne") qualityMissingOwner += 1;
        if ((options.dueApplicable ?? true) && !options.dueDate) qualityMissingDue += 1;
      };

      const incrementRiskHeatmapCell = (gravityRaw: any, likelihoodRaw: any) => {
        const gravity = toNum(gravityRaw);
        const likelihood = toNum(likelihoodRaw);
        if (gravity < 1 || gravity > 4 || likelihood < 1 || likelihood > 4) return;
        const key = `${gravity}x${likelihood}`;
        riskHeatmapCells.set(key, (riskHeatmapCells.get(key) ?? 0) + 1);
      };

      const addPriority = (entry: {
        id: string;
        module: string;
        title: string;
        owner?: string;
        dueDate?: Date | null;
        state: string;
        urgency: "critique" | "haute" | "moyenne";
      }) => {
        priorityCandidates.push({
          id: entry.id,
          module: entry.module,
          title: entry.title,
          owner: cleanOwner(entry.owner),
          dueDate: entry.dueDate
            ? entry.dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "Sans echeance",
          dueSort: entry.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER,
          state: entry.state,
          urgency: entry.urgency,
        });
      };

      const rolling30 = buildRollingWindow(30);
      const addActivity = (moduleName: string, createdAt?: Date | null, completedAt?: Date | null) => {
        const activityCount = moduleActivity.get(moduleName) ?? 0;
        let nextCount = activityCount;
        if (createdAt && createdAt.getTime() >= rolling30.startUtc.getTime()) {
          addDailyEvent(rolling30.index, createdAt, "created");
          nextCount += 1;
        }
        if (completedAt && completedAt.getTime() >= rolling30.startUtc.getTime()) {
          addDailyEvent(rolling30.index, completedAt, "completed");
          nextCount += 1;
        }
        if (nextCount !== activityCount) moduleActivity.set(moduleName, nextCount);
      };

      controls.forEach((control: any, index: number) => {
        const planStatus = normalizeControlPlanStatus(control?.statutPlan ?? control?.StatutPlan);
        const dueDate = parseDate(control?.dateEcheance, control?.DateEcheance);
        const lastUpdate = parseDate(control?.dateMiseAJour, control?.DateMiseAJour, control?.updatedAt, control?.UpdatedAt);
        const createdAt = parseDate(control?.createdAt, control?.CreatedAt, control?.dateCreation, control?.DateCreation);
        const owner = cleanOwner(
          control?.responsablePlan,
          control?.ResponsablePlan,
          control?.responsable,
          control?.Responsable
        );
        const controlTitle = String(control?.titre ?? control?.Titre ?? control?.code ?? control?.Code ?? `Controle ${index + 1}`);

        addOwnerWork(owner, planStatus, "Controles", Boolean(dueDate && planStatus !== "done" && dueDate.getTime() < now.getTime()));
        addActivity("Controles", createdAt, planStatus === "done" ? lastUpdate : null);
        trackQuality({
          owner,
          dueDate,
          statusKnown: planStatus !== "unknown",
          dueApplicable: true,
        });

        if (planStatus === "done" || planStatus === "unknown") return;

        const isLate = Boolean(dueDate && dueDate.getTime() < now.getTime());
        const isDueSoon = Boolean(
          dueDate &&
          dueDate.getTime() >= now.getTime() &&
          dueDate.getTime() <= horizonDate.getTime()
        );
        if (!dueDate || (!isLate && !isDueSoon)) return;

        if (isLate) incrementBlocker("Controles en retard", 1);

        const urgency: "critique" | "haute" = isLate ? "critique" : "haute";

        addPriority({
          id: `ctrl-${String(control?.id ?? control?.Id ?? index)}`,
          module: "Controles",
          title: controlTitle,
          owner,
          dueDate,
          state: planStatus === "in_progress" ? "En cours" : "A faire",
          urgency,
        });
      });

      pdcaItems.forEach((item: any) => {
        addActivity("PDCA", item.createdAt, item.status === "done" ? item.updatedAt : null);
        addOwnerWork(item.owner, item.status, "PDCA", false);

        const pdcaStatusRaw = String(item?.status ?? item?.Status ?? "").trim();
        trackQuality({
          owner: item.owner,
          dueDate: null,
          statusKnown: pdcaStatusRaw.length > 0,
          dueApplicable: false,
        });

        const pdcaDoneDate = item.updatedAt ?? item.createdAt;
        if (item.status === "done" && inUtcRange(pdcaDoneDate, monthStartCurrent, monthStartNext)) {
          pdcaCompletedCurrentMonth += 1;
        }
        if (item.status === "done" && inUtcRange(pdcaDoneDate, monthStartPrevious, monthStartCurrent)) {
          pdcaCompletedPreviousMonth += 1;
        }
      });

      auditNcs.forEach((nc: any, index: number) => {
        const ncCreatedAt = parseDate(nc?.createdAt, nc?.CreatedAt, nc?.date, nc?.Date);
        const ncUpdatedAt = parseDate(nc?.updatedAt, nc?.UpdatedAt);
        const ncStatus = normalizeActionLabel(nc?.status ?? nc?.Status);
        addActivity("Audits", ncCreatedAt, ncStatus === "done" ? ncUpdatedAt : null);
        if (ncStatus === "done") {
          ncTreatmentSlaDays.push(daysBetween(ncCreatedAt, ncUpdatedAt));
        }

        const fallbackTitle = String(nc?.title ?? nc?.Title ?? nc?.titre ?? `NC ${index + 1}`);
        const rawActions = safeArray(nc?.correctiveActions ?? nc?.CorrectiveActions);
        const actions = rawActions.length > 0 ? rawActions : [nc];

        actions.forEach((action: any, actionIndex: number) => {
          const rawStatus = action?.status ?? action?.Status ?? nc?.status ?? nc?.Status;
          const status = normalizeActionLabel(rawStatus);
          const statusKnown = isActionStatusKnown(rawStatus);
          const dueDate = parseDate(action?.deadline, action?.Deadline, nc?.deadline, nc?.Deadline);
          const owner = cleanOwner(
            action?.responsible,
            action?.Responsible,
            nc?.responsible,
            nc?.Responsible,
            nc?.actor,
            nc?.Actor
          );
          const title = String(action?.description ?? action?.Description ?? fallbackTitle);
          const isLate = Boolean(dueDate && status !== "done" && dueDate.getTime() < now.getTime());
          const isDueSoon = Boolean(
            dueDate &&
            status !== "done" &&
            dueDate.getTime() >= now.getTime() &&
            dueDate.getTime() <= horizonDate.getTime()
          );

          addOwnerWork(owner, status, "Audits", isLate);
          trackQuality({
            owner,
            dueDate,
            statusKnown,
            dueApplicable: true,
          });

          if (status !== "done" && isCurrentWeek(dueDate, now)) {
            ncsOpenThisWeekCount += 1;
          }
          if (isLate) incrementBlocker("NC ouvertes en retard", 1);

          if (status === "done") return;
          if (!dueDate || (!isLate && !isDueSoon)) return;

          addPriority({
            id: `audit-${String(nc?.id ?? nc?.Id ?? index)}-${actionIndex}`,
            module: "Audits",
            title,
            owner,
            dueDate,
            state: status === "in_progress" ? "En cours" : "A faire",
            urgency: isLate ? "critique" : "haute",
          });
        });
      });

      riskStudies.forEach((study: any) => {
        const studyCreatedAt = parseDate(study?.createdAt, study?.CreatedAt);
        const studyUpdatedAt = parseDate(study?.updatedAt, study?.UpdatedAt);
        addActivity("Risques", studyCreatedAt, null);

        const entries = safeArray(study?.workshop5?.riskEntries);
        entries.forEach((entry: any) => {
          const token = normalize(entry?.status).replace(/[\s_-]/g, "");
          const statusKnown =
            token.length > 0 &&
            (token.includes("traite") ||
              token.includes("accepte") ||
              token.includes("traitement") ||
              token.includes("inprogress") ||
              token.includes("ouvert") ||
              token.includes("open"));
          const status =
            token.includes("traite") || token.includes("accepte")
              ? "done"
              : token.includes("traitement") || token.includes("inprogress")
                ? "in_progress"
                : "todo";
          const owner = cleanOwner(entry?.ownerName, entry?.OwnerName, entry?.ownerUserId, entry?.OwnerUserId);
          addOwnerWork(owner, status, "Risques", false);
          trackQuality({
            owner,
            dueDate: null,
            statusKnown,
            dueApplicable: false,
          });
          incrementRiskHeatmapCell(entry?.gravity, entry?.likelihood);

          if (status === "done") {
            addActivity("Risques", null, studyUpdatedAt);
            return;
          }

          if (status !== "in_progress") return;
        });

        const residuals = safeArray(study?.workshop5?.residualRisks);
        residuals.forEach((residual: any) => {
          const g = toNum(residual?.residualGravity);
          const l = toNum(residual?.residualLikelihood);
          if (g >= 1 && g <= 4 && l >= 1 && l <= 4 && g * l > 9) {
            residualRiskCriticalCount += 1;
          }
        });
      });

      documents.forEach((doc: any) => {
        const createdAt = parseDate(doc?.createdAt, doc?.CreatedAt);
        const updatedAt = parseDate(doc?.updatedAt, doc?.UpdatedAt, doc?.approvedAt, doc?.ApprovedAt);
        const approvedAt = parseDate(doc?.approvedAt, doc?.ApprovedAt);
        const statusToken = doc?.status ?? doc?.Status;
        const completedAt = isApprovedDocumentStatus(statusToken) ? updatedAt : null;
        addActivity("Documentation", createdAt, completedAt);
        trackQuality({
          owner: cleanOwner(doc?.author, doc?.Author, doc?.approver, doc?.Approver),
          dueDate: null,
          statusKnown: normalize(statusToken).length > 0,
          dueApplicable: false,
        });

        if (isApprovedDocumentStatus(statusToken)) {
          docApprovalSlaDays.push(daysBetween(createdAt, approvedAt ?? updatedAt));
        }

        const validationDate = updatedAt ?? createdAt;
        const validationAgeDays = daysBetween(validationDate, now);
        const isValidation = isValidationDocumentStatus(statusToken);
        const isAgedValidation = isValidation && validationAgeDays !== null && validationAgeDays > docValidationDelayThresholdDays;

        if (isAgedValidation) {
          docsValidationAgedCount += 1;
          incrementBlocker("Documents en validation ancienne", 1);
          addPriority({
            id: `doc-${String(doc?.id ?? doc?.Id ?? docsValidationAgedCount)}`,
            module: "Documentation",
            title: String(doc?.name ?? doc?.Name ?? "Document en validation"),
            owner: cleanOwner(doc?.approver, doc?.Approver, doc?.author, doc?.Author),
            dueDate: validationDate,
            state: "En validation",
            urgency: (validationAgeDays ?? 0) > docValidationDelayThresholdDays * 2 ? "critique" : "haute",
          });
        }
      });

      incidents.forEach((incident: any) => {
        const createdAt = parseDate(incident?.createdAt, incident?.CreatedAt, incident?.date, incident?.Date);
        const updatedAt = parseDate(incident?.updatedAt, incident?.UpdatedAt);
        const isResolved = normalizeIncidentStatus(incident?.statut ?? incident?.Status) === "resolved";
        addActivity("Incidents", createdAt, isResolved ? updatedAt : null);
        if (inUtcRange(createdAt, monthStartCurrent, monthStartNext)) incidentsCurrentMonth += 1;
        if (inUtcRange(createdAt, monthStartPrevious, monthStartCurrent)) incidentsPreviousMonth += 1;
        if (isResolved) incidentCloseSlaDays.push(daysBetween(createdAt, updatedAt));
      });

      formations.forEach((formation: any) => {
        const createdAt = parseDate(formation?.createdAt, formation?.CreatedAt, formation?.dateDebut, formation?.DateDebut);
        const updatedAt = parseDate(formation?.updatedAt, formation?.UpdatedAt);
        const isDone = normalizeTrainingStatus(formation?.status ?? formation?.Status) === "completed";
        addActivity("Formations", createdAt, isDone ? updatedAt : null);
      });

      audits.forEach((audit: any) => {
        const createdAt = parseDate(audit?.createdAt, audit?.CreatedAt, audit?.startDate, audit?.StartDate);
        const updatedAt = parseDate(audit?.updatedAt, audit?.UpdatedAt, audit?.endDate, audit?.EndDate);
        const isDone = normalizeAuditStatus(audit?.status ?? audit?.Status) === "completed";
        addActivity("Audits", createdAt, isDone ? updatedAt : null);
        const auditDoneDate = updatedAt ?? createdAt;
        if (isDone && inUtcRange(auditDoneDate, monthStartCurrent, monthStartNext)) auditsCompletedCurrentMonth += 1;
        if (isDone && inUtcRange(auditDoneDate, monthStartPrevious, monthStartCurrent)) auditsCompletedPreviousMonth += 1;
      });

      const urgencyRank: Record<string, number> = { critique: 0, haute: 1, moyenne: 2 };
      const sortedPriorityPool = priorityCandidates
        .sort((a, b) => {
          const rankDelta = (urgencyRank[a.urgency] ?? 99) - (urgencyRank[b.urgency] ?? 99);
          if (rankDelta !== 0) return rankDelta;
          return a.dueSort - b.dueSort;
        });
      const sortedPriorities = sortedPriorityPool.slice(0, 8);

      const ownerLoadItems = Array.from(ownerLoad.values())
        .map((item) => ({
          ...item,
          open: Math.max(item.total - item.done, 0),
        }))
        .sort((a, b) => {
          if (b.open !== a.open) return b.open - a.open;
          if (b.late !== a.late) return b.late - a.late;
          return a.owner.localeCompare(b.owner, "fr");
        })
        .slice(0, 8);

      const activityByModule = Array.from(moduleActivity.entries())
        .map(([module, value]) => ({ module, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const totalCreated30d = rolling30.buckets.reduce((sum, bucket) => sum + bucket.created, 0);
      const totalCompleted30d = rolling30.buckets.reduce((sum, bucket) => sum + bucket.completed, 0);

      incrementBlocker("Clauses en retard", toNum(clauseStats?.delayedActions));
      incrementBlocker("Ateliers risques bloques", riskBlockedWorkshops);

      const blockersTop5 = Array.from(blockerCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const dataQuality = {
        total: qualityTotalTracked,
        missingOwnerPct: Math.round(pct(qualityMissingOwner, Math.max(qualityTotalTracked, 1))),
        missingDuePct: Math.round(pct(qualityMissingDue, Math.max(qualityTotalTracked, 1))),
        incoherentStatusPct: Math.round(pct(qualityIncoherentStatus, Math.max(qualityTotalTracked, 1))),
      };

      const snapshotMetrics = dashboardSnapshots
        .map((snapshot: any) => {
          const monthDate = parseDate(snapshot?.monthStartUtc, snapshot?.MonthStartUtc);
          if (!monthDate) return null;
          return {
            monthStartUtc: new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1)),
            globalConformity: toNum(snapshot?.globalConformity ?? snapshot?.GlobalConformity),
            incidentsCount: toNum(snapshot?.incidentsCount ?? snapshot?.IncidentsCount),
            auditsCompleted: toNum(snapshot?.auditsCompleted ?? snapshot?.AuditsCompleted),
            pdcaCompleted: toNum(snapshot?.pdcaCompleted ?? snapshot?.PdcaCompleted),
          };
        })
        .filter((item): item is {
          monthStartUtc: Date;
          globalConformity: number;
          incidentsCount: number;
          auditsCompleted: number;
          pdcaCompleted: number;
        } => item !== null)
        .sort((a, b) => b.monthStartUtc.getTime() - a.monthStartUtc.getTime());

      const currentMonthTs = monthStartCurrent.getTime();
      const previousSnapshot = snapshotMetrics.find((snapshot) => snapshot.monthStartUtc.getTime() < currentMonthTs);
      const currentSnapshot = snapshotMetrics.find((snapshot) => snapshot.monthStartUtc.getTime() === currentMonthTs);
      const previousGlobalConformity = previousSnapshot?.globalConformity ?? currentSnapshot?.globalConformity ?? globalConformity;

      const monthlyVariations = {
        globalConformity: {
          current: globalConformity,
          previous: previousGlobalConformity,
          changePct: computePercentChange(globalConformity, previousGlobalConformity),
        },
        incidents: {
          current: incidentsCurrentMonth,
          previous: incidentsPreviousMonth,
          changePct: computePercentChange(incidentsCurrentMonth, incidentsPreviousMonth),
        },
        auditsCompleted: {
          current: auditsCompletedCurrentMonth,
          previous: auditsCompletedPreviousMonth,
          changePct: computePercentChange(auditsCompletedCurrentMonth, auditsCompletedPreviousMonth),
        },
        pdcaCompleted: {
          current: pdcaCompletedCurrentMonth,
          previous: pdcaCompletedPreviousMonth,
          changePct: computePercentChange(pdcaCompletedCurrentMonth, pdcaCompletedPreviousMonth),
        },
      };

      const sla = {
        incidentsClosureDays: averageDays(incidentCloseSlaDays),
        ncTreatmentDays: averageDays(ncTreatmentSlaDays),
        documentationApprovalDays: averageDays(docApprovalSlaDays),
      };

      const riskHeatmap = Array.from({ length: 4 }).flatMap((_, gIndex) =>
        Array.from({ length: 4 }).map((__, lIndex) => {
          const gravity = gIndex + 1;
          const likelihood = lIndex + 1;
          const key = `${gravity}x${likelihood}`;
          return {
            gravity,
            likelihood,
            value: riskHeatmapCells.get(key) ?? 0,
          };
        })
      );

      const readiness = {
        score: globalConformity,
        components: {
          clauses: Math.round(toNum(clauseStats?.averageConformity)),
          controles: controlsConformityRate,
          documentation: docsConformityRate,
          pdca: Math.round(toNum(pdca.global)),
          risques: riskAverageProgress,
        },
      };

      if (canPersistSnapshots) {
        await axiosInstance
          .post("/api/dashboard/snapshots/upsert", {
            monthStartUtc: monthStartCurrent.toISOString(),
            globalConformity,
            incidentsCount: incidentsCurrentMonth,
            auditsCompleted: auditsCompletedCurrentMonth,
            pdcaCompleted: pdcaCompletedCurrentMonth,
          })
          .catch(() => {
            // Silent fallback: dashboard remains fully functional even when snapshot save is unavailable.
          });
      }

      const data = {
        overview: {
          incidents: { total: incidents.length, open: incidentsInProgress, resolved: incidentsResolved },
          audits: { planned: auditPlannedCount, inProgress: auditInProgressCount, done: auditCompletedCount },
          trainings: {
            total: toNum(trainingDashboard?.total) || formations.length,
            planned: toNum(trainingDashboard?.planifiees) || formationsPlanned,
            inProgress: toNum(trainingDashboard?.enCours) || formationsInProgress,
            done: toNum(trainingDashboard?.terminees) || formationsCompleted,
          },
          assets: { total: totalAssets, toReview: assetsToReview },
          conformityGlobal: globalConformity,
          conformityByDomain,
          pdcaProgress: {
            plan: pdca.plan.value,
            do: pdca.do.value,
            check: pdca.check.value,
            act: pdca.act.value,
          },
          actionsLateVsDone: [
            {
              name: "Clauses",
              done: toNum(clauseStats?.completedActions),
              late: toNum(clauseStats?.delayedActions),
            },
            {
              name: "Controles",
              done: controlsConforme,
              late: controlsActionsRetard,
            },
            {
              name: "PDCA",
              done: pdca.done,
              late: pdca.todo,
            },
            {
              name: "Audits",
              done: auditCompletedCount,
              late: auditOpenNcCount,
            },
          ],
          trainingsBreakdown: trainingBreakdown,
          incidentsTrend,
          priorities: {
            total: sortedPriorityPool.length,
            overdue: sortedPriorityPool.filter((item) => item.urgency === "critique").length,
            dueSoon: sortedPriorityPool.filter((item) => item.urgency === "haute").length,
            inProgress: sortedPriorityPool.filter((item) => item.state === "En cours" || item.state === "En traitement").length,
            docsValidationAged: docsValidationAgedCount,
            ncsOpenThisWeek: ncsOpenThisWeekCount,
            validationThresholdDays: docValidationDelayThresholdDays,
            list: sortedPriorities,
          },
          activity30d: {
            created: totalCreated30d,
            completed: totalCompleted30d,
            trend: rolling30.buckets,
            byModule: activityByModule,
            monthlyVariations,
          },
          sla,
          blockersTop5,
          dataQuality,
          riskQuick: {
            heatmap: riskHeatmap,
            residualCritical: residualRiskCriticalCount,
          },
          readiness,
          workloadByOwner: {
            totalOwners: ownerLoadItems.length,
            items: ownerLoadItems,
          },
        },
        clauses: {
          conformiteGlobale: clausesConformityRate,
          clausesConformes: clausesConformesCount,
          plansAction: toNum(clauseStats?.totalActions),
          actionsRetard: toNum(clauseStats?.delayedActions),
          totalClauses: toNum(clauseStats?.totalClauses),
          inProgressActions: toNum(clauseStats?.inProgressActions),
          nonConformeClauses: clausesNonConformesCount,
          table: clausesTable,
        },
        controls: {
          conformiteGlobale: controlsConformityRate,
          conformes: controlsConforme,
          nonConformes: controlsNonConforme,
          ncMineure: controlsNcMineure,
          ncMajeure: controlsNcMajeure,
          actionsRetard: controlsActionsRetard,
          inProgressActions: controlsInProgressActions,
          byDomain: controlsByDomain,
        },
        assets: {
          conformiteGlobale: assetsConformityRate,
          recenses: totalAssets,
          primaires: clampedAssetPrimaires,
          supports: clampedAssetSupports,
          secret: assetSecret,
          topSecret: assetTopSecret,
          aRevoir: assetsToReview,
        },
        documentation: {
          conformiteGlobale: docsConformityRate,
          approuves: docsApproved,
          enValidation: docsValidation,
          aRevoir: docsReview,
          brouillons: docsDraft,
        },
        pdca: {
          conformitePdca: Math.round(toNum(pdca.global)),
          actionsTerminees: pdca.done,
          inProgress: pdca.inProgress,
          todo: pdca.todo,
          plan: pdca.plan,
          do: pdca.do,
          check: pdca.check,
          act: pdca.act,
        },
        risks: {
          progressionMoyenne: riskAverageProgress,
          etudes: riskStudies.length,
          enCours: riskOngoingStudies,
          ateliersAValider: riskToValidateWorkshops,
          etudesTerminees: riskDoneStudies,
          ateliersBloques: riskBlockedWorkshops,
          workshopStatus: buildRiskWorkshopStatus(riskStudies),
          studies: buildRiskStudiesProgress(riskStudies),
          studiesStatus: buildRiskStudiesStatus(riskStudies),
        },
        audits: {
          total: audits.length,
          planifies: auditPlannedCount,
          enCours: auditInProgressCount,
          termines: auditCompletedCount,
          ncOuvertes: auditOpenNcCount,
          simulations: auditSims.length,
          actionsLateVsDone: [
            { name: "Audits", done: auditCompletedCount, late: auditOpenNcCount },
          ],
          actionPlans: auditsActionPlans,
        },
        trainings: {
          tauxParticipation: Math.round(attendanceRateGlobal),
          total: toNum(trainingDashboard?.total) || formations.length,
          planifiees: toNum(trainingDashboard?.planifiees) || formationsPlanned,
          enCours: toNum(trainingDashboard?.enCours) || formationsInProgress,
          terminees: toNum(trainingDashboard?.terminees) || formationsCompleted,
          participants: participantsAttended,
          invites: participantsInvited,
          breakdown: trainingBreakdown,
        },
        incidents: {
          total: incidents.length,
          enCours: incidentsInProgress,
          resolus: incidentsResolved,
          trend: incidentsTrend,
          list: incidentsList,
        },
      };

      setState({ data, loading: false, refreshing: false, error: "", warnings });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        refreshing: false,
        error: error?.message || "Impossible de charger les donnees du dashboard.",
        warnings: [],
      });
    }
  }, [canPersistSnapshots]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh]
  );
}
