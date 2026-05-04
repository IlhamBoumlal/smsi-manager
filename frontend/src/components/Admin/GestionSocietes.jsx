import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Building2, Factory, Upload, X, CheckCircle, ChevronDown } from 'lucide-react';
import axios from 'axios';

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const API_BASE = 'http://localhost:5006';

export default function GestionSocietes() {
  const [societes, setSocietes] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [formNom, setFormNom] = useState("");
  const [formHoldingId, setFormHoldingId] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

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
      
      const [societesRes, holdingsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/societe`, config),
        axios.get(`${API_BASE}/api/holding`, config)
      ]);

      setSocietes(societesRes.data || []);
      setHoldings(holdingsRes.data || []);
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

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_BASE}/api/upload/logo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.url;
    } catch (error) {
      console.error("Erreur upload logo:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!formNom.trim()) {
      alert("Le nom de la société est requis.");
      return;
    }

    setLoading(true);

    try {
      const config = getAuthConfig();
      let logoUrl = null;
      
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      if (editing) {
        await axios.put(`${API_BASE}/api/societe/${editing.id}`, {
          nom: formNom,
          holdingId: formHoldingId ? Number(formHoldingId) : null,
          logo: logoUrl || editing.logo
        }, config);
      } else {
        await axios.post(`${API_BASE}/api/societe`, {
          nom: formNom,
          holdingId: formHoldingId ? Number(formHoldingId) : null,
          logo: logoUrl
        }, config);
      }

      await fetchData();

      setModalOpen(false);
      setEditing(null);
      setFormNom("");
      setFormHoldingId("");
      setLogoPreview(null);
      setLogoFile(null);
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
      alert(error.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette société ?")) return;

    try {
      const config = getAuthConfig();
      await axios.delete(`${API_BASE}/api/societe/${id}`, config);
      await fetchData();
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert(error.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  const getLogo = (s) => {
    if (s.logo) {
      const logoUrl = s.logo.startsWith('http') ? s.logo : `${API_BASE}${s.logo}`;
      return <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover border" />;
    }
    const init = s.nom?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    return <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg flex items-center justify-center font-bold text-xs">{init || "?"}</div>;
  };

  const getHoldingName = (holdingId) => {
    const holding = holdings.find(h => h.id === holdingId);
    return holding?.nom || "Sans holding";
  };

  const filtered = societes.filter(s =>
    s.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: societes.length,
    withLogo: societes.filter(s => s.logo).length,
    withoutLogo: societes.filter(s => !s.logo).length,
    holdingsCount: new Set(societes.map(s => s.holdingId).filter(Boolean)).size,
  };

  const kpis = [
    { label: 'Total sociétés', value: stats.total, sub: `${stats.total} société(s)`, primary: true },
    { label: 'Avec logo', value: stats.withLogo, sub: `${Math.round((stats.withLogo / (stats.total || 1)) * 100)}% du total` },
    { label: 'Sans logo', value: stats.withoutLogo, sub: `${Math.round((stats.withoutLogo / (stats.total || 1)) * 100)}% du total` },
    { label: 'Holdings', value: stats.holdingsCount, sub: `${stats.holdingsCount} holding(s) associée(s)` },
  ];

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Chargement des sociétés...</p>
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
          <h1 className="text-2xl font-bold text-slate-800">Gestion des sociétés</h1>
          <p className="text-sm text-slate-500">Administration des sociétés et de leurs logos</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setFormNom(""); setFormHoldingId(""); setLogoPreview(null); setLogoFile(null); setModalOpen(true); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Nouvelle société
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
            placeholder="Rechercher une société..." 
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
          <p className="text-slate-500">Aucune société trouvée.</p>
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
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-3">
                {getLogo(s)}
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{s.nom}</div>
                  <div className="text-xs text-slate-400">SOC-{String(s.id).padStart(3, "0")}</div>
                </div>
              </div>
              <div className="mb-3">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                  {getHoldingName(s.holdingId)}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditing(s); setFormNom(s.nom); setFormHoldingId(s.holdingId?.toString() || ""); setLogoPreview(null); setLogoFile(null); setModalOpen(true); }} 
                  className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button 
                  onClick={() => handleDelete(s.id)} 
                  className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-red-100 transition"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr className="text-xs font-bold text-slate-500">
                <th className="px-6 py-4 text-left">Logo</th>
                <th className="px-6 py-4 text-left">Société</th>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Holding</th>
                <th className="px-6 py-4 text-center">Actions</th>
               </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                  <td className="px-6 py-4">{getLogo(s)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{s.nom}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">SOC-{String(s.id).padStart(3, "0")}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{getHoldingName(s.holdingId)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { setEditing(s); setFormNom(s.nom); setFormHoldingId(s.holdingId?.toString() || ""); setLogoPreview(null); setLogoFile(null); setModalOpen(true); }} 
                        className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Edit size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)} 
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
              <h3 className="font-bold text-white">{editing ? "Modifier la société" : "Nouvelle société"}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-lg transition"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nom de la société</label>
                <div className="relative mt-1">
                  <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    value={formNom} 
                    onChange={e => setFormNom(e.target.value)} 
                    type="text" 
                    placeholder="Nom de la société" 
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Holding (optionnel)</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select 
                    value={formHoldingId} 
                    onChange={e => setFormHoldingId(e.target.value)} 
                    className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Aucune holding</option>
                    {holdings.map(h => (
                      <option key={h.id} value={h.id}>{h.nom}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Logo</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => { 
                        const file = e.target.files[0]; 
                        if(file) { 
                          setLogoFile(file);
                          const reader = new FileReader(); 
                          reader.onloadend = () => setLogoPreview(reader.result); 
                          reader.readAsDataURL(file); 
                        } 
                      }} 
                      className="hidden" 
                      id="logo-upload" 
                    />
                    <label 
                      htmlFor="logo-upload" 
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-dashed rounded-lg cursor-pointer text-sm hover:border-blue-400 transition"
                    >
                      <Upload size={16} /> Choisir un logo
                    </label>
                  </div>
                  {logoPreview && (
                    <img 
                      src={logoPreview} 
                      alt="nouveau" 
                      className="w-12 h-12 rounded-lg object-cover border-2 border-blue-400" 
                    />
                  )}
                  {editing?.logo && !logoPreview && (
                    <img 
                      src={editing.logo.startsWith('http') ? editing.logo : `${API_BASE}${editing.logo}`} 
                      alt="logo actuel" 
                      className="w-12 h-12 rounded-lg object-cover border" 
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
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