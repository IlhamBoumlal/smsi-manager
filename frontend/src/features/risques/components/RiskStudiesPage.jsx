import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useRiskStudies } from "../../../hooks/useRiskStudies";
import {
  ANSSI_BASE,
  MITRE_TACTICS,
  getEffectiveWorkshopStatus,
  getStudyProgress,
  WORKSHOP_META,
} from "../riskModel";
import { RiskCard, RiskKpiTile, RiskModal, RiskPageHeader, RiskProgressBar, RiskSectionHeader, RiskStatusBadge } from "./RiskUi";
import { useAuth } from "../../../hooks/useAuth";
import { appConfirm } from "../../../utils/appDialogs";

function StudyCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", organization: "", description: "", perimeter: "", author: "" });
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const ok = await onSubmit(form);
      if (ok) {
        setForm({ name: "", organization: "", description: "", perimeter: "", author: "" });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <RiskModal open={open} onClose={onClose} title="Nouvelle etude de risques">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nom de l'etude *</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Organisation</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.organization} onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Auteur</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.author} onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Perimetre</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.perimeter} onChange={(event) => setForm((prev) => ({ ...prev, perimeter: event.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
          <textarea className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={creating} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          Annuler
        </button>
        <button type="button" onClick={submit} disabled={!form.name.trim() || creating} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {creating ? "Creation..." : "Creer l'etude"}
        </button>
      </div>
    </RiskModal>
  );
}

function KnowledgeModal({ open, onClose }) {
  const gravityToneClass = {
    emerald: "border-emerald-200 bg-emerald-100 text-emerald-700",
    amber: "border-amber-200 bg-amber-100 text-amber-700",
    orange: "border-orange-200 bg-orange-100 text-orange-700",
    red: "border-red-200 bg-red-100 text-red-700",
  };

  return (
    <RiskModal open={open} onClose={onClose} title="Referentiels MITRE / ANSSI" size="max-w-6xl">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RiskCard>
          <RiskSectionHeader title="MITRE ATT&CK" subtitle="Tactiques de reference" />
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {MITRE_TACTICS.map((tactic) => (
              <div key={tactic.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="mb-2 text-sm font-bold text-slate-900">{tactic.name}</div>
                <div className="space-y-1 text-xs text-slate-600">
                  {tactic.techniques.map((technique) => (
                    <div key={technique} className="rounded-md border border-slate-200 bg-white px-2 py-1">
                      {technique}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RiskCard>

        <RiskCard>
          <RiskSectionHeader title="Base ANSSI" subtitle="Socle de reference pour la qualification des risques" />
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-base font-black text-blue-700">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <BookOpen size={14} />
                </span>
                {ANSSI_BASE.guideTitle}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{ANSSI_BASE.guideDescription}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[13px] font-black text-orange-600">Sources de risque types</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                  {ANSSI_BASE.sources.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[13px] font-black text-blue-700">Objectifs vises types</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                  {ANSSI_BASE.objectifs.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[13px] font-black text-emerald-700">Referentiels associes</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ANSSI_BASE.references.map((item) => (
                  <span key={item} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[13px] font-black text-blue-700">Echelle de gravite EBIOS RM</div>
              <div className="mt-3 space-y-2">
                {ANSSI_BASE.gravityScale.map((entry) => (
                  <div key={entry.level} className="flex items-center gap-3 text-[13px] text-slate-700">
                    <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold ${gravityToneClass[entry.tone] || gravityToneClass.emerald}`}>
                      {entry.level}
                    </span>
                    <span className="font-semibold">{entry.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RiskCard>
      </div>
    </RiskModal>
  );
}

function studyStatus(study) {
  const progress = getStudyProgress(study);
  if (progress.done === 5) return "termine";
  return progress.status;
}

export default function RiskStudiesPage() {
  const navigate = useNavigate();
  const { canWrite, canDelete } = useAuth();
  const moduleCode = "risques";
  const canCreateStudy = canWrite(moduleCode);
  const canDeleteStudy = canDelete(moduleCode);
  const { studies, createStudy, deleteStudy, refreshStudies, loading, error, clearError } = useRiskStudies();
  const [createOpen, setCreateOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const global = useMemo(() => {
    const done = studies.filter((study) => getStudyProgress(study).done === 5).length;
    const ongoing = studies.filter((study) => getStudyProgress(study).status === "en_cours").length;
    const toValidate = studies.reduce((count, study) => count + getStudyProgress(study).toValidate, 0);
    const avg = studies.length ? Math.round(studies.reduce((sum, study) => sum + getStudyProgress(study).pct, 0) / studies.length) : 0;
    return { done, ongoing, toValidate, avg };
  }, [studies]);

  const visibleStudies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = studies.filter((study) => {
      const matchesQuery = !q || [study.name, study.organization, study.perimeter, study.author, study.description].some((value) => String(value || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || studyStatus(study) === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }, [studies, query, statusFilter]);

  const hasFilters = query.trim() || statusFilter !== "all";
  const statusTabs = useMemo(() => ([
    { value: "all", label: "Tous", count: studies.length, tone: "all", icon: Search },
    { value: "non_evalue", label: "Non evalues", count: studies.filter((study) => studyStatus(study) === "non_evalue").length, tone: "non_evalue", icon: CircleSlash },
    { value: "en_cours", label: "En cours", count: studies.filter((study) => studyStatus(study) === "en_cours").length, tone: "en_cours", icon: Clock3 },
    { value: "a_valider", label: "A valider", count: studies.filter((study) => studyStatus(study) === "a_valider").length, tone: "a_valider", icon: AlertCircle },
    { value: "termine", label: "Termines", count: studies.filter((study) => studyStatus(study) === "termine").length, tone: "termine", icon: CheckCircle2 },
  ]), [studies]);

  const statusToneClass = {
    all: {
      activeBtn: "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]",
      inactiveBtn: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      inactivePill: "border-slate-200 bg-slate-100 text-slate-600",
    },
    non_evalue: {
      activeBtn: "border-slate-700 bg-slate-700 text-white shadow-[0_10px_24px_rgba(51,65,85,0.22)]",
      inactiveBtn: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      inactivePill: "border-slate-200 bg-white text-slate-600",
    },
    en_cours: {
      activeBtn: "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]",
      inactiveBtn: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      inactivePill: "border-blue-200 bg-white text-blue-700",
    },
    a_valider: {
      activeBtn: "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)]",
      inactiveBtn: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      inactivePill: "border-amber-200 bg-white text-amber-700",
    },
    termine: {
      activeBtn: "border-emerald-600 bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)]",
      inactiveBtn: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      inactivePill: "border-emerald-200 bg-white text-emerald-700",
    },
  };

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          title="Etudes de risques"
          subtitle="Portefeuille multi-etudes EBIOS RM avec pilotage des statuts, progression automatique et acces direct aux ateliers."
          actions={(
            <>
              <button onClick={() => setKnowledgeOpen(true)} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <BookOpen size={15} /> MITRE / ANSSI
              </button>
              {canCreateStudy && (
                <button onClick={() => setCreateOpen(true)} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                  <Plus size={15} /> Nouvelle etude
                </button>
              )}
            </>
          )}
        />

        {error ? (
          <RiskCard className="border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={clearError} className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-100">
                Fermer
              </button>
            </div>
          </RiskCard>
        ) : null}

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile
              label="Progression moyenne"
              value={`${global.avg}%`}
              helper={`${studies.length} etude${studies.length > 1 ? "s" : ""}`}
              primary
              progress={global.avg}
            />
            <RiskKpiTile label="Etudes" value={studies.length} helper={`${global.done} terminee${global.done > 1 ? "s" : ""}`} />
            <RiskKpiTile label="En cours" value={global.ongoing} tone="info" helper={`${global.toValidate} a valider`} />
            <RiskKpiTile label="Ateliers a valider" value={global.toValidate} tone="warning" />
            <RiskKpiTile label="Etudes terminees" value={global.done} tone="success" helper={`${Math.max(0, studies.length - global.done)} restantes`} />
          </div>
        </div>

        <RiskCard className="risk-command-toolbar p-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {statusTabs.map((tab) => {
                  const active = statusFilter === tab.value;
                  const tone = statusToneClass[tab.tone] || statusToneClass.all;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 ${
                        active ? tone.activeBtn : tone.inactiveBtn
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                      <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${
                        active ? "border-white/20 bg-white/20 text-white" : tone.inactivePill
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void refreshStudies()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={14} />
                {loading ? "Actualisation..." : "Actualiser"}
              </button>
            </div>

            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Rechercher une etude..."
              />
            </div>

            {hasFilters ? (
              <div className="flex justify-end">
                <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); }} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                  <X size={13} /> Reinit
                </button>
              </div>
            ) : null}

          </div>
        </RiskCard>

        <section className="space-y-4">
            {loading ? (
              <RiskCard className="p-10 text-center">
                <ShieldCheck size={34} className="mx-auto animate-pulse text-blue-600" />
                <h2 className="mt-3 text-xl font-black text-slate-900">Chargement des etudes...</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  Synchronisation du portefeuille risques avec la base de donnees.
                </p>
              </RiskCard>
            ) : !visibleStudies.length ? (
              <RiskCard className="p-10 text-center">
                <ShieldCheck size={34} className="mx-auto text-blue-600" />
                <h2 className="mt-3 text-xl font-black text-slate-900">{studies.length ? "Aucune etude sur ce filtre" : "Aucune etude pour le moment"}</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  {studies.length ? "Change les filtres ou lance une nouvelle etude." : "Cree ta premiere etude de risque EBIOS RM pour lancer le workflow complet sur les 5 ateliers."}
                </p>
                {canCreateStudy && (
                  <button onClick={() => setCreateOpen(true)} type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <Plus size={14} /> Creer une etude
                  </button>
                )}
              </RiskCard>
            ) : (
              <div className="risk-study-grid">
                {visibleStudies.map((study) => {
                  const progress = getStudyProgress(study);
                  const status = studyStatus(study);
                  const statuses = WORKSHOP_META.map((workshop) => getEffectiveWorkshopStatus(study, workshop.id));
                  const doneCount = statuses.filter((item) => item === "termine").length;
                  const activeCount = statuses.filter((item) => item === "en_cours").length;
                  const validateCount = statuses.filter((item) => item === "a_valider").length;

                  return (
                    <RiskCard
                      key={study.id}
                      className="risk-study-card cursor-pointer p-4 pl-5"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/risques/etudes/${study.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/risques/etudes/${study.id}`);
                        }
                      }}
                    >
                      <div className="risk-study-card-headline-row">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-slate-900">{study.name}</h3>
                          <p className="risk-study-description mt-1.5 text-sm text-slate-500">{study.description || "Etude sans description"}</p>
                        </div>
                        <RiskStatusBadge status={status} />
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="risk-study-meta-list">
                            <span className="risk-study-meta-item">
                              <Building2 size={12} />
                              <span className="truncate">Perimetre: {study.perimeter || "-"}</span>
                            </span>
                            <span className="risk-study-meta-item">
                              <UserRound size={12} />
                              <span className="truncate">Auteur: {study.author || "-"}</span>
                            </span>
                            <span className="risk-study-meta-item">
                              <CalendarDays size={12} />
                              <span className="truncate">Maj: {study.updatedAt || "-"}</span>
                            </span>
                          </div>

                          <div className="risk-study-progress-band mt-3">
                            <div className="risk-study-progress-head">
                              <span className="text-slate-700">Ateliers termines</span>
                              <span>{doneCount}/5</span>
                            </div>
                            <div className="risk-study-workshop-segments" aria-label="Progression des ateliers">
                              {statuses.map((workshopStatus, index) => (
                                <span
                                  key={`${study.id}-${index + 1}`}
                                  className={`risk-study-workshop-segment risk-seg-${workshopStatus}`}
                                  title={`Atelier ${index + 1}`}
                                />
                              ))}
                            </div>
                            <div className="risk-study-progress-sub">
                              <span>{activeCount} en cours</span>
                              <span>{validateCount} a valider</span>
                            </div>
                          </div>
                        </div>
                        <RiskProgressBar value={progress.pct} centerLabel={`${progress.pct}%`} rightLabel={`${progress.done}/5`} size={76} />
                      </div>

                      {canDeleteStudy && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={async (event) => {
                              event.stopPropagation();
                              const confirmed = await appConfirm(`Supprimer l'etude "${study.name || "sans nom"}" ? Cette action est irreversible.`, {
                                title: "Supprimer l'etude",
                                confirmText: "Supprimer",
                              });
                              if (!confirmed) return;
                              void deleteStudy(study.id);
                            }}
                            type="button"
                            aria-label="Supprimer l'etude"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </RiskCard>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <StudyCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          if (!canCreateStudy) return false;
          const created = await createStudy(payload);
          if (!created) return false;
          setCreateOpen(false);
          navigate(`/risques/etudes/${created.id}`);
          return true;
        }}
      />
      <KnowledgeModal open={knowledgeOpen} onClose={() => setKnowledgeOpen(false)} />
    </div>
  );
}
