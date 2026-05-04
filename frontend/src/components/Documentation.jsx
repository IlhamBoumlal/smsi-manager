import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  Eye,
  ChevronDown,
  Clock3,
  FileText,
  Building2,
  Users,
  Cpu,
  LayoutGrid,
  List,
  PencilLine,
  SquarePen,
  Search,
  Trash2,
  Upload,
  X,
  RefreshCw,
  Lock,
  SlidersHorizontal,
  Loader2,
  CircleSlash,
  GitBranchPlus,
} from "lucide-react";

const API = "/api/documentation";

const defaultPermissions = {
  role: "CONSULTANT",
  canConsult: false,
  canCreate: false,
  canEditOwn: false,
  canEditAny: false,
  canDelete: false,
  canApprove: false,
  canCreateVersion: false,
  allowedCategories: [],
};

const statusCfg = {
  approuve:        { label: "Approuv\u00e9",      color: "#0d9268", bg: "#d1fae5" },
  "en-validation": { label: "En validation", color: "#b45309", bg: "#fef3c7" },
  brouillon:       { label: "Brouillon",     color: "#475569", bg: "#f1f5f9" },
  "a-revoir":      { label: "\u00c0 revoir",      color: "#dc2626", bg: "#fee2e2" },
};

const typeColor = {
  Politique: "#2f66dc",
  Procedure: "#159f74",
  Plan: "#d48319",
  Registre: "#d48319",
  Rapport: "#de4a4a",
  Charte: "#6b7a93",
  Chart: "#7c3aed",
};
const typeBadgeClass = {
  Politique: "bg-blue-100 text-blue-600",
  Procedure: "bg-emerald-100 text-emerald-700",
  Plan: "bg-amber-100 text-amber-700",
  Registre: "bg-amber-100 text-amber-700",
  Rapport: "bg-red-100 text-red-600",
  Charte: "bg-slate-200 text-slate-600",
  Chart: "bg-violet-100 text-violet-700",
};
const categoryToneTokens = [
  {
    icon: Building2,
    active: "border-indigo-600 bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.26)]",
    inactive: "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
    badge: "border-indigo-200 bg-indigo-100 text-indigo-700",
  },
  {
    icon: Users,
    active: "border-emerald-600 bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.25)]",
    inactive: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  {
    icon: Lock,
    active: "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,119,6,0.24)]",
    inactive: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
    badge: "border-amber-200 bg-amber-100 text-amber-700",
  },
  {
    icon: Cpu,
    active: "border-violet-600 bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.26)]",
    inactive: "border-violet-200 bg-white text-violet-700 hover:bg-violet-50",
    badge: "border-violet-200 bg-violet-100 text-violet-700",
  },
];
const statusBadgeCfg = {
  approuve:        { label: "Approuv\u00e9",      color: "#0d9268", bg: "#d1fae5", border: "#6ee7b7" },
  "en-validation": { label: "En validation", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  brouillon:       { label: "Brouillon",     color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  "a-revoir":      { label: "\u00c0 revoir",      color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};
const StatusBadge = ({ status }) => {
  const cfg = statusBadgeCfg[status] || statusBadgeCfg.brouillon;
  const icons = {
    approuve: <CheckCircle2 size={12} />, 
    "en-validation": <Clock3 size={12} />,
    brouillon: <PencilLine size={12} />,
    "a-revoir": <RefreshCw size={12} />,
  };
  return (
    <span
      className="inline-flex h-8 min-w-[118px] items-center justify-center gap-1.5 px-3 rounded-full text-[12px] font-semibold whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {icons[status] || icons.brouillon}
      {cfg.label}
    </span>
  );
};

const categories = ["Gouvernance", "RGPD", "Continuite", "Technique", "RH", "Audit"];
const types = ["Politique", "Procedure", "Plan", "Registre", "Rapport", "Charte", "Chart"];
const buildSeries = (prefix, max) => Array.from({ length: max }, (_, index) => `${prefix}.${index + 1}`);
const isoClauseGroups = [
  { title: "Contexte & leadership", color: "#2f66dc", items: ["4.1", "4.2", "4.3", "4.4", "5.1", "5.2", "5.3"] },
  { title: "Planification & support", color: "#16a34a", items: ["6.1.1", "6.1.2", "6.1.3", "6.2", "6.3", "7.1", "7.2", "7.3", "7.4", "7.5.1", "7.5.2", "7.5.3"] },
  { title: "Operations, evaluation & amelioration", color: "#d97706", items: ["8.1", "9.1", "9.2", "9.3", "10.1", "10.2"] },
];
const annexControlGroups = [
  { title: "A.5 - Politiques & organisation", color: "#2f66dc", items: buildSeries("A.5", 37) },
  { title: "A.6 - Personnes", color: "#16a34a", items: buildSeries("A.6", 8) },
  { title: "A.7 - Physique", color: "#d97706", items: buildSeries("A.7", 14) },
  { title: "A.8 - Technologie", color: "#6d28d9", items: buildSeries("A.8", 34) },
];
const allIsoClauses = isoClauseGroups.flatMap((group) => group.items);
const allAnnexControls = annexControlGroups.flatMap((group) => group.items);
const parseSelectedValues = (value) => (value && value !== "-"
  ? Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)))
  : []);
const buildPreviewSections = (doc) => ([
  {
    title: "Objet",
    content: doc?.description || "Ce document decrit les regles et procedures applicables dans le cadre du SMSI.",
  },
  {
    title: "Domaine d'application",
    content: "S'applique a l'ensemble des collaborateurs, prestataires et partenaires de l'organisation.",
  },
  {
    title: "References normatives",
    content: "ISO/IEC 27001:2022 - ISO/IEC 27002:2022 - Reglement (UE) 2016/679 (RGPD).",
  },
  {
    title: "Responsabilites",
    content: `Le proprietaire du document est ${doc?.author || "le responsable SMSI"} et l'approbateur est ${doc?.approver || "la direction"}.`,
  },
]);

const formatSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

const suggestNextVersion = (currentVersion) => {
  const source = String(currentVersion || "").trim();
  if (!source) return "1.1";
  const parts = source.split(".").map((item) => item.trim()).filter(Boolean);
  if (!parts.length) return "1.1";
  const last = parts[parts.length - 1];
  if (!/^\d+$/.test(last)) return `${source}.1`;
  parts[parts.length - 1] = String(Number(last) + 1);
  return parts.join(".");
};

const toSafeText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const normalizeDoc = (doc = {}) => {
  const id = doc.id ?? doc.Id ?? "";
  const name = toSafeText(doc.name ?? doc.Name, "Document sans titre");
  const status = toSafeText(doc.status ?? doc.Status, "brouillon");
  const normalizedStatus = statusCfg[status] ? status : "brouillon";

  return {
    id,
    name,
    type: toSafeText(doc.type ?? doc.Type, "Charte"),
    category: toSafeText(doc.category ?? doc.Category, "Gouvernance"),
    status: normalizedStatus,
    version: toSafeText(doc.version ?? doc.Version, "1.0"),
    classification: toSafeText(doc.classification ?? doc.Classification, "Interne"),
    author: toSafeText(doc.author ?? doc.Author, "Non renseigne"),
    approver: toSafeText(doc.approver ?? doc.Approver),
    clause: toSafeText(doc.clause ?? doc.Clause),
    controle: toSafeText(doc.controle ?? doc.Controle),
    description: toSafeText(doc.description ?? doc.Description, "Aucune description."),
    size: formatSize(doc.fileSizeBytes ?? doc.FileSizeBytes ?? doc.fileSize ?? doc.FileSize),
    updatedAtLabel: formatDate(doc.updatedAt ?? doc.UpdatedAt),
    canEdit: Boolean(doc.canEdit ?? doc.CanEdit),
    canDelete: Boolean(doc.canDelete ?? doc.CanDelete),
    canApprove: Boolean(doc.canApprove ?? doc.CanApprove),
    canCreateVersion: Boolean(doc.canCreateVersion ?? doc.CanCreateVersion),
    isOwnDocument: Boolean(doc.isOwnDocument ?? doc.IsOwnDocument),
  };
};

const normalizePermissions = (payload) => ({
  ...defaultPermissions,
  ...payload,
  allowedCategories: Array.isArray(payload?.allowedCategories) ? payload.allowedCategories : [],
});

const extractApiError = (err, fallback) => {
  if (err?.response?.status === 403) return "Action non autorisee pour votre role.";
  if (err?.response?.status === 404) return "Ressource introuvable.";
  if (typeof err?.response?.data === "string" && err.response.data.trim()) return err.response.data;
  return fallback;
};

function StatePanel({ icon, title, subtitle, tone = "default", action }) {
  const toneClass = tone === "warning"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : tone === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-white border-slate-200 text-slate-800";

  return (
    <div className={`rounded-2xl border p-10 text-center shadow-sm ${toneClass}`}>
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/80 border border-current/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{subtitle}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Modal avec backdrop flou */
function Modal({ open, children, onClose, panelClassName = "" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function Documentation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const importRef = useRef(null);
  const wizardFileRef = useRef(null);
  const versionFileRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view, setView] = useState("cards");

  const [viewDoc, setViewDoc] = useState(null);
  const [downloadDoc, setDownloadDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newStep, setNewStep] = useState(0);
  const [editingDoc, setEditingDoc] = useState(null);
  const [versioningDoc, setVersioningDoc] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "Politique",
    category: "Gouvernance",
    status: "brouillon",
    version: "1.0",
    classification: "Interne",
    author: "",
    approver: "",
    clause: "",
    controle: "",
    description: "",
    file: null,
    removeFile: false,
  });
  const [selectedClauses, setSelectedClauses] = useState([]);
  const [selectedControls, setSelectedControls] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadState, setDownloadState] = useState("idle");
  const [downloadFormat, setDownloadFormat] = useState("");
  const downloadTimerRef = useRef(null);

  const showSuccess = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 2500);
  };

  const clearDownloadTimer = () => {
    if (downloadTimerRef.current) {
      window.clearInterval(downloadTimerRef.current);
      downloadTimerRef.current = null;
    }
  };

  useEffect(() => () => clearDownloadTimer(), []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [docsResult, permissionsResult] = await Promise.allSettled([
        axiosInstance.get(API),
        axiosInstance.get(`${API}/permissions`),
      ]);

      if (permissionsResult.status === "fulfilled") {
        setPermissions(normalizePermissions(permissionsResult.value.data));
      } else if (permissionsResult.reason?.response?.status === 401) {
        navigate("/login");
        return;
      } else {
        setPermissions(defaultPermissions);
      }

      if (docsResult.status === "fulfilled") {
        setDocs((docsResult.value.data || []).map(normalizeDoc));
      } else if (docsResult.reason?.response?.status === 401) {
        navigate("/login");
        return;
      } else {
        setDocs([]);
        setError(extractApiError(docsResult.reason, "Impossible de charger les documents."));
      }
    } catch (err) {
      if (err?.response?.status === 401) return navigate("/login");
      setError(extractApiError(err, "Impossible de charger les documents."));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const toFormData = (payload) => {
    const fd = new FormData();
    fd.append("name", payload.name || "");
    fd.append("type", payload.type || "");
    fd.append("category", payload.category || "");
    fd.append("status", payload.status || "brouillon");
    fd.append("version", payload.version || "1.0");
    fd.append("classification", payload.classification || "Interne");
    fd.append("author", payload.author || "");
    fd.append("approver", payload.approver || "");
    fd.append("clause", payload.clause || "");
    fd.append("controle", payload.controle || "");
    fd.append("description", payload.description || "");
    fd.append("removeFile", payload.removeFile ? "true" : "false");
    if (payload.file) fd.append("file", payload.file);
    return fd;
  };

  const createDoc = async (payload) => {
    const res = await axiosInstance.post(API, toFormData(payload));
    if (!res?.data) throw new Error("Reponse vide lors de la creation.");
    setDocs((prev) => [normalizeDoc(res.data), ...prev]);
    showSuccess("Document cree.");
  };

  const updateDoc = async (id, payload) => {
    const res = await axiosInstance.put(`${API}/${id}`, toFormData(payload));
    if (!res?.data) throw new Error("Reponse vide lors de la mise a jour.");
    setDocs((prev) => prev.map((d) => (d.id === id ? normalizeDoc(res.data) : d)));
    showSuccess("Document mis a jour.");
  };

  const createNewVersion = async (id, payload) => {
    const res = await axiosInstance.post(`${API}/${id}/new-version`, toFormData(payload));
    if (!res?.data) throw new Error("Reponse vide lors du versioning.");
    setDocs((prev) => prev.map((d) => (d.id === id ? normalizeDoc(res.data) : d)));
    showSuccess("Nouvelle version soumise. En attente de reapprobation RSSI. Version precedente remplacee.");
  };

  const removeDoc = async (id) => {
    await axiosInstance.delete(`${API}/${id}`);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    showSuccess("Document supprime.");
  };

  const download = async (doc, format) => {
    const res = await axiosInstance.get(`${API}/${doc.id}/download`, { params: { format }, responseType: "blob" });
    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = toSafeText(doc?.name, "document").replace(/[\\/:*?"<>|]/g, "_");
    a.download = `${safeName}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSuccess("Telechargement demarre.");
  };

  const resetDownloadState = () => {
    clearDownloadTimer();
    setDownloadProgress(0);
    setDownloadState("idle");
    setDownloadFormat("");
  };

  const openDownloadModal = (doc) => {
    setDownloadDoc(doc);
    resetDownloadState();
  };

  const closeDownloadModal = () => {
    setDownloadDoc(null);
    resetDownloadState();
  };

  const runDownloadWithProgress = async (format) => {
    if (!downloadDoc || downloadState === "running") return;
    setDownloadFormat(format);
    setDownloadState("running");
    setDownloadProgress(10);
    clearDownloadTimer();
    downloadTimerRef.current = window.setInterval(() => {
      setDownloadProgress((prev) => (prev >= 92 ? prev : prev + 8));
    }, 120);
    try {
      await download(downloadDoc, format);
      clearDownloadTimer();
      setDownloadProgress(100);
      setDownloadState("success");
    } catch (err) {
      clearDownloadTimer();
      setDownloadState("error");
      setDownloadProgress(0);
      setError(extractApiError(err, "Telechargement impossible."));
    }
  };

  const filtered = useMemo(() => docs.filter((d) => {
    const q = search.trim().toLowerCase();
    const safeName = String(d?.name || "").toLowerCase();
    const safeAuthor = String(d?.author || "").toLowerCase();
    const qMatch = !q || safeName.includes(q) || safeAuthor.includes(q);
    const typeMatch = !typeFilter || d.type === typeFilter;
    const statusMatch = !statusFilter || d.status === statusFilter;
    const categoryMatch = !categoryFilter || d.category === categoryFilter;
    return qMatch && typeMatch && statusMatch && categoryMatch;
  }), [docs, search, typeFilter, statusFilter, categoryFilter]);

  const stats = {
    total: docs.length,
    approuves: docs.filter((d) => d.status === "approuve").length,
    validation: docs.filter((d) => d.status === "en-validation").length,
    brouillons: docs.filter((d) => d.status === "brouillon").length,
    aRevoir: docs.filter((d) => d.status === "a-revoir").length,
  };
  const statPercent = (value) => (stats.total > 0 ? Math.round((value * 100) / stats.total) : 0);
  const globalConformity = statPercent(stats.approuves);
  const statCards = [
    {
      key: "global",
      primary: true,
      label: "Taux de conformite documentaire",
      value: `${globalConformity}%`,
      subLabel: `${stats.total} document${stats.total > 1 ? "s" : ""}`,
      progress: globalConformity,
    },
    {
      key: "approved",
      label: "Documents approuves",
      value: stats.approuves,
      subLabel: `${Math.max(0, stats.total - stats.approuves)} non approuves`,
    },
    {
      key: "validation",
      label: "En validation",
      value: stats.validation,
      subLabel: `${stats.brouillons} brouillon${stats.brouillons > 1 ? "s" : ""}`,
    },
    {
      key: "review",
      label: "A revoir",
      value: stats.aRevoir,
      subLabel: `${stats.validation} en attente`,
    },
  ];

  const statusFilterTabs = useMemo(() => ([
    { value: "", label: "Tous", count: docs.length },
    { value: "approuve", label: "Approuves", count: stats.approuves },
    { value: "en-validation", label: "En validation", count: stats.validation },
    { value: "brouillon", label: "Brouillons", count: stats.brouillons },
    { value: "a-revoir", label: "A revoir", count: stats.aRevoir },
  ]), [docs.length, stats.approuves, stats.validation, stats.brouillons, stats.aRevoir]);

  const allowedCategoryOptions = useMemo(() => {
    if (!permissions.allowedCategories?.length) return categories;
    return categories.filter((category) =>
      permissions.allowedCategories.some((allowed) =>
        allowed.toLowerCase() === category.toLowerCase()
      )
    );
  }, [permissions.allowedCategories]);

  const statusOptions = useMemo(() => {
    return Object.entries(statusCfg).filter(([status]) => permissions.canApprove || status !== "approuve");
  }, [permissions.canApprove]);

  const categoryTabs = useMemo(() => {
    const fromDocs = Array.from(new Set(docs.map((doc) => doc.category).filter(Boolean)));
    const base = fromDocs.length > 0 ? fromDocs : categories;
    const byCategory = base.map((category, index) => {
      const tone = categoryToneTokens[index % categoryToneTokens.length];
      return {
        value: category,
        label: category,
        count: docs.filter((doc) => doc.category === category).length,
        ...tone,
      };
    });
    return [
      {
        value: "",
        label: "Tous les domaines",
        count: docs.length,
        icon: LayoutGrid,
        active: "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]",
        inactive: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        badge: "border-slate-200 bg-slate-100 text-slate-600",
      },
      ...byCategory,
    ];
  }, [docs]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setCategoryFilter("");
  };

  const resetForm = (seed = {}) => {
    const defaultCategory = allowedCategoryOptions[0] || "Gouvernance";
    setForm({
      name: seed.name || "",
      type: seed.type || "Politique",
      category: seed.category || defaultCategory,
      status: seed.status || "brouillon",
      version: seed.version || "1.0",
      classification: seed.classification || "Interne",
      author: seed.author || user?.nomComplet || user?.NomComplet || user?.email || user?.Email || "",
      approver: seed.approver === "-" ? "" : seed.approver || "",
      clause: seed.clause === "-" ? "" : seed.clause || "",
      controle: seed.controle === "-" ? "" : seed.controle || "",
      description: seed.description || "",
      file: null,
      removeFile: false,
    });
    setSelectedClauses(parseSelectedValues(seed.clause));
    setSelectedControls(parseSelectedValues(seed.controle));
  };

  const togglePickerValue = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const openCreate = () => {
    if (!permissions.canCreate) {
      setError("Vous n'avez pas l'autorisation de creer un document.");
      return;
    }
    resetForm();
    setNewStep(0);
    setShowNew(true);
  };
  const openEdit = (doc) => {
    if (!doc.canEdit) {
      setError("Vous n'avez pas l'autorisation de modifier ce document.");
      return;
    }
    resetForm(doc);
    setEditingDoc(doc);
  };
  const openNewVersion = (doc) => {
    if (!doc.canCreateVersion) {
      setError("Vous n'avez pas l'autorisation de proposer une nouvelle version.");
      return;
    }
    resetForm({
      ...doc,
      status: "en-validation",
      version: suggestNextVersion(doc.version),
    });
    setVersioningDoc(doc);
  };
  const closeCreate = () => { setShowNew(false); setNewStep(0); };
  const createSteps = ["Informations", "Liens ISO", "Fichier", "Confirmation"];

  const approveDoc = async (doc) => {
    if (!doc?.canApprove) return;

    await updateDoc(doc.id, {
      name: doc.name,
      type: doc.type,
      category: doc.category,
      status: "approuve",
      version: doc.version,
      classification: doc.classification,
      author: doc.author,
      approver:
        (user?.nomComplet || user?.NomComplet || user?.email || user?.Email || "").trim()
        || doc.approver,
      clause: doc.clause === "-" ? "" : doc.clause,
      controle: doc.controle === "-" ? "" : doc.controle,
      description: doc.description,
      removeFile: false,
      file: null,
    });
  };

  const buildDocActions = (doc) => {
    const actions = [
      [<Eye size={16} />, () => setViewDoc(doc), "Consulter", "text-blue-600 hover:bg-blue-50"],
      [<Download size={16} />, () => openDownloadModal(doc), "Telecharger", "text-emerald-600 hover:bg-emerald-50"],
    ];

    if (doc.canApprove && doc.status !== "approuve") {
      actions.push([
        <Check size={16} />,
        async () => {
          try {
            await approveDoc(doc);
          } catch (err) {
            setError(extractApiError(err, "Approbation impossible."));
          }
        },
        "Approuver",
        "text-green-600 hover:bg-green-50",
      ]);
    }

    if (doc.canCreateVersion) {
      actions.push([
        <GitBranchPlus size={16} />,
        () => openNewVersion(doc),
        "Nouvelle version",
        "text-violet-700 hover:bg-violet-50",
      ]);
    }

    if (doc.canEdit) {
      actions.push([
        <SquarePen size={16} />,
        () => openEdit(doc),
        "Modifier",
        "text-amber-600 hover:bg-amber-50",
      ]);
    }

    if (doc.canDelete) {
      actions.push([
        <Trash2 size={16} />,
        () => {
          setDeleteDoc(doc);
          setDeleteConfirm("");
        },
        "Supprimer",
        "text-red-600 hover:bg-red-50",
      ]);
    }

    return actions;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] px-4 py-5 sm:px-6" style={{ fontFamily: "'Sora', 'Inter', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.8px" }}>Documentation SMSI</h1>
              <p className="mt-1 text-[13.5px] text-slate-500">Pilotage documentaire ISO 27001 - suivi des versions, validation et conformite.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={importRef} className="hidden" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.rar,.7z" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const importCategory = allowedCategoryOptions[0] || "Technique";
                try {
                  await createDoc({
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    type: "Procedure",
                    category: importCategory,
                    author: form.author || user?.nomComplet || user?.NomComplet || "Utilisateur",
                    description: "Document importe.",
                    file,
                  });
                } catch (err) {
                  setError(extractApiError(err, "Import impossible."));
                }
                e.target.value = "";
              }} />
              {permissions.canCreate && (
                <>
                  <button onClick={() => importRef.current?.click()} className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Importer
                  </button>
                  <button onClick={openCreate} className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
                    Nouveau document
                  </button>
                </>
              )}
              {!permissions.canCreate && (
                <button className="inline-flex h-11 cursor-default items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500">
                  <Lock size={15} />
                  Mode lecture seule
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>}
        {success && <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">{success}</div>}

        {!permissions.canConsult && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium inline-flex items-center gap-2">
            <CircleSlash size={16} />
            Votre compte n'est pas rattache a une entreprise. L'acces a la documentation est restreint.
          </div>
        )}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <div
              key={card.key}
              className={`rounded-2xl border px-6 py-5 transition-all duration-300 ${
                card.primary
                  ? "border-blue-700 text-white hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(29,78,216,0.35)]"
                  : "border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]"
              }`}
              style={{
                animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${index * 70}ms both`,
                ...(card.primary ? {
                  background: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)",
                  boxShadow: "0 8px 24px rgba(29,78,216,.35)",
                } : {}),
              }}
            >
              <p className={`text-[32px] font-extrabold leading-none ${card.primary ? "text-white" : "text-slate-900"}`}>{card.value}</p>
              <p className={`mt-2 text-[12.5px] font-semibold ${card.primary ? "text-white/95" : "text-slate-700"}`}>{card.label}</p>
              <p className={`mt-1 text-[11.5px] ${card.primary ? "text-white/75" : "text-slate-400"}`}>{card.subLabel}</p>
              {card.primary ? (
                <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/25">
                  <div className="h-[5px] rounded-full bg-white/90 transition-all duration-500" style={{ width: `${card.progress}%` }} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animation: "fadeInUp .35s ease both" }}>
          <div className="flex flex-wrap items-center gap-2">
            {categoryTabs.map((tab) => {
              const active = categoryFilter === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value || "all-categories"}
                  onClick={() => setCategoryFilter(tab.value)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 ${
                    active ? tab.active : tab.inactive
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${
                    active ? "border-white/20 bg-white/20 text-white" : tab.badge
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Rechercher un document..."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {statusFilterTabs.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                <button
                  key={tab.value || "all-status"}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${
                    active ? "border-white/20 bg-white/20 text-white" : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 min-w-[170px] appearance-none rounded-xl border border-slate-300 bg-white pl-4 pr-10 text-[13px] font-semibold text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">Tous les types</option>
                  {types.map((t) => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>

              <div className="flex h-10 w-[92px] overflow-hidden rounded-xl border border-slate-300 bg-white">
                <button onClick={() => setView("cards")} className={`flex w-1/2 items-center justify-center ${view === "cards" ? "bg-blue-600 text-white" : "text-slate-500"}`} title="Vue cartes">
                  <LayoutGrid size={17} />
                </button>
                <button onClick={() => setView("table")} className={`flex w-1/2 items-center justify-center ${view === "table" ? "bg-blue-600 text-white" : "text-slate-500"}`} title="Vue tableau">
                  <List size={17} />
                </button>
              </div>

              <button onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                <SlidersHorizontal size={15} />
                Reinitialiser
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm font-semibold text-slate-600">
            {filtered.length} / {docs.length} documents affiches
          </div>
        </div>

        {loading ? (
          <div style={{ animation: "fadeInUp .35s ease both" }}>
            <StatePanel
              icon={<Loader2 size={22} className="animate-spin text-blue-600" />}
              title="Chargement des documents"
              subtitle="Recuperation des documents et des permissions en cours..."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ animation: "fadeInUp .35s ease both" }}>
            <StatePanel
              icon={<FileText size={22} className="text-slate-500" />}
              title="Aucun document a afficher"
              subtitle="Aucun document ne correspond aux filtres actifs ou a vos permissions."
              action={
                <button onClick={clearFilters} className="h-10 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Reinitialiser les filtres
                </button>
              }
            />
          </div>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((doc, index) => {
              const typeChip = typeBadgeClass[doc.type] || "bg-slate-200 text-slate-600";
              return <div
                key={doc.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]"
                style={{ animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${index * 60}ms both` }}
              >
                <div style={{ height: 5, background: typeColor[doc.type] || "#6b7a93" }} />
                <div className="px-4 py-4 flex-1">
                  <div className="flex justify-between gap-3 mb-3">
                    <h3 className="font-bold text-slate-800 text-[18px] leading-[1.2] line-clamp-2">{doc.name}</h3>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`h-7 px-2.5 rounded-full text-[12px] font-semibold inline-flex items-center ${typeChip}`}>{doc.type}</span>
                    <span className="h-7 px-2.5 rounded-full text-[12px] font-semibold inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200">{doc.category}</span>
                    {doc.isOwnDocument && <span className="h-7 px-2.5 rounded-full text-[12px] font-semibold inline-flex items-center bg-indigo-50 text-indigo-700 border border-indigo-200">Vous etes proprietaire</span>}
                  </div>
                  <p className="text-[14px] text-slate-500 mb-3 leading-6 line-clamp-2">{doc.description}</p>
                  {doc.status === "en-validation" && (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
                      En attente de reapprobation RSSI
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-slate-500">
                    <div>Version : <b className="text-slate-700">v{doc.version}</b></div>
                    <div>Taille : <b className="text-slate-700">{doc.size}</b></div>
                    <div>Clause : <b className="text-slate-700">{doc.clause}</b></div>
                    <div>Controle : <b className="text-slate-700">{doc.controle}</b></div>
                    <div>Auteur : <b className="text-slate-700">{doc.author}</b></div>
                    <div>Approbateur : <b className="text-slate-700">{doc.approver}</b></div>
                  </div>
                </div>
                <div className="flex h-[52px] items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4">
                  <span className="text-[12px] text-slate-400 font-semibold">Maj. {doc.updatedAtLabel}</span>
                  <div className="flex gap-1.5">
                    {buildDocActions(doc).map(([icon, action, label, colorClass], i) => (
                      <button key={i} onClick={action} title={label} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${colorClass}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>;
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ animation: "fadeInUp .35s ease both" }}>
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {["Document", "Type", "Version", "Statut", "Auteur", "Clause", "Taille", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{doc.name}</div>
                      <div className="text-xs text-slate-400">{doc.category}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{doc.type}</td>
                    <td className="px-4 py-3 text-slate-700">v{doc.version}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                      {doc.status === "en-validation" && (
                        <p className="mt-1 text-[11px] font-semibold text-amber-700">Reapprobation RSSI requise</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{doc.author}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.clause}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.size}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {buildDocActions(doc).map(([icon, action, label, colorClass], i) => (
                          <button key={i} onClick={action} title={label} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${colorClass}`}>
                            {icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={Boolean(viewDoc)} onClose={() => setViewDoc(null)} panelClassName="max-w-[680px] rounded-[20px]">
        {viewDoc && (
          <>
            <div className="px-6 pt-6 pb-2 max-h-[80vh] overflow-auto">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <FileText size={20} className="text-slate-400 flex-shrink-0" />
                  <h3 className="text-[22px] font-bold text-slate-900 leading-tight">{viewDoc.name}</h3>
                </div>
                <StatusBadge status={viewDoc.status} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`h-7 px-3 rounded-full text-[12px] font-semibold inline-flex items-center ${typeBadgeClass[viewDoc.type] || "bg-slate-100 text-slate-600"}`}>{viewDoc.type}</span>
                <span className="h-7 px-3 rounded-full text-[12px] font-semibold inline-flex items-center bg-slate-100 text-slate-600">{viewDoc.category}</span>
                <span className="ml-auto h-7 px-3 rounded-full text-[12px] font-semibold inline-flex items-center bg-slate-100 text-slate-500">v{viewDoc.version}</span>
              </div>
              {viewDoc.status === "en-validation" && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
                  En attente de reapprobation RSSI
                </div>
              )}
              <div className="border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Auteur</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.author}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Approbateur</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.approver}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Clause ISO</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.clause}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Controle Annexe A</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.controle}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Derniere maj.</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.updatedAtLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Taille</p>
                  <p className="text-[15px] text-slate-800 font-medium">{viewDoc.size}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {parseSelectedValues(viewDoc.clause).slice(0, 6).map((clause) => (
                  <span key={clause} className="h-7 px-3 rounded-lg bg-blue-100 text-blue-700 text-[12px] font-semibold inline-flex items-center">Clause {clause}</span>
                ))}
                {parseSelectedValues(viewDoc.controle).slice(0, 6).map((control) => (
                  <span key={control} className="h-7 px-3 rounded-lg bg-blue-100 text-blue-700 text-[12px] font-semibold inline-flex items-center">{control}</span>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">Apercu du contenu</p>
              <div className="space-y-4 pb-2">
                {buildPreviewSections(viewDoc).map((section, index) => (
                  <div key={section.title} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[12px] font-bold flex items-center justify-center mt-0.5">{index + 1}</span>
                    <div>
                      <p className="text-[15px] font-semibold text-slate-800 mb-1">{section.title}</p>
                      <p className="text-[14px] text-slate-500 leading-6">{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button onClick={() => setViewDoc(null)} className="h-10 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[14px] hover:bg-slate-50 transition-colors">Fermer</button>
              <button
                onClick={async () => { try { await download(viewDoc, "pdf"); } catch (err) { setError(extractApiError(err, "Telechargement impossible.")); } }}
                className="h-10 px-5 rounded-xl bg-blue-600 text-white font-semibold text-[14px] inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Download size={15} />
                Telecharger PDF
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal open={Boolean(downloadDoc)} onClose={closeDownloadModal} panelClassName="max-w-[500px] rounded-[20px]">
        {downloadDoc && (
          <>
            <div className="p-6">
              <h3 className="text-[22px] font-bold text-slate-900 mb-5 inline-flex items-center gap-2">
                <Download size={20} />
                Telecharger le document
              </h3>

              {/* Doc card */}
              <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
                <FileText size={20} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[15px] font-semibold text-slate-800">{downloadDoc.name}</p>
                  <p className="text-sm text-slate-400">v{downloadDoc.version} - {downloadDoc.size}</p>
                </div>
              </div>

              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-3">Format d'export</p>

              <div className="space-y-3">
                {[
                  {
                    format: "pdf",
                    title: ".PDF",
                    description: "Lecture seule, format universel",
                    iconBg: "bg-red-50",
                    iconColor: "text-red-500",
                    icon: <FileText size={18} />,
                  },
                  {
                    format: "docx",
                    title: ".DOCX",
                    description: "Editable sous Word / LibreOffice",
                    iconBg: "bg-blue-50",
                    iconColor: "text-blue-500",
                    icon: <SquarePen size={18} />,
                  },
                  {
                    format: "xlsx",
                    title: ".XLSX",
                    description: "Donnees tabulaires",
                    iconBg: "bg-emerald-50",
                    iconColor: "text-emerald-600",
                    icon: <LayoutGrid size={18} />,
                  },
                ].map((item) => (
                  <button
                    key={item.format}
                    onClick={() => runDownloadWithProgress(item.format)}
                    disabled={downloadState === "running"}
                    className={`w-full border rounded-xl p-3.5 text-left flex items-center justify-between transition-colors ${
                      downloadFormat === item.format
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    } disabled:opacity-70`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg} ${item.iconColor}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.description}</p>
                      </div>
                    </div>
                    <span className="text-slate-300 text-lg"></span>
                  </button>
                ))}
              </div>

              {(downloadState === "running" || downloadState === "success" || downloadState === "error") && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-200 ${downloadState === "error" ? "bg-red-500" : "bg-blue-600"}`}
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${downloadState === "success" ? "text-emerald-600" : downloadState === "error" ? "text-red-600" : "text-slate-500"}`}>
                    {downloadState === "running" && `Telechargement ${downloadFormat?.toUpperCase()} en cours... ${downloadProgress}%`}
                    {downloadState === "success" && "Telechargement reussi [OK]"}
                    {downloadState === "error" && "Telechargement echoue"}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
              <button onClick={closeDownloadModal} className="h-10 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[14px]">Fermer</button>
            </div>
          </>
        )}
      </Modal>
      <Modal open={Boolean(editingDoc)} onClose={() => setEditingDoc(null)} panelClassName="max-w-[620px] rounded-[20px]">
        {editingDoc && (
          <>
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <SquarePen size={17} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 leading-tight">Modifier le document</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate max-w-[320px]">{editingDoc.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-200 inline-block" />
                  Identite du document
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                      Titre du document <span className="text-red-400">*</span>
                    </label>
                    <input
                      className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                      placeholder="Ex : Politique de securite de l'information"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Type</label>
                      <div className="relative">
                        <select
                          className="w-full h-10 appearance-none border border-slate-200 rounded-lg pl-3.5 pr-9 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                          {types.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Categorie</label>
                      <div className="relative">
                        <select
                          className="w-full h-10 appearance-none border border-slate-200 rounded-lg pl-3.5 pr-9 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                          {allowedCategoryOptions.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Statut</label>
                      <div className="relative">
                        <select
                          className="w-full h-10 appearance-none border border-slate-200 rounded-lg pl-3.5 pr-9 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          {statusOptions.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        {/* Pastille couleur statut */}
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                          style={{ background: statusCfg[form.status]?.color || "#6b7a93", marginLeft: "auto", left: "auto", right: "30px" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Version</label>
                      <input
                        className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                        placeholder="ex : 1.0"
                        value={form.version}
                        onChange={(e) => setForm({ ...form, version: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-200 inline-block" />
                  Responsables
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Auteur</label>
                    <input
                      className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                      placeholder="Nom de l'auteur"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Approbateur</label>
                    <input
                      className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                      placeholder="Nom de l'approbateur"
                      value={form.approver}
                      onChange={(e) => setForm({ ...form, approver: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-200 inline-block" />
                  References ISO 27001
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Clause ISO</label>
                    <input
                      className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300 font-mono"
                      placeholder="ex : 5.2, 6.1"
                      value={form.clause}
                      onChange={(e) => setForm({ ...form, clause: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Controle Annexe A</label>
                    <input
                      className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-300 font-mono"
                      placeholder="ex : A.5.1, A.8.3"
                      value={form.controle}
                      onChange={(e) => setForm({ ...form, controle: e.target.value })}
                    />
                  </div>
                </div>
                {(form.clause || form.controle) && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {parseSelectedValues(form.clause).map((c) => (
                      <span key={c} className="h-6 px-2.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-semibold inline-flex items-center border border-blue-100">Clause {c}</span>
                    ))}
                    {parseSelectedValues(form.controle).map((c) => (
                      <span key={c} className="h-6 px-2.5 rounded-md bg-violet-50 text-violet-600 text-[11px] font-semibold inline-flex items-center border border-violet-100">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-200 inline-block" />
                  Description
                  <span className="flex-1 h-px bg-slate-100 inline-block" />
                </p>
                <textarea
                  className="w-full min-h-[96px] border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none placeholder:text-slate-300 leading-relaxed"
                  placeholder="Decrivez brievement l'objet et le perimetre de ce document..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <p className="text-[11px] text-slate-300 text-right mt-1">{form.description.length} caracteres</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/60 rounded-b-[20px]">
              <button
                onClick={() => setEditingDoc(null)}
                className="h-10 px-5 rounded-xl border border-slate-300 bg-white text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={!form.name.trim()}
                onClick={async () => { try { await updateDoc(editingDoc.id, form); setEditingDoc(null); } catch (err) { setError(extractApiError(err, "Mise a jour impossible.")); } }}
                className="h-10 px-5 rounded-xl bg-blue-600 text-white font-semibold text-[13px] inline-flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={15} />
                Enregistrer les modifications
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal open={Boolean(versioningDoc)} onClose={() => setVersioningDoc(null)} panelClassName="max-w-[640px] rounded-[20px]">
        {versioningDoc && (
          <>
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
                  <GitBranchPlus size={18} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 leading-tight">Publier une nouvelle version</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[340px]">{versioningDoc.name}</p>
                </div>
              </div>
              <button onClick={() => setVersioningDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-semibold text-amber-800">
                En publiant cette version, le document repasse en validation et exige une reapprobation RSSI.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Titre du document</label>
                  <input
                    className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Version</label>
                  <input
                    className="w-full h-10 border border-violet-300 rounded-lg px-3.5 text-[14px] text-violet-800 bg-violet-50 focus:outline-none focus:border-violet-500"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Type</label>
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none border border-slate-200 rounded-lg pl-3.5 pr-9 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {types.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Categorie</label>
                  <div className="relative">
                    <select
                      className="w-full h-10 appearance-none border border-slate-200 rounded-lg pl-3.5 pr-9 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {allowedCategoryOptions.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Auteur</label>
                  <input
                    className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Approbateur</label>
                  <input
                    className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    value={form.approver}
                    onChange={(e) => setForm({ ...form, approver: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Clause ISO</label>
                  <input
                    className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    value={form.clause}
                    onChange={(e) => setForm({ ...form, clause: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Controle Annexe A</label>
                  <input
                    className="w-full h-10 border border-slate-200 rounded-lg px-3.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    value={form.controle}
                    onChange={(e) => setForm({ ...form, controle: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea
                  className="w-full min-h-[90px] border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[12px] font-semibold text-slate-600 mb-2">Fichier documentaire</p>
                <input
                  ref={versionFileRef}
                  className="hidden"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.rar,.7z"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null, removeFile: false })}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => versionFileRef.current?.click()}
                    className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50"
                  >
                    Remplacer le fichier
                  </button>
                  {form.file ? (
                    <span className="text-[12px] font-semibold text-blue-700">{form.file.name}</span>
                  ) : (
                    <span className="text-[12px] text-slate-500">Aucun nouveau fichier selectionne. Le fichier actuel sera conserve.</span>
                  )}
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(form.removeFile)}
                    onChange={(e) => setForm({ ...form, removeFile: e.target.checked, file: e.target.checked ? null : form.file })}
                  />
                  Supprimer le fichier attache sur cette nouvelle version
                </label>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-[12px] font-semibold text-blue-800">
                Statut cible apres publication: En validation (reapprobation RSSI obligatoire).
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/60 rounded-b-[20px]">
              <button
                onClick={() => setVersioningDoc(null)}
                className="h-10 px-5 rounded-xl border border-slate-300 bg-white text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={!form.name.trim() || !form.author.trim() || !form.version.trim()}
                onClick={async () => {
                  try {
                    await createNewVersion(versioningDoc.id, {
                      ...form,
                      status: "en-validation",
                    });
                    setVersioningDoc(null);
                  } catch (err) {
                    setError(extractApiError(err, "Publication de nouvelle version impossible."));
                  }
                }}
                className="h-10 px-5 rounded-xl bg-violet-600 text-white font-semibold text-[13px] inline-flex items-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <GitBranchPlus size={15} />
                Publier la nouvelle version
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(deleteDoc)} onClose={() => setDeleteDoc(null)} panelClassName="max-w-[500px] rounded-[20px]">
        {deleteDoc && (
          <>
            <div className="p-6">
              <h3 className="text-[22px] font-bold text-red-600 mb-2 inline-flex items-center gap-2">
                <AlertTriangle size={21} />
                Supprimer le document
              </h3>
              <p className="text-[14px] text-slate-500 mb-4">Cette action est definitive et irreversible.</p>

              {/* Doc card */}
              <div className="border border-slate-200 rounded-xl p-3.5 mb-4">
                <p className="text-[15px] font-semibold text-slate-800">{deleteDoc.name}</p>
                <p className="text-[13px] text-slate-400">v{deleteDoc.version} - {deleteDoc.type} - {deleteDoc.size}</p>
              </div>

              {/* Warning list */}
              <div className="space-y-2 mb-4">
                {[
                  "Le document sera definitivement supprime du depot SMSI.",
                  "Toutes les versions et l'historique seront perdus.",
                  "Les liens ISO (clauses et controles Annexe A) seront rompus.",
                ].map((msg) => (
                  <div key={msg} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                    <X size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{msg}</span>
                  </div>
                ))}
              </div>

              <p className="text-[14px] font-semibold text-slate-800 mb-2">Tapez le nom exact du document pour confirmer</p>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 mb-3 font-mono text-[13px] text-blue-600 border border-slate-200">
                {deleteDoc.name}
              </div>
              <input
                className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[14px] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="Saisissez le nom exact..."
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button onClick={() => setDeleteDoc(null)} className="h-10 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[14px]">Annuler</button>
              <button
                disabled={deleteConfirm.trim() !== deleteDoc.name}
                onClick={async () => { try { await removeDoc(deleteDoc.id); setDeleteDoc(null); } catch (err) { setError(extractApiError(err, "Suppression impossible.")); } }}
                className="h-10 px-5 rounded-xl font-semibold text-[14px] inline-flex items-center gap-2 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-slate-200"
              >
                <Trash2 size={15} />
                Confirmer la suppression
              </button>
            </div>
          </>
        )}
      </Modal>
      <Modal open={showNew} onClose={closeCreate} panelClassName="max-w-[620px] rounded-[20px]">
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[22px] font-bold text-slate-900">
              <span className="text-blue-600 mr-3">+</span>
              Nouveau document
            </h3>
            <button onClick={closeCreate} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between px-2">
              {createSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center min-w-[74px]">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      i < newStep
                        ? "bg-blue-600 border-blue-600 text-white"
                        : i === newStep
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-300 text-slate-400"
                    }`}>
                      {i < newStep ? <Check size={12} /> : i + 1}
                    </div>
                    <span className={`mt-1.5 text-[13px] font-semibold ${i <= newStep ? "text-blue-600" : "text-slate-400"}`}>{step}</span>
                  </div>
                  {i < createSteps.length - 1 && (
                    <div className={`h-[2px] flex-1 mx-1.5 ${i <= newStep ? "bg-blue-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[300px]">
            {newStep === 0 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Titre du document <span className="text-red-500">*</span></label>
                  <input className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" placeholder="Ex: Politique de securite..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Type</label>
                    <select className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {types.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Categorie</label>
                    <select className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {allowedCategoryOptions.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Classification</label>
                    <select className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })}>
                      {["Interne", "Confidentiel", "Public"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Auteur <span className="text-red-500">*</span></label>
                    <input className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" placeholder="Nom de l'auteur" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea className="w-full min-h-[84px] border border-slate-300 rounded-xl px-4 py-2.5 text-[15px] resize-none focus:outline-none focus:border-blue-500" placeholder="Breve description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            )}

            {newStep === 1 && (
              <div className="space-y-3">
                <p className="text-base text-slate-500">Cliquez sur les references pour les associer au document. Selection multiple activee.</p>
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Clauses ISO 27001 selectionnees</p>
                  <div className="min-h-[44px] border border-blue-500 rounded-xl px-2 py-1.5 bg-blue-50/40 flex flex-wrap gap-1.5">
                    {selectedClauses.length === 0 ? (
                      <span className="text-xs text-slate-400 px-1.5 py-1">Aucune clause selectionnee</span>
                    ) : selectedClauses.map((clause) => (
                      <button key={clause} onClick={() => togglePickerValue(clause, setSelectedClauses)} className="h-7 px-2.5 rounded-full border border-blue-200 text-blue-700 bg-blue-100 text-xs font-semibold" title="Retirer">{clause} x</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Controles Annexe A selectionnes</p>
                  <div className="min-h-[44px] border border-violet-500 rounded-xl px-2 py-1.5 bg-violet-50/40 flex flex-wrap gap-1.5">
                    {selectedControls.length === 0 ? (
                      <span className="text-xs text-slate-400 px-1.5 py-1">Aucun controle selectionne</span>
                    ) : selectedControls.map((control) => (
                      <button key={control} onClick={() => togglePickerValue(control, setSelectedControls)} className="h-7 px-2.5 rounded-full border border-violet-200 text-violet-700 bg-violet-100 text-xs font-semibold" title="Retirer">{control} x</button>
                    ))}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-3 max-h-[150px] overflow-auto space-y-3">
                  {isoClauseGroups.map((group) => (
                    <div key={group.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-4 rounded-full" style={{ background: group.color }} />
                        <p className="text-sm font-semibold text-slate-700">{group.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((clause) => {
                          const active = selectedClauses.includes(clause);
                          return (
                            <button key={clause} onClick={() => togglePickerValue(clause, setSelectedClauses)} className={`h-7 px-2.5 rounded-full border text-xs font-semibold transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}>{clause}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border border-slate-200 rounded-xl p-3 max-h-[210px] overflow-auto space-y-3">
                  {annexControlGroups.map((group) => (
                    <div key={group.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-4 rounded-full" style={{ background: group.color }} />
                        <p className="text-sm font-semibold text-slate-700">{group.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((control) => {
                          const active = selectedControls.includes(control);
                          return (
                            <button key={control} onClick={() => togglePickerValue(control, setSelectedControls)} className={`h-7 px-2.5 rounded-full border text-xs font-semibold transition-colors ${active ? "bg-violet-600 text-white border-violet-600" : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"}`}>{control}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[15px] font-semibold text-slate-700 mb-1.5">Approbateur</label>
                  <input className="w-full h-11 border border-slate-300 rounded-xl px-4 text-[15px] focus:outline-none focus:border-blue-500" placeholder="Nom de l'approbateur" value={form.approver} onChange={(e) => setForm({ ...form, approver: e.target.value })} />
                </div>
              </div>
            )}

            {newStep === 2 && (
              <div className="space-y-4">
                <p className="text-base text-slate-500">Joignez le fichier source du document (optionnel).</p>
                <input ref={wizardFileRef} className="hidden" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.rar,.7z" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
                <button type="button" onClick={() => wizardFileRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-2xl h-[200px] bg-slate-50/70 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                  <Upload size={36} className="text-slate-400 mb-3" />
                  <p className="text-[15px] leading-tight font-semibold text-slate-700 mb-1">Cliquez pour selectionner un fichier</p>
                  <p className="text-[13px] text-slate-400">PDF, DOCX, XLSX - Max 20 Mo</p>
                </button>
                {form.file && (
                  <div className="text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                    Fichier selectionne: <span className="font-semibold">{form.file.name}</span>
                  </div>
                )}
              </div>
            )}

            {newStep === 3 && (
              <div className="pt-2">
                <div className="flex flex-col items-center mb-5">
                  <div className="w-16 h-16 rounded-full border-[3px] border-emerald-500 text-emerald-500 flex items-center justify-center mb-3">
                    <Check size={34} />
                  </div>
                  <h4 className="text-3xl font-bold text-slate-900">Pret a creer</h4>
                </div>
                <div className="bg-slate-100 rounded-2xl p-4 space-y-2 text-slate-700 text-base">
                  <div><span className="font-semibold text-slate-900">Titre :</span> {form.name || "-"}</div>
                  <div><span className="font-semibold text-slate-900">Type :</span> {form.type || "-"} - {form.category || "-"}</div>
                  <div><span className="font-semibold text-slate-900">Classification :</span> {form.classification || "-"}</div>
                  <div><span className="font-semibold text-slate-900">Auteur :</span> {form.author || "-"}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button onClick={() => { if (newStep === 0) closeCreate(); else setNewStep(newStep - 1); }} className="h-10 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[15px]">
            {newStep === 0 ? "X Annuler" : "<- Precedent"}
          </button>
          {newStep < 3 ? (
            <button disabled={newStep === 0 && (!form.name.trim() || !form.author.trim())} onClick={() => setNewStep(newStep + 1)} className="h-10 px-7 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow disabled:opacity-50">
              Suivant
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  await createDoc({
                    ...form,
                    clause: allIsoClauses.filter((item) => selectedClauses.includes(item)).join(", "),
                    controle: allAnnexControls.filter((item) => selectedControls.includes(item)).join(", "),
                  });
                  closeCreate();
                } catch (err) {
                  setError(extractApiError(err, "Creation impossible."));
                }
              }}
              className="h-10 px-7 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow"
            >
              + Creer le document
            </button>
          )}
        </div>
      </Modal>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

