// components/GestionUtilisateurs.jsx
import React, { useState } from 'react';
import { Unlock, Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Users, Mail, Shield, Factory, Lock, Eye, EyeOff, X, CheckCircle, ChevronDown } from 'lucide-react';

const MOCK_SOCIETES = [
  { id: 1, nom: "Nexalys Solutions" },
  { id: 2, nom: "Nexalys Consulting" },
  { id: 3, nom: "AlphaCloud" },
  { id: 4, nom: "DataSecure Inc." },
  { id: 5, nom: "Nexalys Digital" },
];

const MOCK_ROLES = [
  { id: 1, nom: "Super Admin" },
  { id: 2, nom: "Admin Holding" },
  { id: 3, nom: "Admin Société" },
];

const MOCK_USERS = [
  { id: 1, nomComplet: "Karim Benali", email: "k.benali@nexalys.fr", societeId: 1, roleId: 3, isActive: true, dateCreation: "12/03/2025" },
  { id: 2, nomComplet: "Sofia Marchand", email: "s.marchand@nexalys.fr", societeId: 2, roleId: 3, isActive: true, dateCreation: "15/03/2025" },
  { id: 3, nomComplet: "David Nguyen", email: "d.nguyen@alphacloud.be", societeId: 3, roleId: 1, isActive: true, dateCreation: "20/03/2025" },
  { id: 4, nomComplet: "Inès Chabane", email: "i.chabane@datasecure.ch", societeId: 4, roleId: 3, isActive: false, dateCreation: "25/03/2025" },
  { id: 5, nomComplet: "Marc Dubois", email: "m.dubois@nexalys.fr", societeId: 5, roleId: 2, isActive: true, dateCreation: "01/04/2025" },
];

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";

export default function GestionUtilisateursAdmins() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [societes] = useState(MOCK_SOCIETES);
  const [roles] = useState(MOCK_ROLES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true
  });

  const filtered = users.filter(u => {
    const matchSearch = !search || u.nomComplet.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || String(u.isActive) === statusFilter;
    return matchSearch && matchStatus;
  });

  // Nombre de sociétés distinctes qui ont au moins un admin
  const societesCouvertes = new Set(users.map(u => u.societeId).filter(Boolean)).size;

  const stats = {
    total: users.length,
    actifs: users.filter(u => u.isActive).length,
    inactifs: users.filter(u => !u.isActive).length,
    societesCouvertes: societesCouvertes,
  };

  const handleSave = () => {
    if (!editing && !form.password) { alert("Mot de passe requis !"); return; }
    if (form.password && form.password !== form.confirmPassword) { alert("Mots de passe différents !"); return; }
    
    setLoading(true);
    setTimeout(() => {
      if (editing) {
        setUsers(users.map(u => u.id === editing.id ? { ...u, nomComplet: form.nomComplet, email: form.email, societeId: Number(form.societeId), roleId: Number(form.roleId), isActive: form.isActive } : u));
      } else {
        setUsers([...users, { id: Date.now(), nomComplet: form.nomComplet, email: form.email, societeId: Number(form.societeId), roleId: Number(form.roleId), isActive: true, dateCreation: new Date().toLocaleDateString() }]);
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true });
      setLoading(false);
    }, 300);
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer cet utilisateur ?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleToggle = (user) => {
    setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const kpis = [
    { label: 'Total Admins', value: stats.total, sub: `${stats.total} utilisateur(s)`, primary: true },
    { label: 'Actifs', value: stats.actifs, sub: `${Math.round((stats.actifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Inactifs', value: stats.inactifs, sub: `${Math.round((stats.inactifs / (stats.total || 1)) * 100)}% du total` },
    { label: 'Sociétés couvertes', value: stats.societesCouvertes, sub: `sur ${societes.length} sociétés` },
  ];

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs admins</h1>
          <p className="text-sm text-slate-500">Administration des comptes et des accès utilisateurs</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ nomComplet: "", email: "", societeId: "", roleId: "", password: "", confirmPassword: "", isActive: true }); setModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus size={18} /> Nouvel Admin
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-2xl p-5 shadow-sm" style={{ background: k.primary ? GRAD_BLUE : "#fff", boxShadow: k.primary ? "0 8px 24px rgba(29,78,216,.30)" : "0 2px 8px rgba(0,0,0,.06)" }}>
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full h-12 pl-11 pr-4 rounded-xl border bg-slate-50 text-sm" />
        </div>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-4 border rounded-xl text-sm">
              <option value="">Tous les statuts</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
            <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm"><SlidersHorizontal size={15} /> Réinitialiser</button>
          </div>
          <div className="flex border rounded-xl overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white"}`}><LayoutGrid size={17} /></button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white"}`}><List size={17} /></button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">Aucun utilisateur trouvé.</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{initials(user.nomComplet)}</div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{user.nomComplet}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.isActive ? "Actif" : "Inactif"}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs">{roles.find(r => r.id === user.roleId)?.nom || "—"}</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">{societes.find(s => s.id === user.societeId)?.nom || "—"}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Créé le : {user.dateCreation || "—"}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(user); setForm({ nomComplet: user.nomComplet, email: user.email, societeId: user.societeId.toString(), roleId: user.roleId.toString(), password: "", confirmPassword: "", isActive: user.isActive }); setModalOpen(true); }} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1"><Edit size={14} /> Modifier</button>
                <button onClick={() => handleToggle(user)} className={`flex-1 py-2 rounded-lg text-sm ${user.isActive ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{user.isActive ? "Suspendre" : "Activer"}</button>
                <button onClick={() => handleDelete(user.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
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
                <tr key={user.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">{initials(user.nomComplet)}</div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{user.nomComplet}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs">{roles.find(r => r.id === user.roleId)?.nom || "—"}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{societes.find(s => s.id === user.societeId)?.nom || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.dateCreation || "—"}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.isActive ? "Actif" : "Inactif"}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditing(user); setForm({ nomComplet: user.nomComplet, email: user.email, societeId: user.societeId.toString(), roleId: user.roleId.toString(), password: "", confirmPassword: "", isActive: user.isActive }); setModalOpen(true); }} className="p-2 bg-blue-50 rounded-lg text-blue-600"><Edit size={15} /></button>
                      <button onClick={() => handleToggle(user)} className={`p-2 rounded-lg ${user.isActive ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{user.isActive ? <Lock size={15} /> : <Unlock size={15} />}</button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 bg-red-50 rounded-lg text-red-500"><Trash2 size={15} /></button>
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
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/15 rounded-lg"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Nom complet *</label>
                  <div className="relative mt-1"><Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={form.nomComplet} onChange={e => setForm({...form, nomComplet: e.target.value})} type="text" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email *</label>
                  <div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Rôle *</label>
                  <div className="relative mt-1"><Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})} className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm appearance-none"><option value="">Sélectionner</option>{roles.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Société *</label>
                  <div className="relative mt-1"><Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select value={form.societeId} onChange={e => setForm({...form, societeId: e.target.value})} className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm appearance-none"><option value="">Sélectionner</option>{societes.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">{editing ? "Mot de passe (optionnel)" : "Mot de passe *"}</label>
                  <div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type={showPwd ? "text" : "password"} className="w-full pl-9 pr-10 py-2 border rounded-lg text-sm" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
                  <div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} type={showPwd ? "text" : "password"} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
                </div>
              </div>
              {editing && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <div className="flex gap-4 mt-1 p-3 border rounded-lg bg-slate-50">
                    <label className="flex items-center gap-2"><input type="radio" checked={form.isActive === true} onChange={() => setForm({...form, isActive: true})} className="w-4 h-4" /> Actif</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={form.isActive === false} onChange={() => setForm({...form, isActive: false})} className="w-4 h-4" /> Inactif</label>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2 border rounded-lg text-sm">Annuler</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                  {loading ? "Chargement…" : <><CheckCircle size={15} /> {editing ? "Enregistrer" : "Créer"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
