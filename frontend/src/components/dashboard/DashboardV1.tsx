import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "./utils";
import { useDashboardV1Data } from "../../hooks/useDashboardV1Data";
import { OverviewModule } from "./modules/OverviewModule";
import { ControlesModule } from "./modules/ControlesModule";
import { ClausesModule } from "./modules/ClausesModule";
import { AssetsModule } from "./modules/AssetsModule";
import { DocumentationModule } from "./modules/DocumentationModule";
import { PdcaModule } from "./modules/PdcaModule";
import { AuditsModule } from "./modules/AuditsModule";
import { RisksModule } from "./modules/RisksModule";
import { TrainingsModule } from "./modules/TrainingsModule";
import { IncidentsModule } from "./modules/IncidentsModule";

const modules = [
  { value: "overview", label: "Vue d'ensemble", Component: OverviewModule },
  { value: "controles", label: "Controles", Component: ControlesModule },
  { value: "clauses", label: "Clauses", Component: ClausesModule },
  { value: "actifs", label: "Actifs", Component: AssetsModule },
  { value: "documentation", label: "Documentation", Component: DocumentationModule },
  { value: "pdca", label: "PDCA", Component: PdcaModule },
  { value: "audits", label: "Audits", Component: AuditsModule },
  { value: "risques", label: "Risques", Component: RisksModule },
  { value: "formations", label: "Formations", Component: TrainingsModule },
  { value: "incidents", label: "Incidents", Component: IncidentsModule },
];

export default function DashboardV1() {
  const [tab, setTab] = useState("overview");
  const { user, canWrite, canEdit } = useAuth();
  const canPersistSnapshots = canWrite("dashboard") || canEdit("dashboard");
  const { data, loading, refreshing, error, warnings, refresh } = useDashboardV1Data({ canPersistSnapshots });
  const dashboardFont = "'Sora', 'Inter', 'Segoe UI', sans-serif";

  const userDisplayName = useMemo(() => {
    const nomComplet = (user?.nomComplet || user?.NomComplet || "").trim();
    if (nomComplet) return nomComplet;

    const prenom = (user?.prenom || user?.Prenom || user?.firstName || user?.FirstName || "").trim();
    const nom = (user?.nom || user?.Nom || user?.lastName || user?.LastName || "").trim();
    const fullName = [prenom, nom].filter(Boolean).join(" ");
    if (fullName) return fullName;

    const email = (user?.email || user?.Email || "").trim();
    if (email) return email.split("@")[0];

    return "Utilisateur";
  }, [user]);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeModule = useMemo(
    () => modules.find((module) => module.value === tab) ?? modules[0],
    [tab]
  );

  return (
    <div className="min-h-screen w-full bg-[#f8f9fb]" style={{ fontFamily: dashboardFont }}>
      <main className="mx-auto w-full max-w-[1450px] px-4 py-8 pb-14 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                <Sparkles className="h-3 w-3" />
                {today}
              </div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">
                Bonjour {userDisplayName}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Vue de pilotage globale
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm md:inline-flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Donnees synchronisees
              </div>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Actualiser
              </button>
            </div>
          </div>
        </motion.div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>
        ) : null}
        {!error && warnings.length > 0 ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
            Certaines sources API sont indisponibles: {warnings.join(" ")} Les KPI affiches peuvent etre partiels.
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap gap-2">
          {modules.map((module) => {
            const isActive = module.value === tab;
            return (
              <button
                key={module.value}
                type="button"
                onClick={() => setTab(module.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-blue-700 text-white shadow-[0_4px_12px_rgba(29,78,216,.28)]"
                    : "border border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                )}
              >
                {module.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.value}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {loading && !data ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des KPI reels...
              </div>
            ) : (
              <activeModule.Component data={data} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
