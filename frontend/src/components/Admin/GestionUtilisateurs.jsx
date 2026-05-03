import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Shield, Mail, Lock, Eye, EyeOff, X, CheckCircle, ChevronDown, Factory } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const API = '/api';
const normalizeRole = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    nomComplet: '',
    email: '',
    societeId: '',
    roleId: '',
    password: '',
    confirmPassword: '',
    isActive: true,
  });
  const selectedRole = roles.find((r) => String(r.id) === String(form.roleId));
  const isSuperAdminRole = normalizeRole(selectedRole?.nom) === 'super admin';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [u, s, r] = await Promise.all([
        axiosInstance.get(`${API}/user`),
        axiosInstance.get(`${API}/societe`),
        axiosInstance.get(`${API}/user/roles`),
      ]);

      const societesMap = {};
      s.data.forEach((soc) => { societesMap[soc.id] = soc.nom; });

      const rolesMap = {};
      r.data.forEach((role) => { rolesMap[role.id] = role.nom; });

      const enrichedUsers = u.data.map((user) => {
        const roleNom = typeof user.role === 'string' ? user.role : user.role?.nom;
        const societeNom = typeof user.societe === 'string' ? user.societe : user.societe?.nom;
        const roleId = user.roleId ?? user.role?.id ?? null;
        const societeId = user.societeId ?? user.societe?.id ?? null;

        return {
          ...user,
          roleId,
          societeId,
          role: rolesMap[roleId] || roleNom || '-',
          societe: societesMap[societeId] || societeNom || '-',
        };
      });

      setUsers(enrichedUsers);
      setSocietes(s.data);
      setRoles(r.data);
    } catch (error) {
      console.error('Erreur fetchAll:', error);
      if (error.response?.status === 401) {
        alert('Session expiree, veuillez vous reconnecter');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const reset = () => {
    setForm({ nomComplet: '', email: '', societeId: '', roleId: '', password: '', confirmPassword: '', isActive: true });
    setEditing(null);
    setShowPwd(false);
  };

  const closeModal = () => {
    setModal(false);
    reset();
  };

  const openNew = () => {
    reset();
    setModal(true);
  };

  const openEdit = (user) => {
    const societeFromName = societes.find((x) => x.nom === user.societe);
    const roleFromName = roles.find((x) => x.nom === user.role);

    setEditing(user);
    setForm({
      nomComplet: user.nomComplet,
      email: user.email,
      societeId: (user.societeId ?? societeFromName?.id)?.toString() || '',
      roleId: (user.roleId ?? roleFromName?.id)?.toString() || '',
      password: '',
      confirmPassword: '',
      isActive: user.isActive,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert('Mots de passe differents !');
      return;
    }

    const societeIdValue = form.societeId ? parseInt(form.societeId, 10) : null;
    if (!isSuperAdminRole && !societeIdValue) {
      alert('Une societe est obligatoire pour ce role.');
      return;
    }

    const payloadSocieteId = isSuperAdminRole ? null : societeIdValue;

    setLoading(true);
    try {
      if (editing) {
        await axiosInstance.put(`${API}/user/${editing.id}`, {
          nomComplet: form.nomComplet,
          email: form.email,
          societeId: payloadSocieteId,
          roleId: form.roleId,
          password: form.password || null,
          confirmPassword: form.confirmPassword || null,
          isActive: form.isActive,
        });
      } else {
        if (!form.password) {
          alert('Mot de passe requis !');
          setLoading(false);
          return;
        }

        await axiosInstance.post(`${API}/user`, {
          nomComplet: form.nomComplet,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          societeId: payloadSocieteId,
          roleId: form.roleId,
        });
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
      await axiosInstance.delete(`${API}/user/${id}`);
      await fetchAll();
    } catch (e) {
      alert(`Erreur: ${e.response?.data || ''}`);
    }
  };

  const filtered = users.filter((u) =>
    u.nomComplet?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''} enregistre{users.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-lg w-64 text-sm focus:outline-none focus:border-blue-300"
            />
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
            <Plus size={15} /> Ajouter un utilisateur
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Date creation</th>
              <th className="px-6 py-4">Societe</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {user.nomComplet?.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{user.nomComplet}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.role || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.dateCreation || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.societe || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(user)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">Aucun utilisateur trouve</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-base font-bold text-slate-900">{editing ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom complet" icon={<Users size={15} />}>
                  <input name="nomComplet" required value={form.nomComplet} onChange={(e) => setForm({ ...form, nomComplet: e.target.value })} type="text" placeholder="Jean Dupont" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400" />
                </Field>
                <Field label="Email" icon={<Mail size={15} />}>
                  <input name="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="jean@example.com" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400" />
                </Field>
                <Field label="Role" icon={<Shield size={15} />}>
                  <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none text-sm appearance-none bg-white focus:border-blue-400">
                    <option value="">Selectionner un role</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </Field>
                <Field label={isSuperAdminRole ? 'Societe (optionnelle)' : 'Societe'} icon={<Factory size={15} />}>
                  <select value={form.societeId} onChange={(e) => setForm({ ...form, societeId: e.target.value })} className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none text-sm appearance-none bg-white focus:border-blue-400">
                    <option value="">Selectionner une societe</option>
                    {societes.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </Field>
                <Field label={editing ? 'Mot de passe (optionnel)' : 'Mot de passe'} icon={<Lock size={15} />}>
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} type={showPwd ? 'text' : 'password'} placeholder="********" className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </Field>
                <Field label="Confirmer le mot de passe" icon={<Lock size={15} />}>
                  <input value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required={!editing} type={showPwd ? 'text' : 'password'} placeholder="********" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400" />
                </Field>
                {editing && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-700 block mb-2">Statut</label>
                    <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {[{ val: true, label: 'Actif', color: 'green' }, { val: false, label: 'Inactif', color: 'red' }].map((opt) => (
                        <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={form.isActive === opt.val} onChange={() => setForm({ ...form, isActive: opt.val })} className="w-4 h-4" />
                          <span className={`text-sm font-medium text-${opt.color}-700 flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 rounded-full bg-${opt.color}-500`}></span>{opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={loading || !form.roleId || (!isSuperAdminRole && !form.societeId)} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-blue-800 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  {loading ? 'Chargement...' : <><CheckCircle size={15} /> {editing ? 'Enregistrer' : 'Creer'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>{children}</div>
    </div>
  );
}
