import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  Unlock,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { appAlert, appConfirm } from "../../utils/appDialogs";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const DISALLOWED_ROLE_KEYS = new Set(["superadmin", "adminsociete"]);

function getToken() {
  return localStorage.getItem("token") || "";
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveSocieteId(user) {
  return (
    normalizeId(user?.societeId) ??
    normalizeId(user?.SocieteId) ??
    normalizeId(user?.societe?.id) ??
    normalizeId(user?.societe?.Id)
  );
}

function normalizeRoleKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]/g, "")
    .trim();
}

function isTenantManageableRole(roleName) {
  const roleKey = normalizeRoleKey(roleName);
  if (!roleKey) return false;
  return !DISALLOWED_ROLE_KEYS.has(roleKey);
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erreur ${response.status}`);
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

function emptyForm() {
  return {
    nomComplet: "",
    email: "",
    roleId: "",
    password: "",
    confirmPassword: "",
    isActive: true,
  };
}

export default function GestionUtilisateurs() {
  const { user } = useAuth();
  const societeId = useMemo(() => resolveSocieteId(user), [user]);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const roleIdByName = useMemo(() => {
    const map = new Map();
    roles.forEach((entry) => {
      const key = normalizeRoleKey(entry.nom || entry.name || "");
      if (!key) return;
      map.set(key, String(entry.id));
    });
    return map;
  }, [roles]);

  const loadData = useCallback(async () => {
    if (!societeId) {
      setError("Societe introuvable sur votre session.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [usersData, rolesData] = await Promise.all([
        apiFetch("/api/user"),
        apiFetch("/api/user/roles"),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      setError(err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [societeId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const text = `${item.nomComplet || ""} ${item.email || ""}`.toLowerCase();
      const matchesSearch = !search.trim() || text.includes(search.toLowerCase().trim());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    const roleName = item.role || item.Role || "";
    if (!isTenantManageableRole(roleName)) {
      void appAlert("Ce role n'est pas modifiable depuis l'espace Admin societe.", {
        title: "Action impossible",
      });
      return;
    }

    const mappedRoleId = roleIdByName.get(normalizeRoleKey(roleName)) || "";

    setEditingUser(item);
    setForm({
      nomComplet: item.nomComplet || "",
      email: item.email || "",
      roleId: mappedRoleId,
      password: "",
      confirmPassword: "",
      isActive: Boolean(item.isActive),
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm());
  };

  const submit = async () => {
    if (!societeId) {
      setError("Societe introuvable sur votre session.");
      return;
    }

    if (!form.nomComplet.trim() || !form.email.trim() || !form.roleId) {
      await appAlert("Nom, email et role sont obligatoires.", { title: "Champs requis" });
      return;
    }

    const selectedRole = roles.find((entry) => String(entry.id) === String(form.roleId));
    if (!isTenantManageableRole(selectedRole?.nom || selectedRole?.name || "")) {
      await appAlert("Role non autorise.", { title: "Action refusee" });
      return;
    }

    if (!editingUser && !form.password.trim()) {
      await appAlert("Le mot de passe est obligatoire a la creation.", { title: "Champ requis" });
      return;
    }

    if ((form.password || form.confirmPassword) && form.password !== form.confirmPassword) {
      await appAlert("Les mots de passe ne correspondent pas.", { title: "Validation" });
      return;
    }

    const payload = {
      nomComplet: form.nomComplet.trim(),
      email: form.email.trim(),
      societeId,
      roleId: String(form.roleId),
      isActive: Boolean(form.isActive),
    };

    if (form.password.trim()) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await apiFetch(`/api/user/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/user", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        });
      }

      closeModal();
      await loadData();
    } catch (err) {
      await appAlert(err.message || "Erreur lors de l'enregistrement.", {
        title: "Echec de l'enregistrement",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (id) => {
    const target = users.find((item) => String(item.id) === String(id));
    const targetRole = target?.role || target?.Role || "";
    if (!isTenantManageableRole(targetRole)) {
      await appAlert("Ce role ne peut pas etre supprime depuis cet espace.", {
        title: "Action impossible",
      });
      return;
    }

    const confirmed = await appConfirm("Confirmer la suppression de cet utilisateur ?", {
      title: "Supprimer l'utilisateur",
      confirmText: "Supprimer",
    });
    if (!confirmed) return;

    try {
      await apiFetch(`/api/user/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      await appAlert(err.message || "Erreur lors de la suppression.", {
        title: "Suppression impossible",
      });
    }
  };

  const toggleUserStatus = async (target) => {
    if (!societeId) return;

    const targetRole = target.role || target.Role || "";
    if (!isTenantManageableRole(targetRole)) {
      await appAlert("Ce role ne peut pas etre modifie depuis cet espace.", {
        title: "Action impossible",
      });
      return;
    }

    const roleId = roleIdByName.get(normalizeRoleKey(targetRole));
    if (!roleId) {
      await appAlert("Impossible de resoudre le role de cet utilisateur.", {
        title: "Mise a jour impossible",
      });
      return;
    }

    try {
      await apiFetch(`/api/user/${target.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nomComplet: target.nomComplet,
          email: target.email,
          societeId,
          roleId,
          isActive: !target.isActive,
          password: "",
          confirmPassword: "",
        }),
      });
      await loadData();
    } catch (err) {
      await appAlert(err.message || "Erreur lors de la mise a jour.", {
        title: "Mise a jour impossible",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg w-full">
          <p className="text-red-600">{error}</p>
          <button onClick={() => void loadData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={{ fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-[1300px] px-8 py-8 pb-16">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">Gestion des utilisateurs</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Comptes de votre societe uniquement
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} />
            Nouvel utilisateur
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <KpiCard label="Total" value={stats.total} primary />
          <KpiCard label="Actifs" value={stats.active} />
          <KpiCard label="Inactifs" value={stats.inactive} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-2 rounded-lg text-sm border ${statusFilter === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-2 rounded-lg text-sm border ${statusFilter === "active" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
            >
              Actifs
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-2 rounded-lg text-sm border ${statusFilter === "inactive" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
            >
              Inactifs
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Utilisateur</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Date creation</th>
                  <th className="px-6 py-4 text-left">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Aucun utilisateur trouve.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {(item.nomComplet || "?")
                              .split(" ")
                              .map((segment) => segment[0] || "")
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{item.nomComplet}</div>
                            <div className="text-xs text-slate-400">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-200">
                          {item.role || item.Role || "-"}
                        </span>
                        {!isTenantManageableRole(item.role || item.Role || "") && (
                          <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] border border-slate-200">
                            non editable
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.dateCreation || item.DateCreation || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {item.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const manageable = isTenantManageableRole(item.role || item.Role || "");
                          return (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            disabled={!manageable}
                            className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => void toggleUserStatus(item)}
                            disabled={!manageable}
                            className={`p-2 rounded-lg transition ${item.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={item.isActive ? "Desactiver" : "Activer"}
                          >
                            {item.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                          <button
                            onClick={() => void removeUser(item.id)}
                            disabled={!manageable}
                            className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ background: GRAD_BLUE }}>
              <h3 className="font-bold text-white">{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/15 rounded-lg transition">
                <X size={16} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nom complet *" icon={User}>
                  <input
                    value={form.nomComplet}
                    onChange={(event) => setForm((prev) => ({ ...prev, nomComplet: event.target.value }))}
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField label="Email *" icon={Mail}>
                  <input
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    type="email"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField label="Role *" icon={Shield}>
                  <select
                    value={form.roleId}
                    onChange={(event) => setForm((prev) => ({ ...prev, roleId: event.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selectionner</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nom || role.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                {editingUser && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Statut</label>
                    <div className="mt-1 flex gap-4 p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={form.isActive === true} onChange={() => setForm((prev) => ({ ...prev, isActive: true }))} />
                        Actif
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={form.isActive === false} onChange={() => setForm((prev) => ({ ...prev, isActive: false }))} />
                        Inactif
                      </label>
                    </div>
                  </div>
                )}

                <FormField label={editingUser ? "Mot de passe (optionnel)" : "Mot de passe *"} icon={Lock}>
                  <input
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={15} className="text-slate-400" /> : <Eye size={15} className="text-slate-400" />}
                  </button>
                </FormField>

                <FormField label="Confirmer mot de passe" icon={Lock}>
                  <input
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button onClick={closeModal} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition">
                  Annuler
                </button>
                <button
                  onClick={() => void submit()}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {saving ? "Enregistrement..." : editingUser ? "Mettre a jour" : "Creer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, primary = false }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{
        background: primary ? GRAD_BLUE : "#fff",
        boxShadow: primary
          ? "0 8px 24px rgba(29,78,216,.35)"
          : "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)",
      }}
    >
      <div className="text-3xl font-bold" style={{ color: primary ? "#fff" : "#111827" }}>
        {value}
      </div>
      <div className="text-xs font-semibold mt-1" style={{ color: primary ? "rgba(255,255,255,.9)" : "#374151" }}>
        {label}
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        {children}
      </div>
    </div>
  );
}
