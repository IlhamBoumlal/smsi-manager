import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Search, Edit, Trash2, Shield, Mail, Lock,
  Eye, EyeOff, X, CheckCircle, ChevronDown, Factory,
  LayoutGrid, List, SlidersHorizontal,
} from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api';

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// ── KPI Strip modifié ──
function KpiStrip({ stats }) {
  const kpis = [
    {
      label: 'Total utilisateurs',
      value: stats.total,
      sub: `${stats.total} utilisateur${stats.total > 1 ? 's' : ''} enregistré${stats.total > 1 ? 's' : ''}`,
      bg: T.gradBlue,
      light: false,
    },
    {
      label: 'Actifs',
      value: stats.actifs,
      sub: `${Math.round((stats.actifs / (stats.total || 1)) * 100)}% du total`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Inactifs',
      value: stats.inactifs,
      sub: `${Math.round((stats.inactifs / (stats.total || 1)) * 100)}% du total`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Administrateurs',
      value: stats.adminCount,
      sub: `${stats.adminCount} avec droits admin`,
      bg: '#fff',
      light: true,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <div
          key={i}
          style={{
            background: k.bg,
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: k.light
              ? '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)'
              : '0 8px 24px rgba(29,78,216,.35)',
            animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1,
              color: k.light ? '#111827' : '#fff',
              fontFamily: "'Sora', sans-serif",
              letterSpacing: '-1.5px',
            }}
          >
            {k.value}
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: k.light ? '#374151' : 'rgba(255,255,255,.9)',
              marginTop: 6,
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: k.light ? '#9CA3AF' : 'rgba(255,255,255,.6)',
              marginTop: 2,
            }}
          >
            {k.sub}
          </div>
          {!k.light && (
            <div
              style={{
                marginTop: 12,
                height: 4,
                borderRadius: 99,
                background: 'rgba(255,255,255,.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (stats.actifs / (stats.total || 1)) * 100)}%`,
                  background: 'rgba(255,255,255,.8)',
                  borderRadius: 99,
                  transition: 'width 1.2s cubic-bezier(.4,0,.2,1) .3s',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Dropdown filter ────────────────────────────────────────────────────────
function DropdownFilter({ label, value, onChange, options }) {
  return (
    <label className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-slate-300 bg-white pl-4 pr-9 text-xs font-semibold text-slate-700 focus:border-blue-300 focus:outline-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

// ── Field helper for modal ─────────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="mb-2 block text-xs font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    nomComplet: '', email: '', societeId: '', roleId: '',
    password: '', confirmPassword: '', isActive: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; }
    else { fetchAll(); }
  }, []);

  const fetchAll = async () => {
    setFetchLoading(true);
    try {
      const headers = getAuthHeaders();
      const [u, s, r] = await Promise.all([
        axios.get(`${API}/user`, headers),
        axios.get(`${API}/societe`, headers),
        axios.get(`${API}/user/roles`, headers),
      ]);
      const societesMap = {};
      s.data.forEach((soc) => { societesMap[soc.id] = soc.nom; });
      const rolesMap = {};
      r.data.forEach((role) => { rolesMap[role.id] = role.nom; });
      const enriched = u.data.map((user) => ({
        ...user,
        societe: societesMap[user.societeId] || user.societe || '—',
        role: rolesMap[user.roleId] || user.role || '—',
      }));
      setUsers(enriched);
      setSocietes(s.data);
      setRoles(r.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expirée, veuillez vous reconnecter');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const stats = useMemo(() => {
    const adminRole = roles.find(r => r.nom === 'Admin' || r.nom === 'Administrateur');
    const adminRoleId = adminRole?.id;
    return {
      total: users.length,
      actifs: users.filter((u) => u.isActive).length,
      inactifs: users.filter((u) => !u.isActive).length,
      adminCount: adminRoleId ? users.filter((u) => u.roleId === adminRoleId).length : 0,
    };
  }, [users, roles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.nomComplet?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || String(u.isActive) === statusFilter;
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const reset = () => {
    setForm({ nomComplet: '', email: '', societeId: '', roleId: '', password: '', confirmPassword: '', isActive: true });
    setEditing(null);
    setShowPwd(false);
  };
  const closeModal = () => { setModal(false); reset(); };
  const openNew = () => { reset(); setModal(true); };

  const openEdit = (user) => {
    const s = societes.find((x) => x.nom === user.societe);
    const r = roles.find((x) => x.nom === user.role);
    setEditing(user);
    setForm({
      nomComplet: user.nomComplet,
      email: user.email,
      societeId: s?.id?.toString() || '',
      roleId: r?.id?.toString() || '',
      password: '',
      confirmPassword: '',
      isActive: user.isActive,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert('Mots de passe différents !');
      return;
    }
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (editing) {
        await axios.put(
          `${API}/user/${editing.id}`,
          { nomComplet: form.nomComplet, email: form.email, societeId: parseInt(form.societeId), roleId: form.roleId, password: form.password || null, confirmPassword: form.confirmPassword || null, isActive: form.isActive },
          headers,
        );
      } else {
        if (!form.password) { alert('Mot de passe requis !'); setLoading(false); return; }
        await axios.post(
          `${API}/user`,
          { nomComplet: form.nomComplet, email: form.email, password: form.password, confirmPassword: form.confirmPassword, societeId: parseInt(form.societeId), roleId: form.roleId },
          headers,
        );
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      const msg = typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.response?.data;
      alert(`Erreur: ${msg || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`${API}/user/${id}`, getAuthHeaders());
      await fetchAll();
    } catch (e) {
      alert(`Erreur: ${e.response?.data}`);
    }
  };

  const resetFilters = () => { setSearch(''); setStatusFilter(''); setRoleFilter(''); };

  const roleOptions = [...new Set(users.map((u) => u.role).filter((r) => r && r !== '—'))].map((r) => [r, r]);

  const initials = (name) => name?.split(' ').map((n) => n[0]).join('').substring(0, 2) || '?';

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-4 py-5 sm:px-6" style={{ fontFamily: T.font }}>
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
              Gestion des utilisateurs
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Administration des comptes et des accès utilisateurs.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95"
            style={{ background: T.gradBlue }}
          >
            <Plus size={18} className="mr-2" /> Nouvel utilisateur
          </button>
        </section>

        {/* ── KPI Strip ── */}
        <KpiStrip stats={stats} />

        {/* ── Filters ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownFilter
                label="Tous les statuts"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[['true', 'Actif'], ['false', 'Inactif']]}
              />
              <DropdownFilter
                label="Tous les rôles"
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
              />
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <SlidersHorizontal size={15} /> Réinitialiser
              </button>
            </div>
            <div className="inline-flex h-10 overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex w-10 items-center justify-center ${viewMode === 'grid' ? 'bg-[#2f62de] text-white' : 'text-slate-600'}`}
                title="Vue grille"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex w-10 items-center justify-center ${viewMode === 'table' ? 'bg-[#2f62de] text-white' : 'text-slate-600'}`}
                title="Vue liste"
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <section className="mt-5">
          {fetchLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">
              Aucun utilisateur trouvé.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {initials(user.nomComplet)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{user.nomComplet}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${user.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                      {user.role}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {user.societe}
                    </span>
                  </div>
                  <p className="mb-3 text-[11px] text-slate-400">Créé le : <span className="font-semibold text-slate-600">{user.dateCreation || '—'}</span></p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Edit size={14} /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Utilisateur</th>
                      <th className="px-6 py-4">Rôle</th>
                      <th className="px-6 py-4">Société</th>
                      <th className="px-6 py-4">Date création</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((user, i) => (
                      <tr key={user.id} className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {initials(user.nomComplet)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{user.nomComplet}</div>
                              <div className="text-[11px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                            <Shield size={10} /> {user.role || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{user.societe || '—'}</td>
                        <td className="px-6 py-4 text-xs text-slate-600">{user.dateCreation || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => openEdit(user)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Modifier">
                              <Edit size={15} />
                            </button>
                            <button type="button" onClick={() => handleDelete(user.id)} className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100" title="Supprimer">
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
        </section>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div
              className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-700/20 px-6 py-5 text-white rounded-t-2xl"
              style={{ background: T.gradBlue }}
            >
              <h2 className="text-base font-bold">
                {editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 transition hover:bg-white/15">
                <X size={20} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nom complet *" icon={<Users size={15} />}>
                  <input
                    required
                    value={form.nomComplet}
                    onChange={(e) => setForm({ ...form, nomComplet: e.target.value })}
                    type="text"
                    placeholder="Jean Dupont"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs focus:border-blue-300 focus:outline-none"
                  />
                </Field>
                <Field label="Email *" icon={<Mail size={15} />}>
                  <input
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    type="email"
                    placeholder="jean@example.com"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs focus:border-blue-300 focus:outline-none"
                  />
                </Field>
                <Field label="Rôle *" icon={<Shield size={15} />}>
                  <select
                    required
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs focus:border-blue-300 focus:outline-none"
                  >
                    <option value="">Sélectionner un rôle</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </Field>
                <Field label="Société *" icon={<Factory size={15} />}>
                  <select
                    required
                    value={form.societeId}
                    onChange={(e) => setForm({ ...form, societeId: e.target.value })}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs focus:border-blue-300 focus:outline-none"
                  >
                    <option value="">Sélectionner une société</option>
                    {societes.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </Field>
                <Field label={editing ? 'Mot de passe (optionnel)' : 'Mot de passe *'} icon={<Lock size={15} />}>
                  <input
                    required={!editing}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-10 text-xs focus:border-blue-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </Field>
                <Field label="Confirmer le mot de passe" icon={<Lock size={15} />}>
                  <input
                    required={!editing}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs focus:border-blue-300 focus:outline-none"
                  />
                </Field>
                {editing && (
                  <div className="col-span-2">
                    <label className="mb-2 block text-xs font-medium text-slate-700">Statut</label>
                    <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {[{ val: true, label: 'Actif', color: 'green' }, { val: false, label: 'Inactif', color: 'red' }].map((opt) => (
                        <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={form.isActive === opt.val}
                            onChange={() => setForm({ ...form, isActive: opt.val })}
                            className="w-4 h-4"
                          />
                          <span className={`text-xs font-semibold text-${opt.color}-700 flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 rounded-full bg-${opt.color}-500`} />
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.societeId || !form.roleId}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  style={{ background: T.gradBlue }}
                >
                  {loading ? 'Chargement...' : <><CheckCircle size={15} /> {editing ? 'Enregistrer' : 'Créer'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}