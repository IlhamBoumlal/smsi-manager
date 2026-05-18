import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Download,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { appAlert } from "../../utils/appDialogs";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";

const ACTION_LABELS = {
  read: "Lecture",
  create: "Ajout",
  edit: "Modification",
  delete: "Suppression",
  import: "Import",
  export: "Export",
  approve: "Approbation",
  administer: "Administration",
};

const MODULE_LABELS = {
  dashboard: "Tableau de bord",
  cartographie: "Cartographie",
  pdca: "PDCA",
  clauses: "Clauses",
  controles: "Controles",
  risques: "Risques",
  documentation: "Documentation",
  actifs: "Actifs",
  incidents: "Incidents",
  sensibilisation: "Sensibilisation",
  audit: "Audits",
  users: "Utilisateurs",
  roles: "Roles",
  tracabilite: "Tracabilite",
  societes: "Societes",
  holdings: "Holdings",
  statistiques: "Statistiques",
};

function actionBadgeClass(actionCode) {
  if (actionCode === "delete") return "bg-rose-50 text-rose-700 border-rose-200 shadow-sm";
  if (actionCode === "edit") return "bg-amber-50 text-amber-700 border-amber-200 shadow-sm";
  if (actionCode === "create") return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm";
  if (actionCode === "export") return "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm";
  return "bg-blue-50 text-blue-700 border-blue-200 shadow-sm";
}

function formatLocalDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("fr-FR");
}

function formatModuleLabel(moduleCode) {
  const key = String(moduleCode || "").trim().toLowerCase();
  return MODULE_LABELS[key] || moduleCode || "-";
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export default function GestionTracabilite() {
  const { canExport } = useAuth();
  const canExportLogs = canExport("tracabilite");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [moduleOptions, setModuleOptions] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pageSize, total]);

  const buildQueryString = useCallback(
    (withPagination = true) => {
      const params = new URLSearchParams();
      if (withPagination) {
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
      }
      if (search.trim()) params.set("search", search.trim());
      if (moduleFilter) params.set("module", moduleFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (fromDate) params.set("from", new Date(fromDate).toISOString());
      if (toDate) params.set("to", new Date(toDate).toISOString());
      return params.toString();
    },
    [actionFilter, fromDate, moduleFilter, page, pageSize, search, toDate]
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const qs = buildQueryString(true);
      const response = await apiFetch(`/api/tracabilite?${qs}`);

      setLogs(Array.isArray(response?.items) ? response.items : []);
      setTotal(Number(response?.total) || 0);
      setModuleOptions(Array.isArray(response?.moduleOptions) ? response.moduleOptions : []);
      setActionOptions(Array.isArray(response?.actionOptions) ? response.actionOptions : []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement de la tracabilite.");
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLogs();
    }, 180);

    return () => clearTimeout(timer);
  }, [loadLogs]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetFilters = () => {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = buildQueryString(false);
      const response = await fetch(`${API_URL}/api/tracabilite/export?${qs}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erreur ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tracabilite_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      await appAlert(err.message || "Erreur pendant l'export.", {
        title: "Export impossible",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={{ fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-[1450px] px-8 py-8 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Traceabilite des actions utilisateurs</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Journal des actions utilisateurs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadLogs()}
              className="h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>

            {canExportLogs && (
              <button
                onClick={() => void exportCsv()}
                disabled={exporting}
                className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-60"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export CSV
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher utilisateur, action, module..."
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={moduleFilter}
              onChange={(event) => {
                setModuleFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les modules</option>
              {moduleOptions.map((moduleCode) => (
                <option key={moduleCode} value={moduleCode}>
                  {formatModuleLabel(moduleCode)}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
              className="h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les actions</option>
              {actionOptions.map((actionCode) => (
                <option key={actionCode} value={actionCode}>
                  {ACTION_LABELS[actionCode] || actionCode}
                </option>
              ))}
            </select>

            <div className="relative">
              <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="datetime-local"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={resetFilters}
              className="h-11 px-4 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Reinitialiser filtres
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white/95 rounded-3xl border border-slate-200 overflow-hidden shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-bold uppercase tracking-[1px] text-slate-500">
                  <th className="px-5 py-4 text-left">Date</th>
                  <th className="px-5 py-4 text-left">Utilisateur</th>
                  <th className="px-5 py-4 text-left">Role utilisateur</th>
                  <th className="px-5 py-4 text-left">Module</th>
                  <th className="px-5 py-4 text-left">Action</th>
                  <th className="px-5 py-4 text-left">Description</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Chargement de la tracabilite...
                      </span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Aucune action a afficher.
                    </td>
                  </tr>
                ) : (
                  logs.map((item) => {
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-[#f8fbff]">
                        <td className="px-5 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{formatLocalDate(item.createdAt)}</td>
                        <td className="px-5 py-4 text-sm">
                          <div className="font-semibold text-slate-900">{item.userName || "-"}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{item.userRole || "-"}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className="inline-flex px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-[12px] font-semibold">
                            {formatModuleLabel(item.moduleCode)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <span className={`inline-flex px-3 py-1.5 rounded-full border text-[12px] font-semibold ${actionBadgeClass(item.actionCode)}`}>
                            {ACTION_LABELS[item.actionCode] || item.actionCode}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <div className="leading-relaxed">{item.description || "-"}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
            <p className="text-xs font-medium text-slate-500">
              {total} action(s) trouvee(s)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Precedent
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
