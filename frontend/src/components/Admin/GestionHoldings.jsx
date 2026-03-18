import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, CheckCircle, Building2 } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api';

// Composant GestionHoldings : Interface d'administration pour gérer les holdings
// Permet d'ajouter, modifier, supprimer et rechercher des holdings

export default function GestionHoldings() {
  const [holdings, setHoldings] = useState([]);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [nom,      setNom]      = useState('');

  useEffect(() => { fetchHoldings(); }, []);

  const fetchHoldings = async () => { const r = await axios.get(`${API}/holding`); setHoldings(r.data); };

  const openNew  = () => { setEditing(null); setNom(''); setModal(true); };
  const openEdit = (h) => { setEditing(h); setNom(h.nom); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setNom(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) await axios.put(`${API}/holding/${editing.id}`, { nom });
      else         await axios.post(`${API}/holding`, { nom });
      await fetchHoldings(); closeModal();
    } catch (err) { alert(`Erreur: ${err.response?.data || "Une erreur est survenue"}`); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette holding ?")) return;
    try { await axios.delete(`${API}/holding/${id}`); await fetchHoldings(); }
    catch (e) { alert(`Erreur: ${e.response?.data}`); }
  };

  const filtered = holdings.filter(h => h.nom?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des holdings</h1>
          <p className="text-sm text-slate-400 mt-1">{holdings.length} holding{holdings.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-lg w-64 text-sm focus:outline-none focus:border-blue-300"/>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
            <Plus size={15}/> Ajouter une holding
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Nom de la holding</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(h => (
              <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-400 font-mono">HLD-{String(h.id).padStart(3,'0')}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16}/>
                    </div>
                    <span className="font-semibold text-slate-800">{h.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(h)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Edit size={15}/></button>
                    <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">Aucune holding trouvée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-base font-bold text-slate-900">{editing ? "Modifier la holding" : "Nouvelle holding"}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg"><X size={16}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nom de la holding</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
                  <input required value={nom} onChange={e => setNom(e.target.value)} type="text" placeholder="Nom de la holding" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400"/>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-blue-800 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  {loading ? "Chargement…" : <><CheckCircle size={15}/> {editing ? "Enregistrer" : "Créer"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}