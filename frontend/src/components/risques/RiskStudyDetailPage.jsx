import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  FileText,
  MapPinned,
  Save,
  UserRound,
} from "lucide-react";
import { useRiskStudies } from "./RiskStudiesContext";
import {
  WORKSHOP_META,
  getEffectiveWorkshopStatus,
  getStudyProgress,
  getWorkshopProgress,
  isWorkshopBlocked,
} from "./riskModel";
import { printWorkshopLivrable } from "./riskExport";
import { RiskCallout, RiskCard, RiskKpiTile, RiskPageHeader, RiskProgressBar, RiskStatusBadge } from "./RiskUi";

function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function compactWorkshopTitle(rawTitle, workshopId) {
  if (!rawTitle) return `Atelier ${workshopId}`;
  return rawTitle.replace(/^Atelier\s+\d+\s*[-–]\s*/i, "").trim();
}

function getWorkshopCardKpis(study, workshopId, stepsCount) {
  const w1 = study?.workshop1 || {};
  const w2 = study?.workshop2 || {};
  const w3 = study?.workshop3 || {};
  const w4 = study?.workshop4 || {};
  const w5 = study?.workshop5 || {};

  if (workshopId === 1) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Missions", value: countItems(w1.missions) },
      { label: "Evt redoutes", value: countItems(w1.fearedEvents) },
    ];
  }

  if (workshopId === 2) {
    const totalPairs = countItems(w2.sourceObjectivePairs);
    const retainedPairs = (w2.sourceObjectivePairs || []).filter((pair) => pair?.retained).length;
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Couples retenus", value: `${retainedPairs}/${totalPairs}` },
      { label: "Sources", value: countItems(w2.riskSources) },
    ];
  }

  if (workshopId === 3) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Parties prenantes", value: countItems(w3.stakeholders) },
      { label: "Scenarios strat.", value: countItems(w3.strategicScenarios) },
    ];
  }

  if (workshopId === 4) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Modes operatoires", value: countItems(w4.operationalModes) },
      { label: "Scenarios op.", value: countItems(w4.operationalScenarios) },
    ];
  }

  if (workshopId === 5) {
    const riskEntries = w5.riskEntries || [];
    const criticalRisks = riskEntries.filter((risk) => Number(risk?.gravity || 0) * Number(risk?.likelihood || 0) >= 10).length;
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Risques registre", value: riskEntries.length },
      { label: "Risques critiques", value: criticalRisks },
    ];
  }

  return [{ label: "Etapes", value: stepsCount }];
}

export default function RiskStudyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getStudyById, updateStudyMeta, loading } = useRiskStudies();
  const study = getStudyById(id);

  const [editMeta, setEditMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState(() => ({
    name: study?.name || "",
    organization: study?.organization || "",
    perimeter: study?.perimeter || "",
    author: study?.author || "",
    description: study?.description || "",
  }));

  useEffect(() => {
    setMetaDraft({
      name: study?.name || "",
      organization: study?.organization || "",
      perimeter: study?.perimeter || "",
      author: study?.author || "",
      description: study?.description || "",
    });
  }, [study?.id, study?.name, study?.organization, study?.perimeter, study?.author, study?.description]);

  const progress = useMemo(() => (study ? getStudyProgress(study) : null), [study]);
  const blockedCount = useMemo(
    () => (study ? WORKSHOP_META.filter((workshop) => isWorkshopBlocked(study, workshop.id)).length : 0),
    [study],
  );

  if (loading && !study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Chargement de l'etude...</h2>
          <p className="mt-2 text-sm text-slate-500">Synchronisation avec la base de donnees en cours.</p>
        </RiskCard>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Etude introuvable</h2>
          <p className="mt-2 text-sm text-slate-500">Cette etude n'existe pas ou a ete supprimee.</p>
          <button type="button" onClick={() => navigate("/risques")} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Retour au portefeuille
          </button>
        </RiskCard>
      </div>
    );
  }

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          variant="hero"
          title={study.name}
          subtitle={study.description || "Aucune description renseignee."}
          actions={(
            <>
              <button type="button" onClick={() => navigate("/risques")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <ArrowLeft size={14} /> Retour portefeuille
              </button>
            </>
          )}
        />

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile label="Progression globale" value={`${progress.pct}%`} helper={`${progress.done}/5 ateliers termines`} primary progress={progress.pct} />
            <RiskKpiTile label="Ateliers termines" value={`${progress.done}/5`} tone="success" helper={`${5 - progress.done} restants`} />
            <RiskKpiTile label="A valider" value={progress.toValidate} tone="warning" helper="Validation metier requise" />
            <RiskKpiTile
              label="Ateliers bloques"
              value={blockedCount}
              tone={blockedCount > 0 ? "warning" : "success"}
              helper={blockedCount > 0 ? "A debloquer via l'atelier precedent" : "Aucun blocage"}
            />
          </div>
        </div>

        <main className="space-y-4">
          <RiskCard className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <Building2 size={13} /> {study.organization || "Organisation -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <MapPinned size={13} /> {study.perimeter || "Perimetre -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <UserRound size={13} /> {study.author || "Auteur -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <CalendarDays size={13} /> Creation {study.createdAt || "-"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditMeta((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={13} /> {editMeta ? "Fermer edition" : "Modifier fiche"}
              </button>
            </div>

            {editMeta ? (
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.name} placeholder="Nom" onChange={(event) => setMetaDraft((prev) => ({ ...prev, name: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.organization} placeholder="Organisation" onChange={(event) => setMetaDraft((prev) => ({ ...prev, organization: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.perimeter} placeholder="Perimetre" onChange={(event) => setMetaDraft((prev) => ({ ...prev, perimeter: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.author} placeholder="Auteur" onChange={(event) => setMetaDraft((prev) => ({ ...prev, author: event.target.value }))} />
                <textarea className="min-h-[90px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.description} placeholder="Description" onChange={(event) => setMetaDraft((prev) => ({ ...prev, description: event.target.value }))} />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { updateStudyMeta(study.id, metaDraft); setEditMeta(false); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <Save size={14} /> Enregistrer
                  </button>
                  <button type="button" onClick={() => { setEditMeta(false); setMetaDraft({ name: study.name || "", organization: study.organization || "", perimeter: study.perimeter || "", author: study.author || "", description: study.description || "" }); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}
          </RiskCard>

          <RiskCallout tone="info" title="Workflow automatique">
            Atelier N bloque tant que l'atelier N-1 n'est pas termine. Le livrable apparait automatiquement au statut "Termine".
          </RiskCallout>

          <div className="risk-workshop-grid">
            {WORKSHOP_META.map((workshop) => {
                const status = getEffectiveWorkshopStatus(study, workshop.id);
                const blocked = isWorkshopBlocked(study, workshop.id);
                const pct = getWorkshopProgress(study, workshop.id);
                const workshopKpis = getWorkshopCardKpis(study, workshop.id, workshop.steps.length);
                const workshopNumber = String(workshop.id).padStart(2, "0");
                const workshopCount = String(WORKSHOP_META.length).padStart(2, "0");
                const cleanTitle = compactWorkshopTitle(workshop.title, workshop.id);
                const accentByWorkshop = ["#2563eb", "#059669", "#0ea5e9", "#4f46e5", "#d97706"];
                const accent = accentByWorkshop[(workshop.id - 1) % accentByWorkshop.length];

                return (
                  <RiskCard
                    key={workshop.id}
                    className={`risk-workshop-card risk-workshop-card-modern p-5 ${blocked ? "risk-workshop-card-blocked cursor-not-allowed" : "cursor-pointer"}`}
                    style={{ "--risk-workshop-accent": accent }}
                    role="button"
                    tabIndex={blocked ? -1 : 0}
                    onClick={() => {
                      if (!blocked) navigate(`/risques/etudes/${study.id}/atelier/${workshop.id}`);
                    }}
                    onKeyDown={(event) => {
                      if (blocked) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/risques/etudes/${study.id}/atelier/${workshop.id}`);
                      }
                    }}
                  >
                    <div className="risk-card-headline">
                      <div>
                        <p className="risk-workshop-counter">{workshopNumber} / {workshopCount}</p>
                        <h3 className="risk-workshop-title mt-1 text-xl font-black tracking-tight text-slate-900">{cleanTitle}</h3>
                        <p className="risk-workshop-description mt-1.5 text-sm text-slate-500">{workshop.description}</p>
                      </div>
                      <RiskStatusBadge status={status} />
                    </div>

                    <div className="risk-workshop-divider mt-3" />

                    <div className="mt-3">
                      <div className="risk-workshop-kpi-grid">
                        {workshopKpis.map((kpi) => (
                          <div key={`${workshop.id}-${kpi.label}`} className="risk-workshop-kpi-box">
                            <span className="risk-workshop-kpi-label">{kpi.label}</span>
                            <span className="risk-workshop-kpi-value">{kpi.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="risk-workshop-footer mt-4 flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {status === "termine" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              printWorkshopLivrable(study, workshop.id);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FileText size={14} /> Livrable
                          </button>
                        ) : null}
                        {blocked ? (
                          <span className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">Atelier bloque</span>
                        ) : null}
                      </div>
                      <div className="risk-workshop-footer-progress">
                        <RiskProgressBar
                          value={pct}
                          centerLabel={`${pct}%`}
                          rightLabel={pct === 100 ? "" : "finalisation"}
                          size={62}
                          stroke={7}
                        />
                      </div>
                    </div>

                    {status === "a_valider" ? (
                      <div className="mt-3">
                        <RiskCallout tone="warning" title="A valider">
                          L'atelier est pret a validation. Complete les champs requis pour atteindre automatiquement "Termine".
                        </RiskCallout>
                      </div>
                    ) : null}
                  </RiskCard>
                );
              })}
          </div>
        </main>
      </div>
    </div>
  );
}
