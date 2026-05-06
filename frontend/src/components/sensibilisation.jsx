import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Download, RefreshCw, ArrowLeft,
  Check, X, Upload, BookOpen, Shield, Loader2, Trash2,
} from 'lucide-react';
import {
  getDashboard,
  getFormations,
  getFormation,
  createFormation,
  notifyParticipants,
  updateParticipantStatus,
  uploadFormationDocument,
  deleteFormationDocument,
  downloadFormationDocument,
  deleteFormation,
} from '../api/sensibilisation';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Software Development & Agentic',
  'Data, AI & Smart Cities',
  'Infrastructure, Cloud & Security',
  'Administration',
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium border
      ${type === 'success' ? 'bg-white text-gray-800 border-gray-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
      {type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-500" />}
      {msg}
    </div>
  );
}

function Spinner({ className = 'py-16' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    </div>
  );
}

function Badge({ status }) {
  const styles = {
    'Planifiée':          'bg-blue-50 text-blue-700 border border-blue-200',
    'En cours':           'bg-amber-50 text-amber-700 border border-amber-200',
    'Terminée':           'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Preuve enregistrée': 'bg-gray-900 text-white',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 font-mono">{total > 0 ? `${value}/${total} · ${pct}%` : '0/— · —'}</span>
    </div>
  );
}

const AVATAR_COLORS = {
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  teal:   'bg-teal-100 text-teal-800',
  coral:  'bg-orange-100 text-orange-800',
  amber:  'bg-amber-100 text-amber-800',
  green:  'bg-green-100 text-green-800',
};

function Avatar({ initials, color = 'blue' }) {
  return (
    <div className={`w-7 h-7 text-[11px] rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${AVATAR_COLORS[color] || AVATAR_COLORS.blue}`}>
      {initials}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 rounded-full border transition-colors flex-shrink-0
        ${checked ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-200 border-gray-300'}`}
      style={{ height: '22px' }}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function SectionDivider({ children }) {
  return (
    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-100 mt-5 mb-3.5 font-mono first:mt-0">
      {children}
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KpiStrip({ data, loading }) {
  const kpis = [
    { label: 'Taux de participation', value: loading ? '—' : `${data?.tauxMoyen ?? 0}%`, sub: `${data?.total ?? 0} formations · moyenne`, highlight: true },
    { label: 'Formations totales',    value: loading ? '—' : data?.total ?? 0,      sub: `${data?.terminees ?? 0} terminées` },
    { label: 'Planifiées',            value: loading ? '—' : data?.planifiees ?? 0, sub: 'À venir' },
    { label: 'En cours',              value: loading ? '—' : data?.enCours ?? 0,    sub: (data?.enCours ?? 0) > 0 ? 'Actives' : 'Aucune active' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 4 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: k.highlight ? 'linear-gradient(135deg,#1D4ED8,#1e40af)' : '#fff',
          borderRadius: 14, padding: '20px 22px',
          boxShadow: k.highlight ? '0 8px 24px rgba(29,78,216,.35)' : '0 2px 8px rgba(0,0,0,.06),0 0 0 1px rgba(0,0,0,.06)',
          animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: k.highlight ? '#fff' : '#111827', fontFamily: "'Sora','Inter',sans-serif", letterSpacing: '-1.5px' }}>{k.value}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6, color: k.highlight ? 'rgba(255,255,255,.9)' : '#374151' }}>{k.label}</div>
          <div style={{ fontSize: 11.5, marginTop: 2, color: k.highlight ? 'rgba(255,255,255,.6)' : '#9CA3AF' }}>{k.sub}</div>
          {k.highlight && typeof data?.tauxMoyen === 'number' && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${data.tauxMoyen}%`, background: 'rgba(255,255,255,.8)', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.4,0,.2,1) .3s' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ActionBar ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'list',   icon: BookOpen, label: 'Formations' },
  { id: 'create', icon: Plus,     label: 'Planifier' },
];

function ActionBar({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 w-fit">
      {MODULES.map(m => {
        const Icon = m.icon;
        const isActive = active === m.id;
        return (
          <button key={m.id} onClick={() => onChange(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all
              ${isActive ? 'bg-blue-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" />{m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Vue Liste ────────────────────────────────────────────────────────────────
function ListView({ formations, loading, onView, onNew, onToast, onRefresh, canWrite, canDelete }) {
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [filterDept,   setFilterDept]   = useState('');
  const [notifying,    setNotifying]    = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [confirmId,    setConfirmId]    = useState(null);

  const filtered = formations.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || f.status === filterStatus;
    const matchType   = !filterType   || f.type === filterType;
    const matchDept   = !filterDept   || f.departement === filterDept || f.departement === 'Tous';
    return matchSearch && matchStatus && matchType && matchDept;
  });

  const handleNotify = async (f) => {
    if (!canWrite) {
      onToast('Vous n\'avez pas la permission d\'envoyer des notifications', 'error');
      return;
    }
    setNotifying(f.id);
    try {
      await notifyParticipants(f.id, 'Notification manuelle');
      onToast('Notification envoyée aux participants');
      onRefresh();
    } catch {
      onToast('Erreur lors de l\'envoi', 'error');
    } finally {
      setNotifying(null);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      onToast('Vous n\'avez pas la permission de supprimer des formations', 'error');
      return;
    }
    setDeleting(id);
    setConfirmId(null);
    try {
      await deleteFormation(id);
      onToast('Formation supprimée');
      onRefresh();
    } catch {
      onToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest font-mono mb-1">ISO 27001 · Clause 7.2 &amp; 7.3</div>
          <h1 className="text-[22px] font-medium text-gray-900">Sensibilisation et formation</h1>
        </div>
        {canWrite && (
          <button onClick={onNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-[13px] rounded-lg hover:opacity-85 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> Nouvelle formation
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-gray-400">
          <option value="">Tous les statuts</option>
          <option>Planifiée</option><option>En cours</option><option>Terminée</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-gray-400">
          <option value="">Tous les types</option>
          <option>Présentiel</option><option>Distanciel</option><option>E-learning</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:border-gray-400">
          <option value="">Tous les départements</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une formation…"
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-gray-400 min-w-[200px]" />
        </div>
        <div className="flex-1" />
        <button onClick={() => onToast('Export généré')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-3.5 h-3.5" /> Exporter pour audit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Intitulé', 'Type', 'Date', 'Durée', 'Formateur', 'Participation', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{f.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{f.departement} · {f.participants} participants</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.type}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-[12px]">
                      {new Date(f.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.duree}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.formateur.split('–')[0].trim()}</td>
                    <td className="px-4 py-3"><ProgressBar value={f.presents} total={f.participants} /></td>
                    <td className="px-4 py-3 whitespace-nowrap"><Badge status={f.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onView(f.id)}
                          className="px-2.5 py-1 border border-gray-200 text-[11px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                          Voir
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => handleNotify(f)}
                            disabled={notifying === f.id}
                            className="px-2.5 py-1 border border-gray-200 text-[11px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                            {notifying === f.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Notifier'}
                          </button>
                        )}
                        {canDelete && (
                          confirmId === f.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                              <span className="text-[10px] text-red-600 whitespace-nowrap">Confirmer ?</span>
                              <button
                                onClick={() => handleDelete(f.id)}
                                disabled={deleting === f.id}
                                className="text-[11px] font-medium text-red-600 hover:text-red-800 disabled:opacity-50 px-1">
                                {deleting === f.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Oui'}
                              </button>
                              <span className="text-red-300">·</span>
                              <button onClick={() => setConfirmId(null)}
                                className="text-[11px] text-gray-500 hover:text-gray-700 px-1">
                                Non
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(f.id)}
                              disabled={deleting === f.id}
                              className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Supprimer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Aucune formation trouvée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vue Créer ────────────────────────────────────────────────────────────────
function CreateView({ onBack, onSave, canWrite, onToast }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    objectif: '',
    date: '',
    heure: '09:00',
    duree: '2h',
    mode: 'Présentiel',
    departement: 'Tous',
    role: 'Tous les rôles',
    formateur: '',
    formateurType: 'Interne',
    lmsLink: '',
    notifInvit: true,
    notifRappel: true,
    participants: [],
  });

  const [partInput, setPartInput] = useState({ fullName: '', email: '', department: '' });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const addParticipant = () => {
    if (!partInput.fullName || !partInput.email) return;
    set('participants', [...form.participants, { ...partInput }]);
    setPartInput({ fullName: '', email: '', department: '' });
  };

  const removeParticipant = (idx) =>
    set('participants', form.participants.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!canWrite) {
      onToast('Vous n\'avez pas la permission de créer des formations', 'error');
      return;
    }
    if (!form.title || !form.date) return;
    setSubmitting(true);
    try {
      await onSave(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest font-mono mb-1">Sensibilisation · Nouvelle</div>
          <h1 className="text-[22px] font-medium text-gray-900">Planifier une formation</h1>
        </div>
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Infos générales */}
        <SectionDivider>Informations générales</SectionDivider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Nom de la formation <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 resize-y focus:outline-none focus:border-gray-400" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Objectif pédagogique</label>
            <input value={form.objectif} onChange={e => set('objectif', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* Planification */}
        <SectionDivider>Planification</SectionDivider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Heure de début</label>
            <input type="time" value={form.heure} onChange={e => set('heure', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Durée <span className="text-red-500">*</span></label>
            <select value={form.duree} onChange={e => set('duree', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400">
              {['30 min', '1h', '1h30', '2h', '3h', '4h', 'Journée complète'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Mode de formation</label>
            <div className="flex gap-4 flex-wrap pt-1">
              {['Présentiel', 'Distanciel', 'E-learning'].map(m => (
                <label key={m} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="radio" name="mode" checked={form.mode === m} onChange={() => set('mode', m)} className="accent-gray-900" />{m}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Participants */}
        <SectionDivider>Participants</SectionDivider>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-2">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Participants spécifiques (avec email pour notifications)</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <input placeholder="Nom complet" value={partInput.fullName}
              onChange={e => setPartInput(p => ({ ...p, fullName: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
            <input placeholder="Email" type="email" value={partInput.email}
              onChange={e => setPartInput(p => ({ ...p, email: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
            <select value={partInput.department}
              onChange={e => setPartInput(p => ({ ...p, department: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400">
              <option value="">Département…</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={addParticipant}
              className="px-3 py-2 bg-blue-700 text-white text-[13px] rounded-lg hover:opacity-85 transition-opacity">
              <Plus className="w-4 h-4 inline mr-1" />Ajouter
            </button>
          </div>
          {form.participants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.participants.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-[12px]">
                  {p.fullName} <span className="text-gray-400">·</span> {p.email}
                  <button onClick={() => removeParticipant(i)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Formateur */}
        <SectionDivider>Formateur</SectionDivider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</label>
            <div className="flex gap-4 flex-wrap pt-1">
              {['Interne', 'Externe'].map(t => (
                <label key={t} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input type="radio" name="fmt" checked={form.formateurType === t} onChange={() => set('formateurType', t)} className="accent-gray-900" />{t}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Nom du formateur</label>
            <input value={form.formateur} onChange={e => set('formateur', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        {/* Notifications */}
        <SectionDivider>Notifications automatiques (FluentEmail · Gmail SMTP)</SectionDivider>
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          {[
            { key: 'notifInvit',  title: 'Invitation par email aux participants',     sub: 'Envoyée immédiatement après la planification' },
            { key: 'notifRappel', title: 'Rappel automatique 48h avant la formation', sub: 'Envoyé automatiquement via le service de fond' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-gray-900">{n.title}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{n.sub}</div>
              </div>
              <Toggle checked={form[n.key]} onChange={v => set(n.key, v)} />
            </div>
          ))}
        </div>

        {/* LMS */}
        <SectionDivider>Lien externe</SectionDivider>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Lien LMS / Drive…</label>
          <input type="url" value={form.lmsLink} onChange={e => set('lmsLink', e.target.value)}
            placeholder="https://…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-gray-400" />
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-gray-100">
          <button onClick={onBack} className="px-4 py-2 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={submitting || !form.title || !form.date || !canWrite}
            className="px-4 py-2 bg-gray-900 text-white text-[13px] rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Planifier la formation →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vue Détail ───────────────────────────────────────────────────────────────
function DetailView({ formationId, onBack, onToast, canWrite, canEdit, canDelete }) {
  const [formation,  setFormation]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getFormation(formationId);
      setFormation(data);
    } catch {
      onToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [formationId, onToast]);

  useEffect(() => { load(); }, [load]);

  const handleNotify = async () => {
    if (!canWrite) {
      onToast('Vous n\'avez pas la permission d\'envoyer des notifications', 'error');
      return;
    }
    try {
      await notifyParticipants(formation.id, 'Notification manuelle');
      onToast('Notifications envoyées');
      await load();
    } catch {
      onToast('Erreur d\'envoi', 'error');
    }
  };

  const handleStatusChange = async (participantId, status) => {
    if (!canEdit) {
      onToast('Vous n\'avez pas la permission de modifier le statut des participants', 'error');
      return;
    }
    try {
      await updateParticipantStatus(formation.id, participantId, status);
      await load();
    } catch {
      onToast('Erreur de mise à jour', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    if (!canEdit) {
      onToast('Vous n\'avez pas la permission d\'ajouter des documents', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadFormationDocument(formation.id, file);
      onToast('Document ajouté');
      await load();
    } catch {
      onToast('Erreur d\'upload', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!canDelete) {
      onToast('Vous n\'avez pas la permission de supprimer des documents', 'error');
      return;
    }
    try {
      await deleteFormationDocument(formation.id, docId);
      onToast('Document supprimé');
      await load();
    } catch {
      onToast('Erreur de suppression', 'error');
    }
  };

  const handleDownload = (doc) =>
    downloadFormationDocument(formation.id, doc.id, doc.name)
      .catch(() => onToast('Erreur de téléchargement', 'error'));

  if (loading) return <Spinner />;
  if (!formation) return <div className="text-gray-400 text-center py-10">Formation introuvable.</div>;

  const pct          = formation.participants > 0 ? Math.round((formation.presents / formation.participants) * 100) : 0;
  const circumference = 2 * Math.PI * 32;
  const offset        = circumference - (pct / 100) * circumference;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest font-mono mb-1">
            Formation · #{formation.reference} · Preuve ISO 27001
          </div>
          <h1 className="text-[22px] font-medium text-gray-900">{formation.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="px-3 py-2 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          {canWrite && (
            <button onClick={handleNotify}
              className="px-3 py-2 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <SendIcon className="w-4 h-4" /> Notifier
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge status={formation.status} />
              {formation.status === 'Terminée' && <Badge status="Preuve enregistrée" />}
            </div>
            {[
              { label: 'Date',         value: `${new Date(formation.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })} · ${formation.heure}` },
              { label: 'Durée',        value: formation.duree },
              { label: 'Mode',         value: formation.type },
              { label: 'Formateur',    value: `${formation.formateur} (${(formation.formateurType ?? '').toLowerCase()})` },
              { label: 'Public cible', value: formation.departement },
              { label: 'Objectif',     value: formation.objectif, muted: true },
            ].map(row => (
              <div key={row.label} className="flex gap-3 mb-2 text-[13px] items-baseline">
                <span className="text-gray-400 text-[12px] min-w-[110px]">{row.label}</span>
                <span className={row.muted ? 'text-gray-500' : 'text-gray-900'}>{row.value}</span>
              </div>
            ))}

            <SectionDivider>Suivi de participation</SectionDivider>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#ECFDF5" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#059669" strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[18px] font-medium font-mono text-gray-900">{pct}%</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { color: 'bg-emerald-600', label: 'Présents', count: formation.presents },
                  { color: 'bg-gray-200',    label: 'Invités',  count: formation.participants - formation.presents },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-[12px] text-gray-600">{s.label} : <strong>{s.count}</strong></span>
                  </div>
                ))}
              </div>
            </div>
            {formation.status === 'Terminée' && (
              <div className="mt-4 bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 rounded-lg p-3 text-[12px]">
                Preuve enregistrée pour audit ISO 27001 · {formation.presents} attestations de présence
              </div>
            )}
          </div>
          
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Participants */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="text-[14px] font-medium text-gray-900 mb-4">
              Participants ({formation.participants})
            </div>
            {formation.participantsList.length === 0
              ? <p className="text-[12px] text-gray-400">Aucun participant renseigné.</p>
              : formation.participantsList.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={p.initials} color={p.color} />
                    <div>
                      <div className="text-[13px] font-medium text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-400">{p.dept}</div>
                    </div>
                  </div>
                  <select
                    value={p.status}
                    onChange={e => handleStatusChange(p.id, e.target.value)}
                    disabled={!canEdit}
                    className="text-[11px] border border-gray-200 rounded-full px-2 py-1 bg-white text-gray-700 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <option>Invité</option><option>Présent</option>
                  </select>
                </div>
              ))
            }
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-medium text-gray-900">Documents</span>
              <div className="flex items-center gap-2">
                {uploading && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.pptx" onChange={handleFileUpload} />
                {canEdit && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-2.5 py-1 border border-gray-200 text-[11px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <Upload className="w-3 h-3" /> Ajouter
                  </button>
                )}
              </div>
            </div>
            {formation.docs.length === 0
              ? <p className="text-[12px] text-gray-400">Aucun document joint.</p>
              : formation.docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold
                    ${doc.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {doc.type === 'pdf' ? 'PDF' : '↗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-900 truncate">{doc.name}</div>
                    <div className="text-[11px] text-gray-400">{doc.meta}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDownload(doc)}
                      className="px-2 py-1 border border-gray-200 text-[11px] text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                      ↓
                    </button>
                    {canDelete && (
                      <button onClick={() => handleDeleteDoc(doc.id)}
                        className="px-2 py-1 border border-red-100 text-[11px] text-red-400 rounded-lg hover:bg-red-50 transition-colors">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant SendIcon
function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Sensibilisation() {
  const { canRead, canWrite, canEdit, canDelete } = useAuth();
  const moduleCode = "sensibilisation";
  const hasAccess = canRead(moduleCode);
  
  const [module,      setModule]      = useState('list');
  const [formations,  setFormations]  = useState([]);
  const [dashboard,   setDashboard]   = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingKpi,  setLoadingKpi]  = useState(true);
  const [selectedId,  setSelectedId]  = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadFormations = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await getFormations();
      setFormations(data);
    } catch {
      showToast('Erreur lors du chargement des formations', 'error');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadingKpi(true);
    try {
      const data = await getDashboard();
      setDashboard(data);
    } catch {
      // silencieux
    } finally {
      setLoadingKpi(false);
    }
  }, []);

  useEffect(() => {
    loadFormations();
    loadDashboard();
  }, [loadFormations, loadDashboard]);

  const handleRefresh = () => {
    loadFormations();
    loadDashboard();
    showToast('Données actualisées');
  };

  const handleView = (id) => {
    setSelectedId(id);
    setModule('detail');
  };

  const handleSave = async (form) => {
    if (!canWrite(moduleCode)) {
      showToast('Vous n\'avez pas la permission de créer des formations', 'error');
      throw new Error('Permission denied');
    }
    try {
      await createFormation({
        title:         form.title,
        description:   form.description,
        objectif:      form.objectif,
        mode:          form.mode,
        date:          form.date,
        heure:         form.heure,
        duree:         form.duree,
        formateur:     form.formateur,
        formateurType: form.formateurType,
        departement:   form.departement,
        role:          form.role,
        lmsLink:       form.lmsLink || null,
        notifInvit:    form.notifInvit,
        notifRappel:   form.notifRappel,
        participants:  form.participants,
        societeId:     null,
      });
      showToast('Formation planifiée avec succès');
      setModule('list');
      await loadFormations();
      await loadDashboard();
    } catch {
      showToast('Erreur lors de la création', 'error');
      throw new Error('create failed');
    }
  };

  // Vérification d'accès
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à la gestion de la sensibilisation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50" style={{ fontFamily: "'Inter','DM Sans',system-ui,sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 36px 60px', width: '100%' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.8px' }}>
                Sensibilisation et formation
              </h1>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                Clause 7.2 &amp; 7.3 · Gestion des formations SMSI
              </p>
            </div>
            <button onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all" title="Rafraîchir">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
        <KpiStrip data={dashboard} loading={loadingKpi} />

        <ActionBar
          active={module === 'detail' ? 'list' : module}
          onChange={v => { setModule(v); setSelectedId(null); }}
        />

        {module === 'list' && (
          <ListView
            formations={formations}
            loading={loadingList}
            onView={handleView}
            onNew={() => setModule('create')}
            onToast={showToast}
            onRefresh={handleRefresh}
            canWrite={canWrite(moduleCode)}
            canDelete={canDelete(moduleCode)}
          />
        )}
        {module === 'create' && (
          <CreateView onBack={() => setModule('list')} onSave={handleSave} canWrite={canWrite(moduleCode)} onToast={showToast} />
        )}
        {module === 'detail' && selectedId && (
          <DetailView
            formationId={selectedId}
            onBack={() => { setModule('list'); setSelectedId(null); }}
            onToast={showToast}
            canWrite={canWrite(moduleCode)}
            canEdit={canEdit(moduleCode)}
            canDelete={canDelete(moduleCode)}
          />
        )}
        </div>
      </main>

      <style>{`
        body,html{margin:0;padding:0;width:100%;overflow-x:hidden}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#f9fafb;border-radius:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#d1d5db}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}