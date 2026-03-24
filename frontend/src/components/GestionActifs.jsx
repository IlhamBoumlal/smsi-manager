import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Database, Shield, Lock, ChevronDown, Layers, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api';

const TypeActif = { Support: 'Support', Primaire: 'Primaire' };

const CategorieActif = {
  Organisation: 'Organisation', Technique: 'Technique',
  Infrastructure: 'Infrastructure', InfrastructureCloud: 'Infrastructure Cloud',
  Application: 'Application', ServiceDeSecurite: 'Service de Sécurité',
  SecuriteSupervision: 'Sécurité Supervision', Reseau: 'Réseau',
  DevOps: 'DevOps', Securite: 'Sécurité', Applications: 'Applications',
  SICloud: 'SI Cloud', SecuritePhysique: 'Sécurité Physique',
  EquipementInformatique: 'Équipement Informatique'
};

const ClassificationActif = {
  NonClassé: 'Non Classé', Confidentiel: 'Confidentiel',
  Secret: 'Secret', TopSecret: 'Top Secret'
};

const ClassificationStyle = {
  NonClassé:    { badge: 'bg-slate-100 text-slate-700' },
  Confidentiel: { badge: 'bg-blue-100 text-blue-800' },
  Secret:       { badge: 'bg-orange-100 text-orange-800' },
  TopSecret:    { badge: 'bg-red-100 text-red-800' }
};

const TypeBadgeStyle = {
  Primaire: 'bg-purple-100 text-purple-800',
  Support:  'bg-slate-100 text-slate-700'
};

const EMPTY_FORM = {
  nom: '', description: '', type: '',
  categorie: '', classification: 'NonClassé', proprietaireId: ''
};

export default function GestionActifs() {
  const [actifs,               setActifs]               = useState([]);
  const [roles,                setRoles]                = useState([]);
  const [search,               setSearch]               = useState('');
  const [typeFilter,           setTypeFilter]           = useState('');
  const [categorieFilter,      setCategorieFilter]      = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [modal,                setModal]                = useState(false);
  const [editing,              setEditing]              = useState(null);
  const [loading,              setLoading]              = useState(false);
  const [fetchLoading,         setFetchLoading]         = useState(true);
  const [showTypeDropdown,     setShowTypeDropdown]     = useState(false);
  const [showCatDropdown,      setShowCatDropdown]      = useState(false);
  const [showClassifDropdown,  setShowClassifDropdown]  = useState(false);
  const [form,                 setForm]                 = useState(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setFetchLoading(true);
    try {
      const [actifsRes, rolesRes] = await Promise.all([
        axios.get(`${API}/actifs`),
        axios.get(`${API}/role`),
      ]);
      setActifs(actifsRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const stats = {
    total:     actifs.length,
    sensibles: actifs.filter(a => a.classification === 'Secret' || a.classification === 'TopSecret').length,
    primaires: actifs.filter(a => a.type === 'Primaire').length,
    supports:  actifs.filter(a => a.type === 'Support').length,
  };

  const reset      = () => { setForm(EMPTY_FORM); setEditing(null); };
  const closeModal = () => { setModal(false); reset(); };
  const openNew    = () => { reset(); setModal(true); };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      nom:            a.nom,
      description:    a.description,
      type:           a.type,
      categorie:      a.categorie,
      classification: a.classification,
      proprietaireId: a.proprietaireId || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nom:            form.nom,
        description:    form.description,
        type:           form.type,
        categorie:      form.categorie,
        classification: form.classification,
        proprietaireId: form.proprietaireId || null,
      };
      if (editing) {
        await axios.put(`${API}/actifs/${editing.id}`, payload);
      } else {
        await axios.post(`${API}/actifs`, payload);
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      const msg = typeof err.response?.data === 'object'
        ? JSON.stringify(err.response.data)
        : err.response?.data;
      alert(`Erreur: ${msg || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet actif ?')) return;
    try {
      await axios.delete(`${API}/actifs/${id}`);
      await fetchAll();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const getProprietaireLabel = (proprietaireId) => {
    if (!proprietaireId || proprietaireId === '00000000-0000-0000-0000-000000000000') return '—';
    const role = roles.find(r => r.id === proprietaireId);
    return role ? role.nom : proprietaireId.substring(0, 8) + '...';
  };

  const filtered = actifs.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.nom?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)) &&
      (!typeFilter           || a.type           === typeFilter) &&
      (!categorieFilter      || a.categorie      === categorieFilter) &&
      (!classificationFilter || a.classification === classificationFilter)
    );
  });

  const Dropdown = ({ show, onToggle, label, children }) => (
    <div className="relative">
      <button onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all">
        <span>{label}</span><ChevronDown size={16} />
      </button>
      {show && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-48 max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Gestion des actifs</h1>
          <p className="text-sm text-slate-500 mt-1">Inventaire et classification des actifs informationnels</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
          <Plus size={18} /> Ajouter un actif
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total actifs',        value: stats.total,     icon: <Database size={18} className="text-blue-500" />,   color: 'text-slate-800' },
          { label: 'Secret / Top Secret', value: stats.sensibles, icon: <Lock     size={18} className="text-red-500" />,    color: 'text-red-600' },
          { label: 'Actifs Primaires',    value: stats.primaires, icon: <Layers   size={18} className="text-purple-500" />, color: 'text-purple-600' },
          { label: 'Actifs Support',      value: stats.supports,  icon: <Shield   size={18} className="text-orange-500" />, color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">{s.icon}<p className="text-sm text-slate-600">{s.label}</p></div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher un actif par nom ou description..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg w-full text-sm focus:outline-none focus:border-blue-300" />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Dropdown show={showTypeDropdown} onToggle={() => setShowTypeDropdown(!showTypeDropdown)}
            label={typeFilter ? TypeActif[typeFilter] : 'Tous les types'}>
            <button onClick={() => { setTypeFilter(''); setShowTypeDropdown(false); }}
              className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100">Tous les types</button>
            {Object.entries(TypeActif).map(([k, v]) =>
              <button key={k} onClick={() => { setTypeFilter(k); setShowTypeDropdown(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{v}</button>)}
          </Dropdown>
          <Dropdown show={showCatDropdown} onToggle={() => setShowCatDropdown(!showCatDropdown)}
            label={categorieFilter ? CategorieActif[categorieFilter] : 'Toutes catégories'}>
            <button onClick={() => { setCategorieFilter(''); setShowCatDropdown(false); }}
              className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100">Toutes catégories</button>
            {Object.entries(CategorieActif).map(([k, v]) =>
              <button key={k} onClick={() => { setCategorieFilter(k); setShowCatDropdown(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{v}</button>)}
          </Dropdown>
          <Dropdown show={showClassifDropdown} onToggle={() => setShowClassifDropdown(!showClassifDropdown)}
            label={classificationFilter ? ClassificationActif[classificationFilter] : 'Toutes classifications'}>
            <button onClick={() => { setClassificationFilter(''); setShowClassifDropdown(false); }}
              className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100">Toutes classifications</button>
            {Object.entries(ClassificationActif).map(([k, v]) =>
              <button key={k} onClick={() => { setClassificationFilter(k); setShowClassifDropdown(false); }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{v}</button>)}
          </Dropdown>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {fetchLoading ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {['Nom', 'Type', 'Catégorie', 'Classification', 'Propriétaire', 'Actions'].map(col => (
                  <th key={col} className={`px-6 py-4 ${col === 'Actions' ? 'text-center' : 'text-left'}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((actif, i) => {
                const style = ClassificationStyle[actif.classification] || ClassificationStyle['NonClassé'];
                return (
                  <tr key={actif.id}
                    className={`hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{actif.nom}</div>
                      <div className="text-xs text-slate-400 truncate max-w-48">{actif.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${TypeBadgeStyle[actif.type] || 'bg-slate-100 text-slate-700'}`}>
                        <Layers size={10} />{TypeActif[actif.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{CategorieActif[actif.categorie] || actif.categorie}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                        <Lock size={10} />{ClassificationActif[actif.classification]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {getProprietaireLabel(actif.proprietaireId)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(actif)} title="Modifier"
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => handleDelete(actif.id)} title="Supprimer"
                          className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!fetchLoading && filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Aucun actif trouvé</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editing ? "Modifier l'actif" : 'Ajouter un actif'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Nom *</label>
                <input type="text" required value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                  placeholder="Nom de l'actif" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                  placeholder="Description de l'actif" rows="3" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Type *</label>
                <select required value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300">
                  <option value="">Sélectionner un type</option>
                  {Object.entries(TypeActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Catégorie *</label>
                <select required value={form.categorie}
                  onChange={e => setForm({ ...form, categorie: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300">
                  <option value="">Sélectionner une catégorie</option>
                  {Object.entries(CategorieActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Classification</label>
                <select value={form.classification}
                  onChange={e => setForm({ ...form, classification: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300">
                  {Object.entries(ClassificationActif).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Propriétaire (Rôle)</label>
                <select value={form.proprietaireId}
                  onChange={e => setForm({ ...form, proprietaireId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300">
                  <option value="">— Aucun propriétaire —</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? 'Chargement…' : <><CheckCircle size={15} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}