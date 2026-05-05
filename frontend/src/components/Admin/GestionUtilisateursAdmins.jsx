import React, { useState, useEffect, useCallback } from 'react';
import { Unlock, Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Users, Mail, Shield, Factory, Lock, Eye, EyeOff, X, CheckCircle, ChevronDown } from 'lucide-react';
import axios from 'axios';

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const API_BASE = 'http://localhost:5006';

export default function GestionUtilisateursAdmins() {
  const [users, setUsers] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchData = useCallback(async () => {
    setFetchLoading(true);
    setError("");
    try {
      const config = getAuthConfig();
      
      const [usersRes, societesRes, rolesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/user`, config),
        axios.get(`${API_BASE}/api/societe`, config),
        axios.get(`${API_BASE}/api/role`, config)
      ]);

      console.log('Utilisateurs reçus:', usersRes.data);
      
      // FILTRE: Garder uniquement les utilisateurs avec le rôle "Admin"
      const adminUsers = usersRes.data.filter(user => user.role === "Admin");
      
      console.log('Utilisateurs Admin uniquement:', adminUsers);
      
      setUsers(adminUsers);
      setSocietes(societesRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error("Erreur chargement :", error);
      if (error.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.response?.data || "Impossible de charger les données.");
      }
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!form.nomComplet.trim()) {
      alert("Le nom complet est requis.");
      return;
    }
    if (!form.email.trim()) {
      alert("L'email est requis.");
      return;
    }
    if (!editing && !form.password) {
      alert("Le mot de passe est requis pour un nouvel utilisateur.");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const config = getAuthConfig();
      
      if (editing) {
        await axios.put(`${API_BASE}/api/user/${editing.id}`, {
          nomComplet: form.nomComplet,
          email: form.email,
          societeId: form.societeId ? Number(form.societeId) : null,
          roleId: form.roleId,
          isActive: form.isActive,
          password: form.password || undefined
        }, config);
      } else {
        await axios.post(`${API_BASE}/api/user`, {
          nomComplet: form.nomComplet,
          email: form.email,
          societeId: form.societeId ? Number(form.societeId) : null,
          roleId: form.roleId,
          password: form.password
        }, config);
      }

      await fetchData();

      setModalOpen(false);
      setEditing(null);
      setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true });
      setShowPwd(false);
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
      alert(error.response?.data || "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/api/user/${id}`, config);
      await fetchData();
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert(error.response?.data || "Erreur lors de la suppression.");
    }
  };

  const handleToggle = async (user) => {
    try {
      const config = getAuthConfig();
      await axios.put(`${API_BASE}/api/user/${user.id}`, {
        nomComplet: user.nomComplet,
        email: user.email,
        societeId: user.societeId,
        roleId: user.roleId,
        isActive: !user.isActive
      }, config);
      await fetchData();
    } catch (error) {
      console.error("Erreur changement statut :", error);
      alert(error.response?.data || "Erreur lors du changement de statut.");
    }
  };

  // Filtrer les utilisateurs (déjà filtrés par rôle Admin, mais on peut encore filtrer par recherche)
  const filtered = users.filter(u => {
    const matchSearch = !search || 
      u.nomComplet?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || String(u.isActive) === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: users.length,
    actifs: users.filter(u => u.isActive).length,
    inactifs: users.filter(u => !u.isActive).length,
    societesCouvertes: new Set(users.map(u => u.societe).filter(s => s && s !== "—")).size,
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const kpis = [
    { label: 'Total Admins', value: stats.total, sub: `${stats.total} administrateur(s)`, primary: true },
    { label: 'Actifs', value: stats.actifs, sub: `${Math.round((stats.actifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Inactifs', value: stats.inactifs, sub: `${Math.round((stats.inactifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Sociétés couvertes', value: stats.societesCouvertes, sub: `par les administrateurs` },
  ];

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement des administrateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={{ fontFamily: "'Sora', 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-[1400px] px-9 py-9 pb-16 w-full">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.8px" }}>Gestion des administrateurs</h1>
            <p className="mt-1 text-[13.5px] text-slate-500">Administration des comptes administrateurs (rôle Admin)</p>
          </div>
          <button 
            onClick={() => { setEditing(null); setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true }); setModalOpen(true); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            <Plus size={18} /> Nouvel administrateur
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          {kpis.map((k, i) => (
            <div 
              key={i} 
              className="rounded-2xl p-5 shadow-sm" 
              style={{ 
                background: k.primary ? GRAD_BLUE : "#fff", 
                boxShadow: k.primary ? "0 8px 24px rgba(29,78,216,.35)" : "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)",
                animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
              }}
            >
              <div className="text-3xl font-bold" style={{ color: k.primary ? "#fff" : "#111827" }}>{k.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: k.primary ? "rgba(255,255,255,.9)" : "#374151" }}>{k.label}</div>
              <div className="text-xs mt-0.5" style={{ color: k.primary ? "rgba(255,255,255,.6)" : "#9CA3AF" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher par nom ou email..." 
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="h-10 px-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
              <button 
                onClick={() => { setSearch(""); setStatusFilter(""); }} 
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm hover:bg-slate-50 transition"
              >
                <SlidersHorizontal size={15} /> Réinitialiser
              </button>
            </div>
            <div className="flex border border-slate-300 rounded-xl overflow-hidden">
              <button 
                onClick={() => setViewMode("grid")} 
                className={`px-3 py-2 transition ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <LayoutGrid size={17} />
              </button>
              <button 
                onClick={() => setViewMode("table")} 
                className={`px-3 py-2 transition ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500">Aucun administrateur trouvé.</p>
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((user, idx) => (
              <div key={user.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition" style={{ animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${idx * 60}ms both` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {initials(user.nomComplet)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{user.nomComplet}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-200">
                    {user.role || "—"}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs border border-slate-200">
                    {user.societe || "—"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Créé le : {user.dateCreation || "—"}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditing(user); 
                      setForm({ 
                        nomComplet: user.nomComplet, 
                        email: user.email, 
                        societeId: "", 
                        roleId: "", 
                        password: "", 
                        confirmPassword: "", 
                        isActive: user.isActive 
                      }); 
                      setModalOpen(true); 
                    }} 
                    className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition"
                  >
                    <Edit size={14} /> Modifier
                  </button>
                  <button 
                    onClick={() => handleToggle(user)} 
                    className={`flex-1 py-2 rounded-lg text-sm transition ${user.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                  >
                    {user.isActive ? "Suspendre" : "Activer"}
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Utilisateur</th>
                    <th className="px-6 py-4 text-left">Rôle</th>
                    <th className="px-6 py-4 text-left">Société</th>
                    <th className="px-6 py-4 text-left">Date création</th>
                    <th className="px-6 py-4 text-left">Statut</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => (
                    <tr key={user.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {initials(user.nomComplet)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{user.nomComplet}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-200">
                          {user.role || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.societe || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.dateCreation || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => { 
                              setEditing(user); 
                              setForm({ 
                                nomComplet: user.nomComplet, 
                                email: user.email, 
                                societeId: "", 
                                roleId: "", 
                                password: "", 
                                confirmPassword: "", 
                                isActive: user.isActive 
                              }); 
                              setModalOpen(true); 
                            }} 
                            className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleToggle(user)} 
                            className={`p-2 rounded-lg transition ${user.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                            title={user.isActive ? "Désactiver" : "Activer"}
                          >
                            {user.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)} 
                            className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
              <div className="sticky top-0 px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
                <h3 className="font-bold text-white">{editing ? "Modifier l'administrateur" : "Nouvel administrateur"}</h3>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="p-2 hover:bg-white/15 rounded-lg transition"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nom complet *</label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        value={form.nomComplet} 
                        onChange={e => setForm({...form, nomComplet: e.target.value})} 
                        type="text" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email *</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})} 
                        type="email" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Rôle *</label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <select 
                        value={form.roleId} 
                        onChange={e => setForm({...form, roleId: e.target.value})} 
                        className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Sélectionner</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.nom}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Société</label>
                    <div className="relative mt-1">
                      <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <select 
                        value={form.societeId} 
                        onChange={e => setForm({...form, societeId: e.target.value})} 
                        className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Aucune société</option>
                        {societes.map(s => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">{editing ? "Mot de passe (optionnel)" : "Mot de passe *"}</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                        type={showPwd ? "text" : "password"} 
                        className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPwd(!showPwd)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPwd ? <EyeOff size={15} className="text-slate-400" /> : <Eye size={15} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input 
                        value={form.confirmPassword} 
                        onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                        type={showPwd ? "text" : "password"} 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                </div>
                {editing && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Statut</label>
                    <div className="flex gap-4 mt-1 p-3 border border-slate-300 rounded-lg bg-slate-50">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={form.isActive === true} 
                          onChange={() => setForm({...form, isActive: true})} 
                          className="w-4 h-4" 
                        /> 
                        Actif
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          checked={form.isActive === false} 
                          onChange={() => setForm({...form, isActive: false})} 
                          className="w-4 h-4" 
                        /> 
                        Inactif
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => setModalOpen(false)} 
                    className="flex-1 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading} 
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle size={15} />
                    )}
                    {editing ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}