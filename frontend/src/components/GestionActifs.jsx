import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Lock, Layers,
  CheckCircle, LayoutGrid, List, ChevronDown, SlidersHorizontal, Download,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  bg: '#F8F9FB',
  white: '#ffffff',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  shadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
  gradGreen: 'linear-gradient(135deg, #059669, #10b981)',
  gradOrange: 'linear-gradient(135deg, #d97706, #f59e0b)',
  gradRed: 'linear-gradient(135deg, #dc2626, #ef4444)',
};

const TypeActif = { Support: 'Support', Primaire: 'Primaire' };

const CategorieActif = {
  Organisation: 'Organisation',
  Technique: 'Technique',
  Infrastructure: 'Infrastructure',
  InfrastructureCloud: 'Infrastructure Cloud',
  Application: 'Application',
  ServiceDeSecurite: 'Service de securite',
  SecuriteSupervision: 'Securite supervision',
  Reseau: 'Reseau',
  DevOps: 'DevOps',
  Securite: 'Securite',
  Applications: 'Applications',
  SICloud: 'SI Cloud',
  SecuritePhysique: 'Securite physique',
  EquipementInformatique: 'Equipement informatique',
};

const ClassificationActif = {
  NonClasse: 'Non classe',
  Confidentiel: 'Confidentiel',
  Secret: 'Secret',
  TopSecret: 'Top secret',
};

const ClassificationStyle = {
  NonClasse: { badge: 'bg-slate-100 text-slate-700 border border-slate-200' },
  Confidentiel: { badge: 'bg-blue-100 text-blue-800 border border-blue-200' },
  Secret: { badge: 'bg-amber-100 text-amber-800 border border-amber-200' },
  TopSecret: { badge: 'bg-red-100 text-red-800 border border-red-200' },
};

const TypeBadgeStyle = {
  Primaire: 'bg-violet-100 text-violet-800 border border-violet-200',
  Support: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const EMPTY_FORM = {
  nom: '',
  description: '',
  type: '',
  categorie: '',
  classification: 'NonClasse',
  proprietaireId: '',
};

const ZERO_GUID = '00000000-0000-0000-0000-000000000000';
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeClassificationKey = (value) => {
  const key = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (key.startsWith('nonclass')) return 'NonClasse';
  if (key === 'confidentiel') return 'Confidentiel';
  if (key === 'secret') return 'Secret';
  if (key === 'topsecret') return 'TopSecret';
  return 'NonClasse';
};

// ── KpiStrip avec les 4 statistiques demandées ──
function KpiStrip({ stats }) {
  const kpis = [
    { label: "Total actifs", value: stats.total, sub: `${stats.total} actifs inventoriés`, bg: T.gradBlue, light: false },
    { label: "Secret / Top Secret", value: stats.sensibles, sub: `${stats.secretCount || 0} Secret · ${stats.topSecretCount || 0} Top Secret`, bg: "#fff", light: true },
    { label: "Actifs Primaires", value: stats.primaires, sub: `${Math.round((stats.primaires / (stats.total || 1)) * 100)}% du total`, bg: "#fff", light: true },
    { label: "Actifs Support", value: stats.supports, sub: `${Math.round((stats.supports / (stats.total || 1)) * 100)}% du total`, bg: "#fff", light: true },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: k.bg, borderRadius: 14, padding: "20px 22px",
          boxShadow: k.light ? "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)" : "0 8px 24px rgba(29,78,216,.35)",
          animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: k.light ? "#111827" : "#fff", fontFamily: "'Sora', sans-serif", letterSpacing: "-1.5px" }}>{k.value}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: k.light ? "#374151" : "rgba(255,255,255,.9)", marginTop: 6 }}>{k.label}</div>
          <div style={{ fontSize: 11.5, color: k.light ? "#9CA3AF" : "rgba(255,255,255,.6)", marginTop: 2 }}>{k.sub}</div>
          {!k.light && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (stats.total / (stats.total || 1)) * 100)}%`, background: "rgba(255,255,255,.8)", borderRadius: 99, transition: "width 1.2s cubic-bezier(.4,0,.2,1) .3s" }} />
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

export default function GestionActifs() {
  const [actifs, setActifs] = useState([]);
  const [roles, setRoles] = useState([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setFetchLoading(true);
    try {
      const [actifsResult, profilsResult] = await Promise.allSettled([
        axiosInstance.get('/api/actifs'),
        axiosInstance.get('/api/profils'),
      ]);
      if (actifsResult.status === 'fulfilled') {
        setActifs(Array.isArray(actifsResult.value.data) ? actifsResult.value.data : []);
      }
      if (profilsResult.status === 'fulfilled') {
        setRoles(Array.isArray(profilsResult.value.data)
          ? profilsResult.value.data.map((p) => ({ id: p.id, nom: p.nom || p.name || 'Profil' }))
          : []);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  // Fonction d'export des actifs
  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Récupérer tous les actifs avec leurs informations complètes
      const response = await axiosInstance.get('/api/actifs');
      const actifsData = response.data;
      
      // Enrichir les données avec les noms des propriétaires
      const actifsEnriched = actifsData.map(actif => {
        const proprietaire = roles.find(r => r.id === actif.proprietaireId);
        return {
          id: actif.id,
          nom: actif.nom,
          description: actif.description || '',
          type: TypeActif[actif.type] || actif.type,
          categorie: CategorieActif[actif.categorie] || actif.categorie,
          classification: ClassificationActif[normalizeClassificationKey(actif.classification)] || actif.classification,
          proprietaireNom: proprietaire ? proprietaire.nom : 'Aucun',
          proprietaireId: actif.proprietaireId || '',
          dateCreation: actif.dateCreation ? new Date(actif.dateCreation).toLocaleDateString('fr-FR') : '',
          dateModification: actif.dateModification ? new Date(actif.dateModification).toLocaleDateString('fr-FR') : '',
        };
      });

      // Créer le fichier CSV
      const headers = ['ID', 'Nom', 'Description', 'Type', 'Catégorie', 'Classification', 'Propriétaire', 'Date Création', 'Date Modification'];
      const csvRows = [headers];
      
      for (const actif of actifsEnriched) {
        const row = [
          actif.id,
          `"${actif.nom.replace(/"/g, '""')}"`,
          `"${(actif.description || '').replace(/"/g, '""')}"`,
          actif.type,
          actif.categorie,
          actif.classification,
          actif.proprietaireNom,
          actif.dateCreation,
          actif.dateModification,
        ];
        csvRows.push(row.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `actifs_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      alert('Erreur lors de l\'export des actifs');
    } finally {
      setExportLoading(false);
    }
  };

  const stats = useMemo(() => {
    const secretCount = actifs.filter((a) => normalizeClassificationKey(a.classification) === 'Secret').length;
    const topSecretCount = actifs.filter((a) => normalizeClassificationKey(a.classification) === 'TopSecret').length;
    
    return {
      total: actifs.length,
      sensibles: secretCount + topSecretCount,
      secretCount,
      topSecretCount,
      primaires: actifs.filter((a) => a.type === 'Primaire').length,
      supports: actifs.filter((a) => a.type === 'Support').length,
    };
  }, [actifs]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return actifs.filter((a) => {
      const cls = normalizeClassificationKey(a.classification);
      const matchesSearch = !query ||
        String(a.nom || '').toLowerCase().includes(query) ||
        String(a.description || '').toLowerCase().includes(query);
      const matchesType = !typeFilter || a.type === typeFilter;
      const matchesCategorie = !categorieFilter || a.categorie === categorieFilter;
      const matchesClassification = !classificationFilter || cls === classificationFilter;
      return matchesSearch && matchesType && matchesCategorie && matchesClassification;
    });
  }, [actifs, search, typeFilter, categorieFilter, classificationFilter]);

  const reset = () => { setForm(EMPTY_FORM); setEditing(null); };
  const closeModal = () => { setModal(false); reset(); };

  const openNew = () => {
    reset();
    setForm((prev) => ({ ...prev, proprietaireId: roles[0]?.id || '' }));
    setModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      nom: a.nom,
      description: a.description,
      type: a.type,
      categorie: a.categorie,
      classification: normalizeClassificationKey(a.classification),
      proprietaireId: a.proprietaireId || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nom: form.nom,
        description: form.description,
        type: form.type,
        categorie: form.categorie,
        classification: normalizeClassificationKey(form.classification),
        proprietaireId: GUID_REGEX.test(form.proprietaireId) ? form.proprietaireId : ZERO_GUID,
      };
      if (editing) {
        await axiosInstance.put(`/api/actifs/${editing.id}`, payload);
      } else {
        await axiosInstance.post('/api/actifs', payload);
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
    if (!window.confirm('Supprimer cet actif ?')) return;
    try {
      await axiosInstance.delete(`/api/actifs/${id}`);
      await fetchAll();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategorieFilter('');
    setClassificationFilter('');
  };

  const getProprietaireLabel = (proprietaireId) => {
    if (!proprietaireId || proprietaireId === ZERO_GUID) return '-';
    const role = roles.find((r) => r.id === proprietaireId);
    return role ? role.nom : `${proprietaireId.substring(0, 8)}...`;
  };

  const renderActifCard = (actif) => {
    const cls = normalizeClassificationKey(actif.classification);
    const classStyle = ClassificationStyle[cls] || ClassificationStyle.NonClasse;
    return (
      <div key={actif.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800">{actif.nom}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{actif.description || 'Aucune description'}</p>
          </div>
          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${TypeBadgeStyle[actif.type] || TypeBadgeStyle.Support}`}>
            {TypeActif[actif.type] || actif.type}
          </span>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${classStyle.badge}`}>
            {ClassificationActif[cls] || cls}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {CategorieActif[actif.categorie] || actif.categorie}
          </span>
        </div>
        <p className="mb-3 text-[11px] text-slate-500">
          Proprietaire: <span className="font-semibold text-slate-700">{getProprietaireLabel(actif.proprietaireId)}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(actif)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Edit size={14} /> Modifier
          </button>
          <button
            type="button"
            onClick={() => handleDelete(actif.id)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 hover:bg-red-100"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-4 py-5 sm:px-6" style={{ fontFamily: T.font }}>
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900 sm:text-[26px]">Gestion des actifs</h1>
            <p className="mt-1 text-xs text-slate-500">Pilotage inventaire ISO 27001 - suivi des actifs et proprietaires.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {exportLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              ) : (
                <Download size={18} />
              )}
              {exportLoading ? 'Export...' : 'Exporter CSV'}
            </button>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95"
              style={{ background: T.gradBlue }}
            >
              <Plus size={22} className="mr-2" /> Nouveau actif
            </button>
          </div>
        </section>

        {/* ── Stats avec KpiStrip ── */}
        <KpiStrip stats={stats} />

        {/* ── Filters ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un actif par nom ou description..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
            />
          </div>

          {/* Dropdowns + view toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownFilter
                label="Tous les types"
                value={typeFilter}
                onChange={setTypeFilter}
                options={Object.entries(TypeActif)}
              />
              <DropdownFilter
                label="Toutes catégories"
                value={categorieFilter}
                onChange={setCategorieFilter}
                options={Object.entries(CategorieActif)}
              />
              <DropdownFilter
                label="Toutes classifications"
                value={classificationFilter}
                onChange={setClassificationFilter}
                options={Object.entries(ClassificationActif)}
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
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">Aucun actif trouvé.</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(renderActifCard)}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 text-left">Nom</th>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-6 py-4 text-left">Categorie</th>
                      <th className="px-6 py-4 text-left">Classification</th>
                      <th className="px-6 py-4 text-left">Proprietaire</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((actif, i) => {
                      const cls = normalizeClassificationKey(actif.classification);
                      const classStyle = ClassificationStyle[cls] || ClassificationStyle.NonClasse;
                      return (
                        <tr key={actif.id} className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          <td className="px-6 py-4">
                            <div className="text-xs font-semibold text-slate-800">{actif.nom}</div>
                            <div className="max-w-56 truncate text-xs text-slate-400">{actif.description || 'Aucune description'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TypeBadgeStyle[actif.type] || TypeBadgeStyle.Support}`}>
                              <Layers size={10} />{TypeActif[actif.type] || actif.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">{CategorieActif[actif.categorie] || actif.categorie}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${classStyle.badge}`}>
                              <Lock size={10} />{ClassificationActif[cls] || cls}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">{getProprietaireLabel(actif.proprietaireId)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button type="button" onClick={() => openEdit(actif)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Modifier">
                                <Edit size={15} />
                              </button>
                              <button type="button" onClick={() => handleDelete(actif.id)} className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100" title="Supprimer">
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

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-700/20 px-6 py-5 text-white" style={{ background: T.gradBlue }}>
              <h2 className="text-base font-bold">{editing ? "Modifier l'actif" : 'Ajouter un actif'}</h2>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 transition hover:bg-white/15">
                <X size={20} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Nom *</label>
                <input type="text" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs focus:border-blue-300 focus:outline-none"
                  placeholder="Nom de l'actif" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs focus:border-blue-300 focus:outline-none"
                  placeholder="Description de l'actif" rows="3" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Type *</label>
                  <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs focus:border-blue-300 focus:outline-none">
                    <option value="">Selectionner un type</option>
                    {Object.entries(TypeActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Categorie *</label>
                  <select required value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs focus:border-blue-300 focus:outline-none">
                    <option value="">Selectionner une categorie</option>
                    {Object.entries(CategorieActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Classification</label>
                  <select value={normalizeClassificationKey(form.classification)} onChange={(e) => setForm({ ...form, classification: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs focus:border-blue-300 focus:outline-none">
                    {Object.entries(ClassificationActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Proprietaire (Role)</label>
                  <select value={form.proprietaireId} onChange={(e) => setForm({ ...form, proprietaireId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-xs focus:border-blue-300 focus:outline-none">
                    <option value="">Aucun proprietaire</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.nom || r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={closeModal}
                  className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  style={{ background: T.gradBlue }}>
                  {loading ? 'Chargement...' : <><CheckCircle size={15} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}
