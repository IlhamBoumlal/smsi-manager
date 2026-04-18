import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, CheckCircle, ChevronDown, Building2, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api';

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
};

// Fonction pour obtenir les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// ── KPI Strip ──
function KpiStrip({ stats }) {
  const kpis = [
    {
      label: 'Total holdings',
      value: stats.total,
      sub: `${stats.total} holding${stats.total > 1 ? 's' : ''} enregistré${stats.total > 1 ? 's' : ''}`,
      bg: T.gradBlue,
      light: false,
    },
    {
      label: 'Sociétés',
      value: stats.societesCount,
      sub: `réparties dans les holdings`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Moyenne sociétés',
      value: stats.avgSocietes,
      sub: `par holding`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Holdings actives',
      value: stats.activeHoldings,
      sub: `avec au moins 1 société`,
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
                  width: `${Math.min(100, (stats.total / (stats.total || 1)) * 100)}%`,
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

export default function GestionHoldings() {
  const [holdings, setHoldings] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [form, setForm] = useState({ nom: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setFetchLoading(true);
    try {
      const headers = getAuthHeaders();
      const [h, s] = await Promise.all([
        axios.get(`${API}/holding`, headers),
        axios.get(`${API}/societe`, headers)
      ]);
      setHoldings(h.data);
      setSocietes(s.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
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
    const societesByHolding = {};
    societes.forEach(s => {
      if (s.holdingId) {
        societesByHolding[s.holdingId] = (societesByHolding[s.holdingId] || 0) + 1;
      }
    });
    const totalSocietes = societes.length;
    const activeHoldings = holdings.filter(h => societesByHolding[h.id] > 0).length;
    
    return {
      total: holdings.length,
      societesCount: totalSocietes,
      avgSocietes: holdings.length > 0 ? Math.round(totalSocietes / holdings.length) : 0,
      activeHoldings: activeHoldings,
    };
  }, [holdings, societes]);

  const getSocietesCount = (holdingId) => {
    return societes.filter(s => s.holdingId === holdingId).length;
  };

  const reset = () => {
    setForm({ nom: '' });
    setEditing(null);
  };

  const closeModal = () => {
    setModal(false);
    reset();
  };

  const openNew = () => {
    reset();
    setModal(true);
  };

  const openEdit = (holding) => {
    setEditing(holding);
    setForm({ nom: holding.nom });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      if (editing) {
        await axios.put(`${API}/holding/${editing.id}`, form, headers);
      } else {
        await axios.post(`${API}/holding`, form, headers);
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      alert(`Erreur: ${err.response?.data || "Une erreur est survenue"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const societesCount = getSocietesCount(id);
    if (societesCount > 0) {
      alert(`Impossible de supprimer cette holding car elle contient ${societesCount} société(s).`);
      return;
    }
    if (!window.confirm("Supprimer cette holding ?")) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API}/holding/${id}`, headers);
      await fetchAll();
    } catch (e) {
      alert(`Erreur: ${e.response?.data}`);
    }
  };

  const resetFilters = () => {
    setSearch('');
  };

  const filtered = holdings.filter(h => 
    h.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-4 py-5 sm:px-6" style={{ fontFamily: T.font }}>
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
              Gestion des holdings
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Administration des groupes et de leurs sociétés.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95"
            style={{ background: T.gradBlue }}
          >
            <Plus size={18} className="mr-2" /> Nouvelle holding
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
              placeholder="Rechercher une holding..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <SlidersHorizontal size={15} /> Réinitialiser
            </button>
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
              Aucune holding trouvée.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((holding) => {
                const societesCount = getSocietesCount(holding.id);
                return (
                  <div key={holding.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(holding.nom)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{holding.nom}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ID: HLD-{String(holding.id).padStart(3, '0')}</div>
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {societesCount} société{societesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(holding)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Edit size={14} /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(holding.id)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Holding</th>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Sociétés</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((holding, i) => {
                      const societesCount = getSocietesCount(holding.id);
                      return (
                        <tr key={holding.id} className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                                {initials(holding.nom)}
                              </div>
                              <span className="text-xs font-semibold text-slate-800">{holding.nom}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                            HLD-{String(holding.id).padStart(3, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {societesCount} société{societesCount > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => openEdit(holding)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Modifier">
                                <Edit size={15} />
                              </button>
                              <button type="button" onClick={() => handleDelete(holding.id)} className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100" title="Supprimer">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-2xl" style={{ background: T.gradBlue }}>
              <h3 className="text-base font-bold text-white">
                {editing ? "Modifier la holding" : "Nouvelle holding"}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/15 rounded-lg">
                <X size={16} className="text-white"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nom de la holding</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
                  <input 
                    required 
                    value={form.nom} 
                    onChange={e => setForm({...form, nom: e.target.value})} 
                    type="text" 
                    placeholder="Nom de la holding" 
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-blue-800 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Chargement…" : <><CheckCircle size={15}/> {editing ? "Enregistrer" : "Créer"}</>}
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