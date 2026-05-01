import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { getAllAudits, getAllNCs, getAllSimulations } from "../../api/audits";
import { getGlobalStats, getDashboard as getClausesDashboard } from "../../api/clauses";
import { getCycles, getCycle } from "../../api/pdca";
import { getRiskStudies } from "../../api/risques";
import { getDashboard as getTrainingDashboard, getFormations } from "../../api/sensibilisation";
import { getEffectiveWorkshopStatus, getStudyProgress, getWorkshopProgress } from "../risques/riskModel";

const safeArray = (value: any): any[] => (Array.isArray(value) ? value : []);
const toNum = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const average = (values: number[]): number =>
  values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
const pct = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);
const normalize = (value: any): string => String(value ?? "").trim().toLowerCase();
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

function normalizeControlStatus(raw: any): "conforme" | "nc_majeure" | "nc_mineure" | "remarque" | "non_evalue" {
  const status = normalize(raw);
  if (status === "1" || status.includes("conforme")) return "conforme";
  if (status === "4" || status.includes("majeure")) return "nc_majeure";
  if (status === "3" || status.includes("mineure")) return "nc_mineure";
  if (status === "2" || status.includes("remarque")) return "remarque";
  return "non_evalue";
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

export function useDashboardV1Data() {
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

      let controlsConforme = 0;
      let controlsNcMineure = 0;
      let controlsNcMajeure = 0;
      let controlsNonConforme = 0;
      let controlsNonEvalue = 0;
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
        } else if (status === "remarque") {
          controlsNonConforme += 1;
        } else {
          controlsNonEvalue += 1;
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
        const status = normalize(doc?.status ?? doc?.Status);
        if (status.includes("approuve") || status.includes("approve")) docsApproved += 1;
        else if (status.includes("validation")) docsValidation += 1;
        else if (status.includes("revoir") || status.includes("review")) docsReview += 1;
        else if (status.includes("brouillon") || status.includes("draft")) docsDraft += 1;
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

      const controlsConformityRate = Math.round(pct(controlsConforme, Math.max(controls.length - controlsNonEvalue, 1)));
      const docsConformityRate = Math.round(pct(docsApproved, documents.length));
      const assetsConformityRate = totalAssets
        ? Math.round(((clampedAssetSupports + clampedAssetPrimaires) / totalAssets) * 100)
        : 0;

      const globalConformity = Math.round(
        average([
          toNum(clauseStats?.averageConformity),
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
        .slice(0, 8)
        .map(({ sortTs, ...incident }) => incident);

      const conformityByDomain = [
        { name: "Clauses", value: Math.round(toNum(clauseStats?.averageConformity)) },
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
        },
        clauses: {
          conformiteGlobale: Math.round(toNum(clauseStats?.averageConformity)),
          clausesConformes: toNum(clauseStats?.conformeClauses),
          plansAction: toNum(clauseStats?.totalActions),
          actionsRetard: toNum(clauseStats?.delayedActions),
          totalClauses: toNum(clauseStats?.totalClauses),
          inProgressActions: toNum(clauseStats?.inProgressActions),
          nonConformeClauses: toNum(clauseStats?.nonConformeClauses),
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
        },
        audits: {
          total: audits.length,
          planifies: auditPlannedCount,
          enCours: auditInProgressCount,
          termines: auditCompletedCount,
          ncOuvertes: auditOpenNcCount,
          simulations: auditSims.length,
          actionsLateVsDone: [
            { name: "Clauses", done: toNum(clauseStats?.completedActions), late: toNum(clauseStats?.delayedActions) },
            { name: "Controles", done: controlsConforme, late: controlsActionsRetard },
            { name: "PDCA", done: pdca.done, late: pdca.todo },
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
  }, []);

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

