// components/Admin/GestionUtilisateurs.jsx
import React, { useState, useEffect } from 'react';
import { Unlock, Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Users, Mail, Shield, Factory, Lock, Eye, EyeOff, X, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";

// Service API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006';

const api = {
  // Users
  getUsers: async () => {
    const response = await fetch(`${API_URL}/api/user`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Erreur chargement users');
    return response.json();
  },
  createUser: async (userData) => {
    const response = await fetch(`${API_URL}/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return response.text();
  },
  updateUser: async (id, userData) => {
    const response = await fetch(`${API_URL}/api/user/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return response.text();
  },
  deleteUser: async (id) => {
    const response = await fetch(`${API_URL}/api/user/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return response.text();
  },
  
  // Roles
  getRoles: async () => {
    const response = await fetch(`${API_URL}/api/role`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Erreur chargement rôles');
    return response.json();
  },
  
  // Sociétés
  getSocietes: async () => {
    const response = await fetch(`${API_URL}/api/societe`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Erreur chargement sociétés');
    return response.json();
  }
};

export default function GestionUtilisateursAdmins() {
  const [users, setUsers] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true
  });

  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData, societesData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getSocietes()
      ]);
      
      console.log('Users data:', usersData);
      console.log('Roles data:', rolesData);
      console.log('Societes data:', societesData);
      
      setUsers(usersData);
      setRoles(rolesData);
      setSocietes(societesData);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des utilisateurs
  const filtered = users.filter(u => {
    const matchSearch = !search || 
      u.nomComplet?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || String(u.isActive) === statusFilter;
    return matchSearch && matchStatus;
  });

  // Statistiques
  const stats = {
    total: users.length,
    actifs: users.filter(u => u.isActive).length,
    inactifs: users.filter(u => !u.isActive).length,
    societesCouvertes: new Set(users.map(u => u.societeId).filter(Boolean)).size,
  };

  // Gestion des utilisateurs
  const handleSave = async () => {
    if (!editing && !form.password) {
      alert("Mot de passe requis pour la création !");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }
    
    setSaving(true);
    try {
      if (editing) {
        const updateData = {
          nomComplet: form.nomComplet,
          email: form.email,
          societeId: parseInt(form.societeId),
          roleId: form.roleId,
          isActive: form.isActive
        };
        
        if (form.password) {
          updateData.password = form.password;
          updateData.confirmPassword = form.confirmPassword;
        }
        
        console.log('Update data:', updateData);
        await api.updateUser(editing.id, updateData);
      } else {
        const createData = {
          nomComplet: form.nomComplet,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          societeId: parseInt(form.societeId),
          roleId: form.roleId
        };
        
        console.log('Create data:', createData);
        await api.createUser(createData);
      }
      
      await loadData();
      setModalOpen(false);
      setEditing(null);
      setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true });
    } catch (err) {
      console.error('Erreur save:', err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression définitive ?")) return;
    
    try {
      await api.deleteUser(id);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (user) => {
    try {
      await api.updateUser(user.id, {
        nomComplet: user.nomComplet,
        email: user.email,
        societeId: user.societeId,
        roleId: user.roleId.toString(),
        isActive: !user.isActive
      });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const kpis = [
    { label: 'Total Admins', value: stats.total, sub: `${stats.total} utilisateur(s)`, primary: true },
    { label: 'Actifs', value: stats.actifs, sub: `${Math.round((stats.actifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Inactifs', value: stats.inactifs, sub: `${Math.round((stats.inactifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Sociétés couvertes', value: stats.societesCouvertes, sub: `sur ${societes.length} sociétés` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          Erreur : {error}
          <button onClick={loadData} className="ml-4 px-3 py-1 bg-red-100 rounded-lg">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs admins</h1>
          <p className="text-sm text-slate-500">Administration des comptes et des accès utilisateurs</p>
        </div>
        <button 
          onClick={() => { 
            setEditing(null); 
            setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true }); 
            setModalOpen(true); 
          }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Nouvel Admin
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        {kpis.map((k, i) => (
          <div 
            key={i} 
            className="rounded-2xl p-5 shadow-sm transition-transform hover:scale-105" 
            style={{ 
              background: k.primary ? GRAD_BLUE : "#fff", 
              boxShadow: k.primary ? "0 8px 24px rgba(29,78,216,.30)" : "0 2px 8px rgba(0,0,0,.06)" 
            }}
          >
            <div className="text-3xl font-bold" style={{ color: k.primary ? "#fff" : "#111827" }}>{k.value}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: k.primary ? "rgba(255,255,255,.9)" : "#374151" }}>{k.label}</div>
            <div className="text-xs mt-0.5" style={{ color: k.primary ? "rgba(255,255,255,.6)" : "#9CA3AF" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border p-5 mb-5">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Rechercher par nom ou email..." 
            className="w-full h-12 pl-11 pr-4 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="h-10 px-4 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
            <button 
              onClick={() => { setSearch(""); setStatusFilter(""); }} 
              className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-slate-50 transition"
            >
              <SlidersHorizontal size={15} /> Réinitialiser
            </button>
          </div>
          <div className="flex border rounded-xl overflow-hidden">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`px-3 py-2 transition ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white hover:bg-slate-50"}`}
            >
              <LayoutGrid size={17} />
            </button>
            <button 
              onClick={() => setViewMode("table")} 
              className={`px-3 py-2 transition ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white hover:bg-slate-50"}`}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          Aucun utilisateur trouvé.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
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
                <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs">
                  {user.Role || user.role || "—"}
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {user.Societe || user.societe || "—"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Créé le : {user.DateCreation || user.dateCreation || "—"}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    setEditing(user); 
                    setForm({ 
                      nomComplet: user.nomComplet, 
                      email: user.email, 
                      societeId: user.societeId?.toString() || "", 
                      roleId: user.roleId?.toString() || "", 
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
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b">
              <tr className="text-xs font-bold text-slate-500">
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
                <tr key={user.id} className={`border-b hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
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
                    <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs">
                      {user.Role || user.role || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.Societe || user.societe || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.DateCreation || user.dateCreation || "—"}
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
                            societeId: user.societeId?.toString() || "", 
                            roleId: user.roleId?.toString() || "", 
                            password: "", 
                            confirmPassword: "", 
                            isActive: user.isActive 
                          }); 
                          setModalOpen(true); 
                        }} 
                        className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        onClick={() => handleToggle(user)} 
                        className={`p-2 rounded-lg transition ${user.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                      >
                        {user.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition"
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
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
              <h3 className="font-bold text-white">{editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/15 rounded-lg transition">
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
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                      className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Société *</label>
                  <div className="relative mt-1">
                    <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <select 
                      value={form.societeId} 
                      onChange={e => setForm({...form, societeId: e.target.value})} 
                      className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      {societes.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    {editing ? "Mot de passe (optionnel)" : "Mot de passe *"}
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      type={showPwd ? "text" : "password"} 
                      className="w-full pl-9 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
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
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
              </div>
              {editing && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <div className="flex gap-4 mt-1 p-3 border rounded-lg bg-slate-50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={form.isActive === true} 
                        onChange={() => setForm({...form, isActive: true})} 
                        className="w-4 h-4" 
                      /> Actif
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={form.isActive === false} 
                        onChange={() => setForm({...form, isActive: false})} 
                        className="w-4 h-4" 
                      /> Inactif
                    </label>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="flex-1 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {saving ? "Chargement…" : (editing ? "Enregistrer" : "Créer")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}