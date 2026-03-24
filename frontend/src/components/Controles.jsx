import React, { useState, useEffect } from 'react';
import PlanActionNC from './PlanActionNC';
import {
  Search, CheckCircle2, TrendingUp, AlertCircle,
  MinusCircle, AlertTriangle, Ban, X, Save, ClipboardList,
  Building2, Users, Lock, Cpu, ShieldCheck, Upload, FileText,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api/controles';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────── */
const T = {
  font: "'Sora', sans-serif",
  bg: '#f1f5f9',
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

const DOMAIN_THEMES = {
  Organisationnel: {
    accent: '#4f46e5', accentLight: '#e0e7ff', border: '#c7d2fe',
    tabActive: '#4f46e5', headerBg: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    icon: <Building2 size={18} />, label: 'Organisationnels',
  },
  Personnes: {
    accent: '#059669', accentLight: '#d1fae5', border: '#a7f3d0',
    tabActive: '#059669', headerBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon: <Users size={18} />, label: 'Liés aux personnes',
  },
  Physique: {
    accent: '#ea580c', accentLight: '#ffedd5', border: '#fed7aa',
    tabActive: '#ea580c', headerBg: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    icon: <Lock size={18} />, label: 'Physiques',
  },
  Technologique: {
    accent: '#9333ea', accentLight: '#f3e8ff', border: '#e9d5ff',
    tabActive: '#9333ea', headerBg: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
    icon: <Cpu size={18} />, label: 'Technologiques',
  },
};

const STATUTS = [
  { key: 'NonEvalue', label: 'Non évalué',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: <MinusCircle size={16} /> },
  { key: 'Conforme',  label: 'Conforme',    color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={16} /> },
  { key: 'Remarque',  label: 'Remarque',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <AlertCircle  size={16} /> },
  { key: 'NCMineure', label: 'NC Mineure',  color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: <AlertTriangle size={16} /> },
  { key: 'NCMajeure', label: 'NC Majeure',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <Ban          size={16} /> },
];

/* ─── SELECT GÉNÉRIQUE STYLISÉ ──────────────────────────────────────── */
function StyledSelect({ value, onChange, options, placeholder = 'Sélectionner...', accentColor }) {
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          width: '100%',
          padding: '12px 40px 12px 14px',
          fontSize: 14,
          fontWeight: selected ? 700 : 400,
          fontFamily: T.font,
          borderRadius: 12,
          border: `2px solid ${selected && accentColor ? accentColor : T.gray200}`,
          background: selected && accentColor ? hexToRgba(accentColor, 0.06) : '#fff',
          color: selected && accentColor ? accentColor : T.gray700,
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)',
          color: selected && accentColor ? accentColor : T.gray400,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* helper pour fond coloré transparent */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── BADGE STATUT (affiché dans la liste des contrôles) ────────────── */
function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.key === statut);
  if (!s || statut === 'NonEvalue') return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 99, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function Controles() {
  const [controles, setControles]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [activeTab, setActiveTab]         = useState('Organisationnel');
  const [evaluationCtrl, setEvaluationCtrl] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get(API)
      .then(r => setControles(r.data.map(normalize)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSaveEvaluation = async (updated) => {
    try {
      await axios.put(`${API}/${updated.id}`, updated);
      setControles(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEvaluationCtrl(null);
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const conforme  = controles.filter(c => c.statut === 'Conforme').length;
  const filtered  = controles.filter(c =>
    ((c.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
     (c.code?.toLowerCase()  || '').includes(searchTerm.toLowerCase())) &&
    c.domaine === activeTab
  );

  const statCards = [
    { label: 'Total',      value: controles.length,                                      color: '#6366f1', icon: <ShieldCheck size={18} /> },
    { label: 'Conforme',   value: conforme,                                               ...STATUTS[1] },
    { label: 'Remarque',   value: controles.filter(c => c.statut === 'Remarque').length,  ...STATUTS[2] },
    { label: 'NC Mineure', value: controles.filter(c => c.statut === 'NCMineure').length, ...STATUTS[3] },
    { label: 'NC Majeure', value: controles.filter(c => c.statut === 'NCMajeure').length, ...STATUTS[4] },
    { label: 'Non évalué', value: controles.filter(c => c.statut === 'NonEvalue').length, ...STATUTS[0] },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* ── HEADER ── */}
      <header style={{ background: T.gradBlue, padding: '40px', color: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Contrôles ISO 27001 — Annexe A</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: 14 }}>
            <TrendingUp size={20} color="#10B981" />
            <span style={{ fontWeight: 800 }}>{Math.round((conforme / (controles.length || 1)) * 100)}%</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '30px auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', border: `1px solid ${T.gray200}`, borderRadius: 16, padding: '20px', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: card.color }}>
                {card.icon}
                <span style={{ fontSize: 11, fontWeight: 700, color: T.gray500 }}>{card.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── SEARCH ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px', boxShadow: T.shadow }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
            <input
              type="text"
              placeholder="Rechercher un contrôle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 40px', fontSize: 14, border: `1px solid ${T.gray200}`, borderRadius: 10, outline: 'none', fontFamily: T.font }}
            />
          </div>
        </div>

        {/* ── TABS + LIST ── */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.gray200}` }}>
            {Object.keys(DOMAIN_THEMES).map(key => {
              const dt = DOMAIN_THEMES[key];
              const isActive = activeTab === key;
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1, padding: '22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    border: 'none', borderBottom: isActive ? `4px solid ${dt.tabActive}` : 'none',
                    background: isActive ? dt.headerBg : '#fff',
                    color: isActive ? '#fff' : dt.tabActive,
                    transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, fontFamily: T.font,
                  }}>
                  {dt.icon} {dt.label}
                </button>
              );
            })}
          </div>

          <div>
            {loading && <p style={{ padding: 32, textAlign: 'center', color: T.gray500 }}>Chargement…</p>}
            {!loading && filtered.length === 0 && (
              <p style={{ padding: 32, textAlign: 'center', color: T.gray400 }}>Aucun contrôle trouvé.</p>
            )}
            {filtered.map(ctrl => (
              <div key={ctrl.id}
                style={{
                  padding: '24px 32px', borderBottom: `1px solid ${T.gray200}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, background: T.bg, padding: '4px 10px', borderRadius: 8 }}>{ctrl.code}</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{ctrl.titre}</h3>
                    <StatutBadge statut={ctrl.statut} />
                  </div>
                  <p style={{ fontSize: 13, color: T.gray500, marginTop: 8, maxWidth: '90%' }}>{ctrl.description}</p>

                  {ctrl.statut === 'Conforme' && ctrl.justificationConformite && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid #059669' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <CheckCircle2 size={14} color="#059669" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Justification de conformité</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.gray700, margin: 0 }}>{ctrl.justificationConformite}</p>
                    </div>
                  )}

                  {ctrl.statut === 'Remarque' && ctrl.remarque && (
                    <div style={{ marginTop: 12, padding: 12, background: '#eff6ff', borderRadius: 8, borderLeft: '4px solid #2563eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <AlertCircle size={14} color="#2563eb" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Remarque</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.gray700, margin: 0 }}>{ctrl.remarque}</p>
                    </div>
                  )}

                  {(ctrl.statut === 'NCMineure' || ctrl.statut === 'NCMajeure') && ctrl.planCorrectif && (
                    <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 8, borderLeft: '4px solid #dc2626' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <ClipboardList size={14} color="#dc2626" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Plan d'action en cours</span>
                        {ctrl.responsable && <span style={{ fontSize: 11, color: T.gray500 }}>— {ctrl.responsable}</span>}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEvaluationCtrl(ctrl)}
                  style={{
                    marginLeft: 20, padding: '12px 24px', borderRadius: 10, border: 'none',
                    background: T.gradBlue, color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 4px 10px rgba(29,78,216,0.2)', whiteSpace: 'nowrap',
                    fontFamily: T.font,
                  }}>
                  Évaluer
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {evaluationCtrl && (
        <EvaluationPanel
          ctrl={evaluationCtrl}
          onClose={() => setEvaluationCtrl(null)}
          onSave={handleSaveEvaluation}
          theme={DOMAIN_THEMES[evaluationCtrl.domaine]}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANNEAU D'ÉVALUATION  — listes déroulantes pour tous les choix
═══════════════════════════════════════════════════════════════════════ */
function EvaluationPanel({ ctrl, onClose, onSave, theme }) {
  // On initialise avec les données existantes du contrôle
  const [form, setForm] = useState({ ...ctrl });
  const [files, setFiles] = useState([]);
  const [showPlan, setShowPlan] = useState(false);

  // --- LOGIQUE DE TUNNEL ---
  
  // Strictement vrai si l'utilisateur a cliqué sur Oui
  const isApplicable = form.applicable === true;
  
  // Strictement vrai si l'utilisateur a cliqué sur Non
  const isNotApplicable = form.applicable === false;

  // Étape 2 (Justification) : Apparaît seulement si c'est APPLICABLE
  const showStep2 = isApplicable; 
  
  // Étape 3 (Statut) : Apparaît si Step 2 est remplie (min 5 caractères ou fichier)
  const showStep3 = isApplicable && (form.justificationApplicabilite?.trim().length > 5 || files.length > 0);

  // Détails finaux : Apparaît si un statut est choisi
  const isStatusSelected = form.statut && form.statut !== 'NonEvalue';
  const isNC = form.statut === 'NCMineure' || form.statut === 'NCMajeure';

  // --- HANDLERS ---
  const handleApplicableChange = (val) => {
    setShowPlan(false);
    if (val === 'oui') {
      setForm(f => ({ ...f, applicable: true }));
    } else if (val === 'non') {
      // Si NON : on vide les champs de conformité et on arrête le tunnel
      setForm(f => ({ 
        ...f, 
        applicable: false, 
        statut: 'NonEvalue',
        justificationApplicabilite: '',
        justificationConformite: '',
        remarque: ''
      }));
    } else {
      setForm(f => ({ ...f, applicable: null }));
    }
  };

  const handleStatutChange = (val) => {
    setShowPlan(false);
    setForm(f => ({ ...f, statut: val || 'NonEvalue' }));
  };

  // --- VALIDATION DU BOUTON ENREGISTRER ---
  const canSave = 
    isNotApplicable || // On peut enregistrer direct si on a choisi "Non"
    (isApplicable && isStatusSelected && (
      (form.statut === 'Conforme' && form.justificationConformite?.length > 5) ||
      (form.statut === 'Remarque' && form.remarque?.length > 5) ||
      (isNC && showPlan) // Si NC, on attend que le plan d'action soit au moins ouvert
    ));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', width: 620, background: '#fff', height: '100vh', 
        display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)',
        animation: 'slideIn 0.3s', fontFamily: T.font
      }}>
        
        {/* HEADER */}
        <div style={{ background: theme.headerBg, padding: '28px 30px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{form.code} — Évaluation</h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 30, display: 'flex', flexDirection: 'column', gap: 30 }}>
          
          {/* ÉTAPE 1 : APPLICABILITÉ (Affiche "Sélectionner..." par défaut) */}
          <Section num="1" title="Applicabilité du contrôle">
            <StyledSelect
              value={form.applicable === true ? 'oui' : form.applicable === false ? 'non' : ''}
              onChange={handleApplicableChange}
              placeholder="Sélectionner..." 
              options={[
                { value: 'oui', label: 'Applicable' },
                { value: 'non', label: "Non Applicable" }
              ]}
              accentColor={isApplicable ? '#059669' : isNotApplicable ? '#dc2626' : null}
            />
          </Section>

          {/* ÉTAPE 2 : JUSTIFICATION (Seulement si OUI) */}
          {showStep2 && (
            <Section num="2" title="Justification d'applicabilité" animate>
              <textarea
                rows={3}
                style={inputStyle}
                placeholder="Pourquoi ce contrôle s'applique-t-il ?"
                value={form.justificationApplicabilite || ''}
                onChange={e => setForm(f => ({ ...f, justificationApplicabilite: e.target.value }))}
              />
              <label style={uploadAreaStyle}>
                <Upload size={16} /> <span>Joindre une preuve d'applicabilité</span>
                <input type="file" style={{ display: 'none' }} onChange={(e) => setFiles([{name: e.target.files[0].name}])} />
              </label>
              {files.map((f, i) => <div key={i} style={fileChipStyle}>{f.name}</div>)}
            </Section>
          )}

          {/* ÉTAPE 3 : STATUT (Seulement si Step 2 remplie) */}
          {showStep3 && (
            <Section num="3" title="État de conformité" animate>
              <StyledSelect
                value={isStatusSelected ? form.statut : ''}
                onChange={handleStatutChange}
                placeholder="Sélectionner l'état..."
                options={STATUTS.filter(s => s.key !== 'NonEvalue').map(s => ({ value: s.key, label: s.label }))}
                accentColor={isStatusSelected ? STATUTS.find(s => s.key === form.statut).color : null}
              />
            </Section>
          )}

          {/* ÉTAPE 4 : DÉTAILS FINAUX */}
          {isStatusSelected && isApplicable && (
            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
              
              {form.statut === 'Conforme' && (
                <Section num="4" title="Justification de conformité" accentBg="#f0fdf4" accentBorder="#bbf7d0" accentColor="#059669">
                  <textarea
                    rows={4}
                    style={inputStyle}
                    placeholder="Démontrez comment le contrôle est respecté..."
                    value={form.justificationConformite || ''}
                    onChange={e => setForm(f => ({ ...f, justificationConformite: e.target.value }))}
                  />
                </Section>
              )}

              {form.statut === 'Remarque' && (
                <Section num="4" title="Détail de la remarque" accentBg="#eff6ff" accentBorder="#bfdbfe" accentColor="#2563eb">
                  <textarea
                    rows={4}
                    style={inputStyle}
                    placeholder="Saisissez l'observation..."
                    value={form.remarque || ''}
                    onChange={e => setForm(f => ({ ...f, remarque: e.target.value }))}
                  />
                </Section>
              )}

              {isNC && !showPlan && (
                <div style={{ textAlign: 'center', padding: '24px', background: '#fef2f2', borderRadius: 12, border: '1px dashed #ef4444' }}>
                  <p style={{ fontSize: 13, color: '#991b1b', marginBottom: 15, fontWeight: 700 }}>
                    Le statut de Non-Conformité nécessite un plan d'action.
                  </p>
                  <button 
                    onClick={() => setShowPlan(true)}
                    style={{ ...btnPrimary, background: T.gradRed, width: 'auto', margin: '0 auto', padding: '10px 20px' }}
                  >
                    <ClipboardList size={16} /> Ajouter un plan d'action
                  </button>
                </div>
              )}

              {isNC && showPlan && (
                <PlanActionNC
                  ctrl={form}
                  statut={form.statut}
                  onChange={(planData) => setForm(prev => ({ ...prev, ...planData }))}
                />
              )}
            </div>
          )}
        </div>

        {/* PIED DE PAGE */}
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={btnSecondary}>Annuler</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            style={{ 
              ...btnPrimary, 
              background: canSave ? T.gradBlue : T.gray200,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            <Save size={16} /> Enregistrer l'évaluation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANTS INTERNES
═══════════════════════════════════════════════════════════════════════ */

/** Bloc de section numéroté */
function Section({ num, title, children, animate, accentBg, accentBorder, accentColor, icon }) {
  return (
    <section style={{
      animation: animate ? 'fadeInUp 0.3s ease' : 'none',
      padding: accentBg ? 18 : 0,
      background: accentBg || 'transparent',
      borderRadius: accentBg ? 14 : 0,
      border: accentBg ? `1.5px solid ${accentBorder}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: accentColor || '#1D4ED8',
          color: '#fff', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{num}</span>
        {icon && React.cloneElement(icon, { color: accentColor || '#1D4ED8' })}
        <label style={{ fontSize: 14, fontWeight: 800, color: accentColor || T.gray900 }}>{title}</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

/** Bannière d'information */
function InfoBanner({ color, border, icon, iconColor, children }) {
  return (
    <div style={{
      padding: '10px 14px', background: color, border: `1px solid ${border}`,
      borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
    }}>
      {icon}
      <span style={{ fontSize: 13, color: T.gray700, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

/* ── styles réutilisables ── */
const inputStyle = {
  width: '100%', padding: '11px 13px', borderRadius: 10,
  border: `1px solid ${T.gray200}`, fontSize: 13, outline: 'none',
  fontFamily: T.font, boxSizing: 'border-box', resize: 'vertical',
  background: '#fff', color: T.gray900, lineHeight: 1.6,
};

const uploadAreaStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  padding: 14, border: `2px dashed ${T.gray200}`, borderRadius: 12,
  color: T.gray500, fontSize: 12, cursor: 'pointer', background: '#f9fafb',
  marginTop: 10,
};

const fileChipStyle = {
  marginTop: 7, fontSize: 12, background: '#EFF6FF', color: '#1D4ED8',
  padding: '7px 12px', borderRadius: 8, display: 'flex', alignItems: 'center',
  gap: 7, fontWeight: 600,
};

const btnPrimary = {
  flex: 2, padding: '13px 20px', borderRadius: 12, border: 'none',
  color: '#fff', fontWeight: 700, fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  cursor: 'pointer', fontFamily: T.font, transition: 'opacity 0.2s',
};

const btnSecondary = {
  flex: 1, padding: '13px 20px', borderRadius: 12,
  border: `1px solid ${T.gray200}`, background: '#fff',
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
  fontFamily: T.font, color: T.gray700,
};

/* ═══════════════════════════════════════════════════════════════════════
   NORMALISATION DES DONNÉES API
═══════════════════════════════════════════════════════════════════════ */
function normalize(c) {
  return {
    id:                      c.Id                    ?? c.id,
    code:                    c.Code                  ?? c.code,
    titre:                   c.Titre                 ?? c.titre,
    description:             c.Description           ?? c.description,
    domaine:                 c.Domaine               ?? c.domaine,
    applicable:              c.Applicable            ?? c.applicable,
    statut:                  c.Statut                ?? c.statut,
    preuves:                 c.Preuves               ?? c.preuves,
    responsable:             c.Responsable           ?? c.responsable,
    justificationApplicabilite: c.JustificationApplicabilite ?? c.justificationApplicabilite,
    justificationConformite: c.JustificationConformite ?? c.justificationConformite,
    documentsConformite:     c.DocumentsConformite   ?? c.documentsConformite,
    remarque:                c.Remarque              ?? c.remarque,
    planAction:              c.PlanAction            ?? c.planAction,
    dateEcheance:            c.DateEcheance          ?? c.dateEcheance,
    actionImmediate:         c.ActionImmediate       ?? c.actionImmediate,
    causesRacines:           c.CausesRacines         ?? c.causesRacines,
    planCorrectif:           c.PlanCorrectif         ?? c.planCorrectif,
    verification:            c.Verification          ?? c.verification,
    indicateurs:             c.Indicateurs           ?? c.indicateurs,
    dateVerification:        c.DateVerification      ?? c.dateVerification,
    commentaireCloture:      c.CommentaireCloture    ?? c.commentaireCloture,
    cloturePar:              c.CloturePar            ?? c.cloturePar,
    dateCloture:             c.DateCloture           ?? c.dateCloture,
    statutPlan:              c.StatutPlan            ?? c.statutPlan,
  };
}