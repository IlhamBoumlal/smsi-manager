import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Building2, X, CheckCircle } from 'lucide-react';
import axios from 'axios';

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const API_BASE = 'http://localhost:5006';

export default function GestionHoldings() {
  const [holdings, setHoldings] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNom, setFormNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  // Fonction pour récupérer les headers avec le token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchLoading(true);
    setError("");
    try {
      const config = getAuthConfig();
      
      const [holdingsRes, societesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/holding`, config),
        axios.get(`${API_BASE}/api/societe`, config)
      ]);

      setHoldings(holdingsRes.data || []);
      setSocietes(societesRes.data || []);
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
        setError(error.response?.data?.message || "Impossible de charger les données.");
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const getSocCount = (id) => societes.filter(s => s.holdingId === id).length;

  const filtered = holdings.filter(h =>
    h.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: holdings.length,
    societesCount: societes.length,
    avgSocietes: holdings.length > 0 ? Math.round(societes.length / holdings.length) : 0,
    activeHoldings: holdings.filter(h => getSocCount(h.id) > 0).length,
  };

  const handleSave = async () => {
    if (!formNom.trim()) {
      alert("Le nom de la holding est requis.");
      return;
    }

    setLoading(true);

    try {
      const config = getAuthConfig();
      
      if (editing) {
        await axios.put(`${API_BASE}/api/holding/${editing.id}`, {
          nom: formNom
        }, config);
      } else {
        await axios.post(`${API_BASE}/api/holding`, {
          nom: formNom
        }, config);
      }

      await fetchData();

      setModalOpen(false);
      setEditing(null);
      setFormNom("");
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
      alert(error.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, cnt) => {
    if (cnt > 0) {
      alert(`Impossible de supprimer : ${cnt} société(s) rattachée(s) à cette holding.`);
      return;
    }

    if (!window.confirm("Supprimer cette holding ?")) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/api/holding/${id}`, config);
      await fetchData();
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert(error.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const kpis = [
    { label: 'Total holdings', value: stats.total, sub: `${stats.total} holding(s)`, primary: true },
    { label: 'Sociétés', value: stats.societesCount, sub: 'réparties dans les holdings' },
    { label: 'Moyenne sociétés', value: stats.avgSocietes, sub: 'par holding' },
    { label: 'Holdings actives', value: stats.activeHoldings, sub: 'avec au moins 1 société' },
  ];

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Chargement des holdings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
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
    <div className="p-6 max-w-[1280px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des holdings</h1>
          <p className="text-sm text-slate-500">Administration des groupes et de leurs sociétés</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setFormNom(""); setModalOpen(true); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Nouvelle holding
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
            placeholder="Rechercher une holding..." 
            className="w-full h-12 pl-11 pr-4 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setSearch("")} 
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-slate-50 transition"
          >
            <SlidersHorizontal size={15} />
            Réinitialiser
          </button>
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
          <p className="text-slate-500">Aucune holding trouvée.</p>
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
          {filtered.map(h => {
            const cnt = getSocCount(h.id);
            return (
              <div key={h.id} className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold">
                    {initials(h.nom)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{h.nom}</div>
                    <div className="text-xs text-slate-400">HLD-{String(h.id).padStart(3, "0")}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {cnt} société(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditing(h); setFormNom(h.nom); setModalOpen(true); }} 
                    className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition"
                  >
                    <Edit size={14} />
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(h.id, cnt)} 
                    className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr className="text-xs font-bold text-slate-500">
                <th className="px-6 py-4 text-left">Holding</th>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Sociétés</th>
                <th className="px-6 py-4 text-center">Actions</th>
               </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const cnt = getSocCount(h.id);
                return (
                  <tr key={h.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-bold">
                          {initials(h.nom)}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{h.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      HLD-{String(h.id).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {cnt} société(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => { setEditing(h); setFormNom(h.nom); setModalOpen(true); }} 
                          className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(h.id, cnt)} 
                          className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition"
                        >
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
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
              <h3 className="font-bold text-white">{editing ? "Modifier la holding" : "Nouvelle holding"}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-lg transition"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="p-6">
              <label className="text-sm font-medium text-slate-700">Nom de la holding</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input 
                  value={formNom} 
                  onChange={e => setFormNom(e.target.value)} 
                  type="text" 
                  placeholder="Nom de la holding" 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading || !formNom.trim()} 
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}