import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, CheckCircle, ChevronDown, Building2, Upload, Factory } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { resolveAssetUrl } from '../../api/url';

const API = '/api';

export default function GestionSocietes() {
  const [societes, setSocietes] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [form, setForm] = useState({ nom: '', holdingId: '' });

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
      const [s, h] = await Promise.all([
        axiosInstance.get(`${API}/societe`),
        axiosInstance.get(`${API}/holding`),
      ]);
      setSocietes(s.data);
      setHoldings(h.data);
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
    setForm({ nom: '', holdingId: '' });
    setEditing(null);
    setLogoPreview(null);
    setLogoFile(null);
  };

  const closeModal = () => {
    setModal(false);
    reset();
  };

  const openNew = () => {
    reset();
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ nom: s.nom, holdingId: s.holdingId?.toString() || '' });
    setLogoPreview(null);
    setLogoFile(null);
    setModal(true);
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('nom', form.nom);
      fd.append('holdingId', form.holdingId || '');
      if (logoFile) fd.append('logo', logoFile);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        await axiosInstance.put(`${API}/societe/${editing.id}`, fd, config);
      } else {
        await axiosInstance.post(`${API}/societe`, fd, config);
      }

      await fetchAll();
      closeModal();
    } catch (err) {
      alert(`Erreur: ${err.response?.data || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette societe ?')) return;

    try {
      await axiosInstance.delete(`${API}/societe/${id}`);
      await fetchAll();
    } catch (e) {
      alert(`Erreur: ${e.response?.data || ''}`);
    }
  };

  const getLogo = (societe) => {
    if (societe.logo) {
      return (
        <img
          src={resolveAssetUrl(societe.logo)}
          alt="Logo"
          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
        />
      );
    }

    const init = societe.nom?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    return <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg flex items-center justify-center font-bold text-xs">{init}</div>;
  };

  const filtered = societes.filter((s) => s.nom?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des societes</h1>
          <p className="text-sm text-slate-400 mt-1">{societes.length} societe{societes.length > 1 ? 's' : ''}</p>
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
            <Plus size={15} /> Ajouter une societe
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Logo</th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Holding</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">{getLogo(s)}</td>
                <td className="px-6 py-4 text-sm text-slate-400 font-mono">SOC-{String(s.id).padStart(3, '0')}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{s.nom}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{holdings.find((h) => h.id === s.holdingId)?.nom || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Aucune societe trouvee</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-base font-bold text-slate-900">{editing ? 'Modifier la societe' : 'Nouvelle societe'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nom de la societe</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    type="text"
                    placeholder="Nom de la societe"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Holding (optionnel)</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select value={form.holdingId} onChange={(e) => setForm({ ...form, holdingId: e.target.value })} className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none text-sm appearance-none bg-white focus:border-blue-400">
                    <option value="">Aucune holding</option>
                    {holdings.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Logo {editing && <span className="text-slate-400 font-normal text-xs">(laisser vide pour conserver l'actuel)</span>}</label>
                <div className="flex items-center gap-4">
                  {editing?.logo && !logoPreview && <img src={resolveAssetUrl(editing.logo)} alt="actuel" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogo} className="hidden" id="logo-up" />
                    <label htmlFor="logo-up" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 cursor-pointer text-sm text-slate-500 transition-colors">
                      <Upload size={16} /> Choisir un logo
                    </label>
                  </div>
                  {logoPreview && (
                    <div className="relative">
                      <img src={logoPreview} alt="nouveau" className="w-12 h-12 rounded-lg object-cover border-2 border-blue-400" />
                      <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null); }} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full"><X size={11} /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-blue-800 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
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
