// components/GestionHoldings.jsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutGrid, List, Building2, X, CheckCircle } from 'lucide-react';

const MOCK_HOLDINGS = [
  { id: 1, nom: "Groupe Nexalys" },
  { id: 2, nom: "AlphaCorp Holdings" },
  { id: 3, nom: "TechVentures SA" },
];

const MOCK_SOCIETES = [
  { id: 1, nom: "Nexalys Solutions", holdingId: 1 },
  { id: 2, nom: "Nexalys Consulting", holdingId: 1 },
  { id: 3, nom: "AlphaCloud", holdingId: 2 },
  { id: 4, nom: "DataSecure Inc.", holdingId: 3 },
  { id: 5, nom: "Nexalys Digital", holdingId: 1 },
];

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";

export default function GestionHoldings() {
  const [holdings, setHoldings] = useState(MOCK_HOLDINGS);
  const [societes] = useState(MOCK_SOCIETES);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNom, setFormNom] = useState("");
  const [loading, setLoading] = useState(false);

  const getSocCount = (id) => societes.filter(s => s.holdingId === id).length;
  const filtered = holdings.filter(h => h.nom.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: holdings.length,
    societesCount: societes.length,
    avgSocietes: holdings.length > 0 ? Math.round(societes.length / holdings.length) : 0,
    activeHoldings: holdings.filter(h => getSocCount(h.id) > 0).length,
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      if (editing) {
        setHoldings(holdings.map(h => h.id === editing.id ? { ...h, nom: formNom } : h));
      } else {
        setHoldings([...holdings, { id: Date.now(), nom: formNom }]);
      }
      setModalOpen(false);
      setEditing(null);
      setFormNom("");
      setLoading(false);
    }, 300);
  };

  const handleDelete = (id, cnt) => {
    if (cnt > 0) {
      alert(`Impossible de supprimer : ${cnt} société(s) rattachée(s).`);
      return;
    }
    if (window.confirm("Supprimer cette holding ?")) {
      setHoldings(holdings.filter(h => h.id !== id));
    }
  };

  const initials = (name) => name?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const kpis = [
    { label: 'Total holdings', value: stats.total, sub: `${stats.total} holding(s)`, primary: true },
    { label: 'Sociétés', value: stats.societesCount, sub: 'réparties dans les holdings' },
    { label: 'Moyenne sociétés', value: stats.avgSocietes, sub: 'par holding' },
    { label: 'Holdings actives', value: stats.activeHoldings, sub: 'avec au moins 1 société' },
  ];

  return (
    <div className="p-6 max-w-[1280px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des holdings</h1>
          <p className="text-sm text-slate-500">Administration des groupes et de leurs sociétés</p>
        </div>
        <button onClick={() => { setEditing(null); setFormNom(""); setModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus size={18} /> Nouvelle holding
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une holding..." className="w-full h-12 pl-11 pr-4 rounded-xl border bg-slate-50 text-sm" />
        </div>
        <div className="flex justify-between items-center">
          <button onClick={() => setSearch("")} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm"><SlidersHorizontal size={15} /> Réinitialiser</button>
          <div className="flex border rounded-xl overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-2 ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white"}`}><LayoutGrid size={17} /></button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white"}`}><List size={17} /></button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">Aucune holding trouvée.</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(h => {
            const cnt = getSocCount(h.id);
            return (
              <div key={h.id} className="bg-white rounded-2xl border p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold">{initials(h.nom)}</div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{h.nom}</div>
                    <div className="text-xs text-slate-400">HLD-{String(h.id).padStart(3, "0")}</div>
                  </div>
                </div>
                <div className="mb-3"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{cnt} société(s)</span></div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(h); setFormNom(h.nom); setModalOpen(true); }} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1"><Edit size={14} /> Modifier</button>
                  <button onClick={() => handleDelete(h.id, cnt)} className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-center gap-1"><Trash2 size={14} /> Supprimer</button>
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
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-bold">{initials(h.nom)}</div>
                        <span className="font-semibold text-slate-800 text-sm">{h.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">HLD-{String(h.id).padStart(3, "0")}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{cnt} société(s)</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditing(h); setFormNom(h.nom); setModalOpen(true); }} className="p-2 bg-blue-50 rounded-lg text-blue-600"><Edit size={15} /></button>
                        <button onClick={() => handleDelete(h.id, cnt)} className="p-2 bg-red-50 rounded-lg text-red-500"><Trash2 size={15} /></button>
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
          <div className="bg-white w-full max-w-md rounded-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
              <h3 className="font-bold text-white">{editing ? "Modifier la holding" : "Nouvelle holding"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/15 rounded-lg"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-6">
              <label className="text-sm font-medium text-slate-700">Nom de la holding</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input value={formNom} onChange={e => setFormNom(e.target.value)} type="text" placeholder="Nom de la holding" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Annuler</button>
                <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
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