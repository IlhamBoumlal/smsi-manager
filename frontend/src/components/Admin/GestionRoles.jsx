import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const DISALLOWED_ROLE_KEYS = new Set(["superadmin", "adminsociete"]);

const ROLE_STYLES = {
  rssi: {
    glow: "shadow-indigo-500/20",
    iconWrap: "bg-indigo-100 text-indigo-700",
    button: "from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700",
  },
  consultant: {
    glow: "shadow-sky-500/20",
    iconWrap: "bg-sky-100 text-sky-700",
    button: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
  },
  auditeur: {
    glow: "shadow-emerald-500/20",
    iconWrap: "bg-emerald-100 text-emerald-700",
    button: "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
  },
};

const ROLE_BASE_PERMISSION_HINTS = {
  rssi: 8,
  consultant: 3,
  auditeur: 6,
};

const ACTIONS = [
  { code: "delete", short: "S", label: "Suppression" },
  { code: "read", short: "L", label: "Lecture" },
  { code: "edit", short: "M", label: "Modification" },
  { code: "administer", short: "G", label: "Gestion" },
  { code: "create", short: "E", label: "Ecriture" },
  { code: "export", short: "X", label: "Export" },
  { code: "import", short: "I", label: "Import" },
  { code: "approve", short: "A", label: "Approbation" },
];

const MODULES = [
  { code: "dashboard", label: "Tableau de bord" },
  { code: "cartographie", label: "Cartographie" },
  { code: "pdca", label: "PDCA" },
  { code: "clauses", label: "Clauses" },
  { code: "controles", label: "Controles" },
  { code: "risques", label: "Risques" },
  { code: "documentation", label: "Documentation" },
  { code: "actifs", label: "Actifs" },
  { code: "incidents", label: "Incidents" },
  { code: "sensibilisation", label: "Sensibilisation" },
  { code: "audit", label: "Audits" },
  { code: "chatbot", label: "Chatbot" },
  { code: "tracabilite", label: "Tracabilite" },
  { code: "users", label: "Utilisateurs" },
  { code: "roles", label: "Roles et permissions" },
];

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeRole(value) {
  return normalizeKey(value).replace(/[\s_-]/g, "");
}

function roleLabelFromKey(roleKey) {
  if (roleKey === "rssi") return "RSSI";
  if (roleKey === "consultant") return "Consultant";
  if (roleKey === "auditeur") return "Auditeur";
  return roleKey.toUpperCase();
}

function isTenantManageableRole(roleName) {
  const roleKey = normalizeRole(roleName);
  if (!roleKey) return false;
  return !DISALLOWED_ROLE_KEYS.has(roleKey);
}

function permissionKey(moduleCode, actionCode) {
  return `${moduleCode}::${actionCode}`;
}

function buildEmptyMatrix() {
  const matrix = {};
  MODULES.forEach((moduleItem) => {
    ACTIONS.forEach((action) => {
      matrix[permissionKey(moduleItem.code, action.code)] = false;
    });
  });
  return matrix;
}

function countGrantedPermissions(data) {
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  return modules.reduce((total, moduleEntry) => {
    const actions = Array.isArray(moduleEntry?.actions) ? moduleEntry.actions : [];
    return total + actions.length;
  }, 0);
}

function isDocumentationApprovalLocked(roleCode, moduleCode, actionCode) {
  if (moduleCode !== "documentation" || actionCode !== "approve") return false;
  return roleCode !== "rssi";
}

function buildMatrixFromPermissions(data, roleCode) {
  const next = buildEmptyMatrix();
  const modules = Array.isArray(data?.modules) ? data.modules : [];

  modules.forEach((moduleEntry) => {
    const moduleCode = String(moduleEntry.moduleCode || moduleEntry.code || "").trim().toLowerCase();
    const actions = Array.isArray(moduleEntry.actions) ? moduleEntry.actions : [];

    actions.forEach((actionEntry) => {
      const actionCode = String(actionEntry.actionCode || actionEntry.code || "").trim().toLowerCase();
      const key = permissionKey(moduleCode, actionCode);
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        next[key] = true;
      }
    });
  });

  if (roleCode !== "rssi") {
    next[permissionKey("documentation", "approve")] = false;
  }

  return next;
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

function AddPermissionModal({
  open,
  onClose,
  modules,
  actions,
  selectedModuleCode,
  selectedActionCodes,
  onSelectModule,
  onToggleAction,
  onSubmit,
  loading,
}) {
  if (!open) return null;

  const canSubmit = Boolean(selectedModuleCode) && selectedActionCodes.length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-[660px] rounded-3xl overflow-hidden shadow-2xl bg-white">
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: GRAD_BLUE }}>
          <h3 className="text-white font-bold text-[21px]">Ajouter des permissions</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] font-bold tracking-[1px] text-slate-500 uppercase mb-2">
              1. Choisir le module
            </p>
            <div className="relative">
              <select
                value={selectedModuleCode}
                onChange={(event) => onSelectModule(event.target.value)}
                disabled={loading}
                className="w-full h-12 rounded-xl border border-slate-300 bg-slate-50 px-4 pr-10 text-[14px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-60"
              >
                <option value="">-- Selectionner un module --</option>
                {modules.map((moduleItem) => (
                  <option key={moduleItem.code} value={moduleItem.code}>
                    {moduleItem.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-[1px] text-slate-500 uppercase mb-2">
              2. Actions a autoriser
            </p>

            {actions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Choisissez un module pour voir les actions disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actions.map((action) => {
                  const checked = selectedActionCodes.includes(action.code);
                  return (
                    <button
                      key={action.code}
                      type="button"
                      onClick={() => onToggleAction(action.code)}
                      disabled={loading}
                      className={`h-12 rounded-xl border px-3 text-left text-[14px] font-semibold transition-colors disabled:opacity-60 ${
                        checked
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md border inline-flex items-center justify-center text-[10px] ${
                            checked
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          x
                        </span>
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-11 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleUpsertModal({
  open,
  mode,
  roleName,
  onChangeRoleName,
  onClose,
  onSubmit,
  loading,
}) {
  if (!open) return null;

  const canSubmit = roleName.trim().length >= 2 && !loading;
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] rounded-3xl overflow-hidden shadow-2xl bg-white">
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: GRAD_BLUE }}>
          <h3 className="text-white font-bold text-[20px]">
            {isEdit ? "Modifier le role" : "Ajouter un nouveau role"}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <label className="block text-[11px] font-bold tracking-[1px] text-slate-500 uppercase">
            Nom du role
          </label>
          <input
            value={roleName}
            onChange={(event) => onChangeRoleName(event.target.value)}
            maxLength={60}
            disabled={loading}
            placeholder="Ex: Responsable Qualite"
            className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-slate-50 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <p className="text-xs text-slate-500">
            Le role sera disponible uniquement pour votre societe.
          </p>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-11 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : isEdit ? <Pencil size={16} /> : <Plus size={16} />}
            {isEdit ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionRoles() {
  const { user, canEdit } = useAuth();
  const canEditRoles = canEdit("roles");
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: permissionUserIdParam } = useParams();
  const isPermissionSubPage = Boolean(permissionUserIdParam);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [usersViewMode, setUsersViewMode] = useState("cards");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const savingRef = useRef(false);

  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [matrix, setMatrix] = useState(buildEmptyMatrix);
  const [grantedCountByUser, setGrantedCountByUser] = useState({});

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalModuleCode, setModalModuleCode] = useState("");
  const [modalActionCodes, setModalActionCodes] = useState([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState("create");
  const [roleModalName, setRoleModalName] = useState("");
  const [roleModalTarget, setRoleModalTarget] = useState(null);

  const roleKeyFromQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || "");
    return normalizeRole(searchParams.get("role") || "");
  }, [location.search]);

  const manageableUsers = useMemo(() => {
    return users.filter((entry) => isTenantManageableRole(entry.role || entry.Role || ""));
  }, [users]);

  const usersByRole = useMemo(() => {
    const grouped = new Map();
    manageableUsers.forEach((entry) => {
      const roleKey = normalizeRole(entry.role || entry.Role || "");
      if (!grouped.has(roleKey)) {
        grouped.set(roleKey, []);
      }
      grouped.get(roleKey).push(entry);
    });
    return grouped;
  }, [manageableUsers]);

  const roleCards = useMemo(() => {
    const byKey = new Map();

    roles.forEach((roleItem) => {
      const roleName = roleItem?.nom || roleItem?.name || roleItem?.label || "";
      if (!isTenantManageableRole(roleName)) return;
      const roleKey = normalizeRole(roleName);
      byKey.set(roleKey, {
        key: roleKey,
        label: roleName,
        id: roleItem?.id || "",
        isSystem: Boolean(roleItem?.isSystem),
        isCustom: Boolean(roleItem?.isCustom),
      });
    });

    manageableUsers.forEach((entry) => {
      const roleName = entry.role || entry.Role || "";
      if (!isTenantManageableRole(roleName)) return;
      const roleKey = normalizeRole(roleName);
      if (!byKey.has(roleKey)) {
        byKey.set(roleKey, {
          key: roleKey,
          label: roleName,
          id: "",
          isSystem: false,
          isCustom: false,
        });
      }
    });

    return Array.from(byKey.values()).sort((a, b) => {
      if (a.isSystem !== b.isSystem) {
        return a.isSystem ? -1 : 1;
      }

      return String(a.label || "").localeCompare(String(b.label || ""), "fr", { sensitivity: "base" });
    });
  }, [roles, manageableUsers]);

  const filteredRoleCards = useMemo(() => {
    const normalizedSearch = normalizeKey(roleSearch);
    if (!normalizedSearch) return roleCards;

    return roleCards.filter((entry) => {
      const label = normalizeKey(entry.label || "");
      return label.includes(normalizedSearch);
    });
  }, [roleCards, roleSearch]);

  const roleStats = useMemo(() => {
    const totalRoles = roleCards.length;
    const totalUsers = manageableUsers.length;
    const customRoles = roleCards.filter((role) => role.isCustom).length;
    const averageUsersPerRole = totalRoles > 0 ? (totalUsers / totalRoles).toFixed(1) : "0";

    return {
      totalRoles,
      totalUsers,
      customRoles,
      averageUsersPerRole,
    };
  }, [manageableUsers.length, roleCards]);

  const selectedRoleUsersRaw = useMemo(() => {
    if (!selectedRoleKey) return [];
    return usersByRole.get(selectedRoleKey) || [];
  }, [usersByRole, selectedRoleKey]);

  const selectedRoleUsers = useMemo(() => {
    const normalizedQuery = normalizeKey(query);
    if (!normalizedQuery) return selectedRoleUsersRaw;

    return selectedRoleUsersRaw.filter((entry) => {
      const text = `${entry.nomComplet || ""} ${entry.email || ""}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [query, selectedRoleUsersRaw]);

  const selectedRoleLabel = useMemo(() => {
    const found = roleCards.find((entry) => entry.key === selectedRoleKey);
    if (found?.label) return found.label;
    if (!selectedRoleKey) return "";
    return roleLabelFromKey(selectedRoleKey);
  }, [roleCards, selectedRoleKey]);

  const selectedUser = useMemo(() => {
    return manageableUsers.find((entry) => String(entry.id) === String(selectedUserId)) || null;
  }, [manageableUsers, selectedUserId]);

  const selectedRoleCode = useMemo(() => {
    return normalizeRole(selectedUser?.role || selectedUser?.Role || selectedRoleKey);
  }, [selectedUser, selectedRoleKey]);

  const isSelectedUserManaged = useMemo(() => {
    return isTenantManageableRole(selectedUser?.role || selectedUser?.Role || "");
  }, [selectedUser]);

  const isSelfSelected = useMemo(() => {
    if (!selectedUser || !user) return false;
    return String(selectedUser.id) === String(user.id);
  }, [selectedUser, user]);

  const canManageSelectedUser = canEditRoles && !isSelfSelected && isSelectedUserManaged;

  const moduleRows = useMemo(() => {
    return MODULES.map((moduleItem) => {
      const grantedActions = ACTIONS.filter((action) => {
        return Boolean(matrix[permissionKey(moduleItem.code, action.code)]);
      });

      const availableActions = ACTIONS.filter((action) => {
        const key = permissionKey(moduleItem.code, action.code);
        if (Boolean(matrix[key])) return false;
        if (isDocumentationApprovalLocked(selectedRoleCode, moduleItem.code, action.code)) return false;
        return true;
      });

      return {
        ...moduleItem,
        grantedActions,
        availableActions,
      };
    }).filter((row) => row.grantedActions.length > 0 || row.availableActions.length > 0);
  }, [matrix, selectedRoleCode]);

  const modalModuleOptions = useMemo(() => {
    return moduleRows.filter((row) => row.availableActions.length > 0).map((row) => ({
      code: row.code,
      label: row.label,
    }));
  }, [moduleRows]);

  const modalActionOptions = useMemo(() => {
    if (!modalModuleCode) return [];
    const row = moduleRows.find((entry) => entry.code === modalModuleCode);
    return row?.availableActions || [];
  }, [modalModuleCode, moduleRows]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");

    try {
      const [usersData, rolesData] = await Promise.all([
        apiFetch("/api/user"),
        apiFetch("/api/role/tenant")
          .catch(() => apiFetch("/api/user/roles"))
          .catch(() => []),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement des roles et utilisateurs.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadPermissions = useCallback(async (targetUserId, targetRoleCode) => {
    if (!targetUserId) {
      setMatrix(buildEmptyMatrix());
      return;
    }

    setLoadingPermissions(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await apiFetch(`/api/user/${targetUserId}/permissions/effective`);
      setMatrix(buildMatrixFromPermissions(data, targetRoleCode));
      setGrantedCountByUser((prev) => ({
        ...prev,
        [String(targetUserId)]: countGrantedPermissions(data),
      }));
    } catch (err) {
      setError(err.message || "Erreur de chargement des permissions.");
      setMatrix(buildEmptyMatrix());
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const saveOverridesForMatrix = useCallback(
    async (nextMatrix, successText = "Permissions mises a jour.") => {
      if (!selectedUser || !canManageSelectedUser || savingRef.current) return;

      const targetUserId = String(selectedUser.id);
      const targetRoleCode = selectedRoleCode;
      savingRef.current = true;

      setSaving(true);
      setError("");

      try {
        const overrides = [];

        MODULES.forEach((moduleItem) => {
          ACTIONS.forEach((actionItem) => {
            const key = permissionKey(moduleItem.code, actionItem.code);
            const locked = isDocumentationApprovalLocked(selectedRoleCode, moduleItem.code, actionItem.code);
            const isGranted = locked ? false : Boolean(nextMatrix[key]);
            overrides.push({
              moduleCode: moduleItem.code,
              actionCode: actionItem.code,
              isGranted,
            });
          });
        });

        const data = await apiFetch(`/api/user/${targetUserId}/permissions/overrides`, {
          method: "PUT",
          body: JSON.stringify({ overrides }),
        });

        setMatrix(buildMatrixFromPermissions(data, targetRoleCode));
        setGrantedCountByUser((prev) => ({
          ...prev,
          [targetUserId]: countGrantedPermissions(data),
        }));
        setSuccessMessage(successText);
      } catch (err) {
        const saveError = err.message || "Erreur lors de la sauvegarde.";
        setError(saveError);
        await loadPermissions(targetUserId, targetRoleCode);
        setError(saveError);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [canManageSelectedUser, loadPermissions, selectedRoleCode, selectedUser],
  );

  const applyMatrixMutation = useCallback(
    (mutator, successText) => {
      if (!canManageSelectedUser || savingRef.current || saving) return;
      setSuccessMessage("");

      setMatrix((prev) => {
        const next = mutator(prev);
        void saveOverridesForMatrix(next, successText);
        return next;
      });
    },
    [canManageSelectedUser, saveOverridesForMatrix, saving],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!isPermissionSubPage) return;
    if (!permissionUserIdParam) return;

    setSelectedUserId(String(permissionUserIdParam));
  }, [isPermissionSubPage, permissionUserIdParam]);

  useEffect(() => {
    if (isPermissionSubPage) return;
    if (selectedRoleKey) return;
    if (!roleKeyFromQuery) return;

    const exists = roleCards.some((entry) => entry.key === roleKeyFromQuery);
    if (!exists) return;

    setSelectedRoleKey(roleKeyFromQuery);
  }, [isPermissionSubPage, roleCards, roleKeyFromQuery, selectedRoleKey]);

  useEffect(() => {
    if (!selectedRoleKey) return;

    const roleStillAvailable = roleCards.some((entry) => entry.key === selectedRoleKey);
    if (!roleStillAvailable) {
      setSelectedRoleKey("");
      setSelectedUserId("");
      setQuery("");
      setMatrix(buildEmptyMatrix());
    }
  }, [roleCards, selectedRoleKey]);

  useEffect(() => {
    if (isPermissionSubPage) return;
    if (!selectedRoleKey || !selectedUserId) return;

    const stillExists = selectedRoleUsersRaw.some((entry) => String(entry.id) === String(selectedUserId));
    if (!stillExists) {
      setSelectedUserId("");
      setMatrix(buildEmptyMatrix());
    }
  }, [isPermissionSubPage, selectedRoleKey, selectedRoleUsersRaw, selectedUserId]);

  useEffect(() => {
    if (!selectedRoleKey || selectedRoleUsersRaw.length === 0) return;

    const missingUsers = selectedRoleUsersRaw.filter(
      (entry) => grantedCountByUser[String(entry.id)] === undefined,
    );
    if (missingUsers.length === 0) return;

    let cancelled = false;
    const hydrateCounts = async () => {
      const results = await Promise.all(
        missingUsers.map(async (entry) => {
          try {
            const permissions = await apiFetch(`/api/user/${entry.id}/permissions/effective`);
            return { id: String(entry.id), count: countGrantedPermissions(permissions) };
          } catch {
            return { id: String(entry.id), count: 0 };
          }
        }),
      );

      if (cancelled) return;

      setGrantedCountByUser((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          next[result.id] = result.count;
        });
        return next;
      });
    };

    void hydrateCounts();

    return () => {
      cancelled = true;
    };
  }, [grantedCountByUser, selectedRoleKey, selectedRoleUsersRaw]);

  useEffect(() => {
    if (!selectedUser) {
      setMatrix(buildEmptyMatrix());
      setAddModalOpen(false);
      return;
    }

    if (!selectedRoleKey) {
      const derivedRoleKey = normalizeRole(selectedUser?.role || selectedUser?.Role || "");
      if (derivedRoleKey) {
        setSelectedRoleKey(derivedRoleKey);
      }
    }

    void loadPermissions(String(selectedUser.id), selectedRoleCode);
  }, [loadPermissions, selectedRoleCode, selectedRoleKey, selectedUser]);

  const handleSelectRole = (roleKey) => {
    setSelectedRoleKey(roleKey);
    setSelectedUserId("");
    setQuery("");
    setSuccessMessage("");
    setError("");
    setMatrix(buildEmptyMatrix());
    setAddModalOpen(false);
  };

  const handleBackToRoles = () => {
    setSelectedRoleKey("");
    setSelectedUserId("");
    setQuery("");
    setSuccessMessage("");
    setError("");
    setMatrix(buildEmptyMatrix());
    setAddModalOpen(false);
    navigate("/admin/roles", { replace: false });
  };

  const handleSelectUser = (targetUserId) => {
    const targetUser = selectedRoleUsersRaw.find((entry) => String(entry.id) === String(targetUserId));
    if (!targetUser) return;

    const roleKey = normalizeRole(targetUser.role || targetUser.Role || selectedRoleKey);
    const queryString = roleKey ? `?role=${encodeURIComponent(roleKey)}` : "";
    navigate(`/admin/roles/permissions/${targetUserId}${queryString}`);
  };

  const handleBackToRoleUsers = () => {
    const queryString = selectedRoleKey ? `?role=${encodeURIComponent(selectedRoleKey)}` : "";
    navigate(`/admin/roles${queryString}`);
  };

  const handleRemovePermission = (moduleCode, actionCode) => {
    applyMatrixMutation((prev) => {
      const next = { ...prev };
      next[permissionKey(moduleCode, actionCode)] = false;
      return next;
    }, "Permission retiree.");
  };

  const handleClearModule = (moduleCode) => {
    applyMatrixMutation((prev) => {
      const next = { ...prev };
      ACTIONS.forEach((action) => {
        const key = permissionKey(moduleCode, action.code);
        if (isDocumentationApprovalLocked(selectedRoleCode, moduleCode, action.code)) {
          next[key] = false;
          return;
        }
        next[key] = false;
      });
      return next;
    }, "Permissions du module supprimees.");
  };

  const openAddModal = (prefillModuleCode = "") => {
    setAddModalOpen(true);
    setModalModuleCode(prefillModuleCode);
    setModalActionCodes([]);
  };

  const closeAddModal = () => {
    if (saving) return;
    setAddModalOpen(false);
    setModalModuleCode("");
    setModalActionCodes([]);
  };

  const handleToggleModalAction = (actionCode) => {
    setModalActionCodes((prev) =>
      prev.includes(actionCode) ? prev.filter((code) => code !== actionCode) : [...prev, actionCode],
    );
  };

  const handleChangeModalModule = (moduleCode) => {
    setModalModuleCode(moduleCode);
    setModalActionCodes([]);
  };

  const handleSubmitAddModal = () => {
    if (!modalModuleCode || modalActionCodes.length === 0) return;

    const actionCodesToSet = new Set(modalActionCodes);
    applyMatrixMutation((prev) => {
      const next = { ...prev };
      actionCodesToSet.forEach((actionCode) => {
        next[permissionKey(modalModuleCode, actionCode)] = true;
      });
      return next;
    }, "Permissions ajoutees.");

    closeAddModal();
  };

  const openCreateRoleModal = () => {
    setRoleModalMode("create");
    setRoleModalName("");
    setRoleModalTarget(null);
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (roleCard) => {
    if (!roleCard?.isCustom || !roleCard?.id) return;
    setRoleModalMode("edit");
    setRoleModalName(roleCard.label || "");
    setRoleModalTarget(roleCard);
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setRoleModalName("");
    setRoleModalTarget(null);
    setRoleModalMode("create");
  };

  const submitRoleModal = async () => {
    const trimmedName = String(roleModalName || "").trim();
    if (trimmedName.length < 2) {
      setError("Le nom du role doit contenir au moins 2 caracteres.");
      return;
    }

    setSavingRole(true);
    setError("");
    setSuccessMessage("");

    try {
      if (roleModalMode === "edit") {
        if (!roleModalTarget?.id) {
          throw new Error("Role introuvable pour la modification.");
        }

        await apiFetch(`/api/role/tenant/${roleModalTarget.id}`, {
          method: "PUT",
          body: JSON.stringify({ nom: trimmedName }),
        });
        setSuccessMessage("Role modifie avec succes.");
      } else {
        await apiFetch("/api/role/tenant", {
          method: "POST",
          body: JSON.stringify({ nom: trimmedName }),
        });
        setSuccessMessage("Nouveau role ajoute avec succes.");
      }

      closeRoleModal();
      await loadUsers();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du role.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleCard) => {
    if (!roleCard?.isCustom || !roleCard?.id) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le role "${roleCard.label}" ?`);
    if (!confirmed) return;

    setSavingRole(true);
    setError("");
    setSuccessMessage("");

    try {
      await apiFetch(`/api/role/tenant/${roleCard.id}`, { method: "DELETE" });

      if (roleCard.key === selectedRoleKey) {
        handleBackToRoles();
      }

      setSuccessMessage("Role supprime avec succes.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Impossible de supprimer ce role.");
    } finally {
      setSavingRole(false);
    }
  };

  if (loadingUsers) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500">Chargement des roles et permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]" style={{ fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-[1450px] px-4 md:px-8 py-8 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[26px] leading-tight font-black tracking-[-0.6px] text-slate-900">
              Administration des roles et permissions
            </h1>
            <p className="mt-1 text-[14px] text-slate-500">
              Selectionnez un role, puis un utilisateur, pour gerer ses permissions d'acces.
            </p>
          </div>

          {!selectedRoleKey && !isPermissionSubPage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadUsers()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={15} />
                Actualiser
              </button>
              {canEditRoles && (
                <button
                  onClick={openCreateRoleModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus size={15} />
                  Nouveau role
                </button>
              )}
            </div>
          )}

          {selectedRoleKey && !isPermissionSubPage && (
            <button
              onClick={handleBackToRoles}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Retour aux roles
            </button>
          )}

          {isPermissionSubPage && (
            <button
              onClick={handleBackToRoleUsers}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Retour aux utilisateurs
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}

        {!isPermissionSubPage && !selectedRoleKey && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-blue-600 bg-blue-600 text-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[1px] opacity-90">Total roles</p>
                <p className="mt-2 text-[30px] leading-none font-black">{roleStats.totalRoles}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[1px] text-slate-500">Utilisateurs</p>
                <p className="mt-2 text-[30px] leading-none font-black text-slate-900">{roleStats.totalUsers}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[1px] text-slate-500">Roles custom</p>
                <p className="mt-2 text-[30px] leading-none font-black text-slate-900">{roleStats.customRoles}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[1px] text-slate-500">Utilisateurs moyens par role</p>
                <p className="mt-2 text-[30px] leading-none font-black text-slate-900">{roleStats.averageUsersPerRole}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={roleSearch}
                  onChange={(event) => setRoleSearch(event.target.value)}
                  placeholder="Rechercher un role..."
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredRoleCards.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Aucun role configurable trouve pour votre societe.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRoleCards.map((roleCard, index) => {
                  const roleUsers = usersByRole.get(roleCard.key) || [];
                  const style = ROLE_STYLES[roleCard.key] || ROLE_STYLES.consultant;
                  const basePermissions = ROLE_BASE_PERMISSION_HINTS[roleCard.key] ?? 0;
                  const roleLabel = roleCard.label || roleLabelFromKey(roleCard.key);

                  return (
                    <article
                      key={roleCard.key}
                      className={`bg-white rounded-[18px] border border-slate-200 p-4 shadow-sm hover:shadow-md ${style.glow} transition-all duration-200`}
                      style={{ animation: `cardFade .35s ease-out ${index * 80}ms both` }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconWrap}`}>
                          <Shield size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[20px] font-extrabold tracking-[-0.3px] text-slate-900 truncate">{roleLabel}</h3>
                          <p className="text-[13px] text-slate-500 truncate">
                            {basePermissions} permissions de base
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                          {roleUsers.length} utilisateur(s)
                        </span>
                        {roleCard.isSystem ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                            Role systeme
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                            Role personnalise
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => handleSelectRole(roleCard.key)}
                          className={`h-10 flex-1 rounded-xl text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 bg-gradient-to-r ${style.button}`}
                        >
                          <Users size={16} />
                          Voir les utilisateurs
                        </button>

                        {canEditRoles && roleCard.isCustom && roleCard.id && (
                          <>
                            <button
                              onClick={() => openEditRoleModal(roleCard)}
                              disabled={savingRole}
                              className="w-10 h-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 inline-flex items-center justify-center hover:bg-blue-100 disabled:opacity-50"
                              title="Modifier le role"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => void handleDeleteRole(roleCard)}
                              disabled={savingRole}
                              className="w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 inline-flex items-center justify-center hover:bg-rose-100 disabled:opacity-50"
                              title="Supprimer le role"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {selectedRoleKey && !isPermissionSubPage && (
          <section className="space-y-4">
            <div className="bg-white rounded-[22px] border border-slate-200 px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-violet-700">
                    <Users size={20} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-slate-500">Role selectionne</p>
                    <h2 className="text-[22px] leading-tight font-black text-slate-900 tracking-[-0.35px]">
                      EQUIPE {selectedRoleLabel.toUpperCase()}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                {selectedRoleUsersRaw.length} utilisateur(s)
              </div>
            </div>

            <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="inline-flex items-center rounded-2xl border border-slate-300 bg-slate-100/80 p-1 shadow-sm">
                  <button
                    onClick={() => setUsersViewMode("cards")}
                    title="Vue cartes"
                    className={`h-10 w-12 rounded-xl inline-flex items-center justify-center transition-colors ${
                      usersViewMode === "cards"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <LayoutGrid size={18} />
                    <span className="sr-only">Cartes</span>
                  </button>
                  <button
                    onClick={() => setUsersViewMode("table")}
                    title="Vue tableau"
                    className={`h-10 w-12 rounded-xl inline-flex items-center justify-center transition-colors ${
                      usersViewMode === "table"
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <List size={18} />
                    <span className="sr-only">Tableau</span>
                  </button>
                </div>
              </div>

              {selectedRoleUsers.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500 text-sm">
                  Aucun utilisateur trouve pour ce role.
                </div>
              ) : usersViewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {selectedRoleUsers.map((entry) => {
                    const inheritedCount = ROLE_BASE_PERMISSION_HINTS[selectedRoleKey] ?? 0;
                    const effectiveCount = grantedCountByUser[String(entry.id)];
                    const customCount =
                      typeof effectiveCount === "number"
                        ? Math.max(effectiveCount - inheritedCount, 0)
                        : null;

                    return (
                      <div
                        key={entry.id}
                        className="group rounded-xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50 p-3 shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:shadow-[0_10px_22px_rgba(37,99,235,0.13)] transition-all duration-200"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/70 shadow-sm flex items-center justify-center font-extrabold text-[18px]">
                            {String(entry.nomComplet || "?").trim().charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-slate-900 text-[18px] leading-tight tracking-[-0.1px] truncate">
                              {entry.nomComplet}
                            </div>
                            <div className="text-[13px] text-slate-500 truncate mt-0.5">{entry.email}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5">
                            <p className="text-[9px] uppercase tracking-[0.8px] font-bold text-blue-700/80">Heritees</p>
                            <p className="text-[13px] font-extrabold text-blue-700 mt-0.5">{inheritedCount}</p>
                          </div>
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                            <p className="text-[9px] uppercase tracking-[0.8px] font-bold text-amber-700/80">Custom</p>
                            <p className="text-[13px] font-extrabold text-amber-700 mt-0.5">
                              {customCount === null ? "..." : customCount > 0 ? `+${customCount}` : "Aucune"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <button
                            onClick={() => handleSelectUser(entry.id)}
                            className="h-8 w-full rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 group-hover:shadow-[0_6px_14px_rgba(37,99,235,0.28)] transition-all"
                          >
                            Voir permissions
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[860px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs uppercase tracking-[1px] text-slate-500 font-bold">
                        <th className="px-4 py-3 text-left">Utilisateur</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Permissions role</th>
                        <th className="px-4 py-3 text-left">Permissions custom</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRoleUsers.map((entry) => {
                        const inheritedCount = ROLE_BASE_PERMISSION_HINTS[selectedRoleKey] ?? 0;
                        const effectiveCount = grantedCountByUser[String(entry.id)];
                        const customCount =
                          typeof effectiveCount === "number"
                            ? Math.max(effectiveCount - inheritedCount, 0)
                            : null;

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{entry.nomComplet}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{entry.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-[11px]">
                                {inheritedCount} heritees
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {customCount === null ? (
                                <span className="text-slate-400 text-[11px]">...</span>
                              ) : customCount > 0 ? (
                                <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold text-[11px]">
                                  +{customCount}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Aucune custom</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleSelectUser(entry.id)}
                                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
                              >
                                Voir permissions
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {isPermissionSubPage && (
          <section className="space-y-4">
            <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
              {!selectedUser ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                  Utilisateur introuvable ou inaccessible.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-700">
                        <Shield size={20} />
                      </span>
                      <div>
                        <h2 className="text-[24px] leading-tight font-black text-slate-900 tracking-[-0.3px]">
                          Permissions de {selectedUser.nomComplet}
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Role: {selectedRoleLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openAddModal("")}
                      disabled={!canManageSelectedUser || saving || loadingPermissions || modalModuleOptions.length === 0}
                      className="h-11 px-5 rounded-xl bg-blue-600 text-white font-bold text-[14px] hover:bg-blue-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Ajouter des permissions
                    </button>
                  </div>

                  {isSelfSelected && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm flex items-start gap-2">
                      <AlertTriangle size={16} className="mt-0.5" />
                      <span>La modification de vos propres permissions est bloquee pour eviter une perte d&apos;acces.</span>
                    </div>
                  )}

                  {!canEditRoles && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm">
                      Votre role est en lecture seule sur cette page.
                    </div>
                  )}

                  {!isSelectedUserManaged && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm">
                      Cet utilisateur n&apos;est pas configurable depuis cet espace.
                    </div>
                  )}

                  {loadingPermissions ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500 text-center flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Chargement des permissions...
                    </div>
                  ) : moduleRows.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500 text-center">
                      Aucune permission disponible.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {moduleRows.map((row) => (
                        <div key={row.code} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-end gap-4 flex-wrap">
                            <div className="w-full sm:w-[180px]">
                              <p className="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase mb-1">Module</p>
                              <div className="h-11 px-4 rounded-xl border border-slate-300 bg-slate-50 flex items-center text-[14px] font-semibold text-slate-700">
                                {row.label}
                              </div>
                            </div>

                            <div className="flex-1 min-w-[240px]">
                              <p className="text-[10px] font-bold tracking-[2px] text-slate-500 uppercase mb-1">
                                Permissions
                              </p>
                              <div className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-2 flex-wrap">
                                {row.grantedActions.map((action) => (
                                  <span
                                    key={action.code}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  >
                                    {action.label}
                                    {canManageSelectedUser && !saving && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePermission(row.code, action.code)}
                                        className="text-emerald-700 hover:text-emerald-900"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </span>
                                ))}

                                {row.availableActions.length > 0 && canManageSelectedUser && !saving && (
                                  <button
                                    onClick={() => openAddModal(row.code)}
                                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    + Permissions
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="sm:pb-1">
                              <button
                                onClick={() => handleClearModule(row.code)}
                                disabled={!canManageSelectedUser || saving || row.grantedActions.length === 0}
                                className="w-10 h-10 rounded-xl text-rose-500 hover:bg-rose-50 inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Supprimer toutes les permissions du module"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Shield size={14} />
                    Verification finale forcee par l&apos;API.
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>

      <AddPermissionModal
        open={addModalOpen}
        onClose={closeAddModal}
        modules={modalModuleOptions}
        actions={modalActionOptions}
        selectedModuleCode={modalModuleCode}
        selectedActionCodes={modalActionCodes}
        onSelectModule={handleChangeModalModule}
        onToggleAction={handleToggleModalAction}
        onSubmit={handleSubmitAddModal}
        loading={saving}
      />

      <RoleUpsertModal
        open={roleModalOpen}
        mode={roleModalMode}
        roleName={roleModalName}
        onChangeRoleName={setRoleModalName}
        onClose={closeRoleModal}
        onSubmit={submitRoleModal}
        loading={savingRole}
      />

      <style>
        {`
          @keyframes cardFade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
