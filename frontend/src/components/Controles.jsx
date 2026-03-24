import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, Clock, XCircle,
  ShieldCheck, FileText, TrendingUp, AlertCircle,
  Link2, ChevronDown, ChevronUp, Pencil,
  MinusCircle, AlertTriangle, Ban, X, Save,
  ClipboardList, Building2, Users, Lock, Cpu
} from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api/controles';

/* ─── DESIGN TOKENS ───────────────────────────────────────────────────────── */
const T = {
  xs:     13,
  sm:     15,
  base:   16,
  md:     18,
  lg:     20,
  xl:     24,
  '3xl':  44,

  normal:   400,
  medium:   500,
  semibold: 600,
  bold:     700,

  black:   '#0f172a',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50:  '#f9fafb',
  white:   '#ffffff',
  bg:      '#f1f5f9',
};

/* ─── COULEURS PAR DOMAINE ─────────────────────────────────────────────────── */
const DOMAIN_THEMES = {
  Organisationnel: {
    bg:         '#f0f4ff',
    rowBg:      '#f8faff',
    rowBgHover: '#eef2ff',
    rowBgExp:   '#f0f4ff',
    accent:     '#4f46e5',
    accentLight:'#e0e7ff',
    border:     '#c7d2fe',
    tabActive:  '#4f46e5',
    tabBg:      '#eef2ff',
    headerBg:   'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    icon:       <Building2 size={18} />,
    label:      'Organisationnels',
  },
  Personnes: {
    bg:         '#f0fdf4',
    rowBg:      '#f8fffe',
    rowBgHover: '#ecfdf5',
    rowBgExp:   '#f0fdf4',
    accent:     '#059669',
    accentLight:'#d1fae5',
    border:     '#a7f3d0',
    tabActive:  '#059669',
    tabBg:      '#ecfdf5',
    headerBg:   'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    icon:       <Users size={18} />,
    label:      'Liés aux personnes',
  },
  Physique: {
    bg:         '#fff7ed',
    rowBg:      '#fffdf8',
    rowBgHover: '#fff3e0',
    rowBgExp:   '#fff7ed',
    accent:     '#ea580c',
    accentLight:'#ffedd5',
    border:     '#fed7aa',
    tabActive:  '#ea580c',
    tabBg:      '#fff7ed',
    headerBg:   'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    icon:       <Lock size={18} />,
    label:      'Physiques',
  },
  Technologique: {
    bg:         '#fdf4ff',
    rowBg:      '#fefbff',
    rowBgHover: '#fae8ff',
    rowBgExp:   '#fdf4ff',
    accent:     '#9333ea',
    accentLight:'#f3e8ff',
    border:     '#e9d5ff',
    tabActive:  '#9333ea',
    tabBg:      '#fdf4ff',
    headerBg:   'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
    icon:       <Cpu size={18} />,
    label:      'Technologiques',
  },
};

const DOMAINES = [
  { key: 'Organisationnel', label: 'Organisationnels'   },
  { key: 'Personnes',       label: 'Liés aux personnes' },
  { key: 'Physique',        label: 'Physiques'          },
  { key: 'Technologique',   label: 'Technologiques'     },
];

/* ─── STATUTS ─────────────────────────────────────────────────────────────── */
const STATUTS = [
  { key:'NonEvalue', label:'Non évalué', color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb', icon:<MinusCircle size={18}/>, iconBig:<MinusCircle size={28}/> },
  { key:'Conforme',  label:'Conforme',   color:'#059669', bg:'#f0fdf4', border:'#bbf7d0', icon:<CheckCircle2 size={18}/>, iconBig:<CheckCircle2 size={28}/> },
  { key:'Remarque',  label:'Remarque',   color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe', icon:<AlertCircle size={18}/>,  iconBig:<AlertCircle size={28}/> },
  { key:'NCMineure', label:'NC Mineure', color:'#d97706', bg:'#fffbeb', border:'#fde68a', icon:<AlertTriangle size={18}/>,iconBig:<AlertTriangle size={28}/> },
  { key:'NCMajeure', label:'NC Majeure', color:'#dc2626', bg:'#fef2f2', border:'#fecaca', icon:<Ban size={18}/>,          iconBig:<Ban size={28}/> },
];

function normalize(c) {
  if (!c) return c;
  return {
    id:                        c.Id    ?? c.id,
    code:                      c.Code  ?? c.code,
    titre:                     c.Titre ?? c.titre,
    description:               c.Description               ?? c.description,
    domaine:                   c.Domaine                   ?? c.domaine,
    applicable:                c.Applicable                ?? c.applicable,
    justificationApplicabilite:c.JustificationApplicabilite?? c.justificationApplicabilite,
    statut:                    c.Statut                    ?? c.statut,
    preuves:                   c.Preuves                   ?? c.preuves,
    responsable:               c.Responsable               ?? c.responsable,
    referenceDocument:         c.ReferenceDocument         ?? c.referenceDocument,
    dateMiseAJour:             c.DateMiseAJour             ?? c.dateMiseAJour,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Controles() {
  const [controles, setControles]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterCateg, setFilterCateg]   = useState('Toutes');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [activeTab, setActiveTab]       = useState('Organisationnel');
  const [expandedId, setExpandedId]     = useState(null);
  const [editingCtrl, setEditingCtrl]   = useState(null);   // contrôle en cours d'édition
  const [actionPlanCtrl, setActionPlanCtrl] = useState(null); // contrôle pour plan d'actions

  const theme = DOMAIN_THEMES[activeTab] || DOMAIN_THEMES.Organisationnel;

  useEffect(() => {
    axios.get(API)
      .then(r => setControles(r.data.map(normalize)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (updated) => {
    try {
        await axios.put(`${API}/${updated.id}`, {
            titre:                      updated.titre,
            description:                updated.description,
            domaine:                    updated.domaine,
            applicable:                 updated.applicable,
            justificationApplicabilite: updated.justificationApplicabilite,
            statut:                     updated.statut,
            preuves:                    updated.preuves,
            responsable:                updated.responsable,
            referenceDocument:          updated.referenceDocument,
            
        });
        // Mettre à jour localement
        setControles(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCtrl(null);
    } catch (err) {
        alert('Erreur lors de la mise à jour');
    }
};

  const total     = controles.length;
  const nonEvalue = controles.filter(c => c.statut === 'NonEvalue').length;
  const conforme  = controles.filter(c => c.statut === 'Conforme').length;
  const remarque  = controles.filter(c => c.statut === 'Remarque').length;
  const ncMineure = controles.filter(c => c.statut === 'NCMineure').length;
  const ncMajeure = controles.filter(c => c.statut === 'NCMajeure').length;
  const tauxConf  = total > 0 ? Math.round((conforme / total) * 100) : 0;

  const filtered = controles.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      ((c.titre?.toLowerCase() || '').includes(q) || (c.code?.toLowerCase() || '').includes(q)) &&
      (filterCateg  === 'Toutes' || c.domaine === filterCateg) &&
      (filterStatut === 'Tous'   || c.statut  === filterStatut) &&
      c.domaine === activeTab
    );
  });

  const statCards = [
    { label:'Total',      value:total,     color:'#6366f1', bg:'#eef2ff', icon:<ShieldCheck size={18}/> },
    { label:'Conforme',   value:conforme,  ...STATUTS[1] },
    { label:'Remarque',   value:remarque,  ...STATUTS[2] },
    { label:'NC Mineure', value:ncMineure, ...STATUTS[3] },
    { label:'NC Majeure', value:ncMajeure, ...STATUTS[4] },
    { label:'Non évalué', value:nonEvalue, ...STATUTS[0] },
  ];

  return (
    <div style={{
      minHeight:'100vh', background:T.bg,
      fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize:T.base, color:T.gray900,
    }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header style={{
        background:T.white, borderBottom:`1px solid ${T.gray200}`,
        padding:'20px 40px', display:'flex', alignItems:'center', gap:20,
        position:'sticky', top:0, zIndex:20,
        boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:T.xl, fontWeight:T.bold, color:T.black, margin:0, letterSpacing:'-0.02em' }}>
            Contrôles Annexe A – ISO 27001:2022
          </h1>
          <p style={{ fontSize:T.sm, color:T.gray500, margin:'4px 0 0', fontWeight:T.normal }}>
            Déclaration d'Applicabilité
          </p>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:'#f0fdf4', border:'1px solid #bbf7d0',
          borderRadius:12, padding:'12px 20px',
        }}>
          <TrendingUp size={20} color="#059669" />
          <span style={{ fontSize:T.md, fontWeight:T.bold, color:'#059669' }}>
            Conformité : {tauxConf}%
          </span>
        </div>
      </header>

      <main style={{ maxWidth:1600, margin:'0 auto', padding:'30px 40px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* ══ STAT CARDS ════════════════════════════════════════════════════════ */}
        {/* ══ STAT CARDS ══════════════════════════════════════════════════════════ */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:16 }}>
  {statCards.map(card => (
    <div key={card.label} style={{
      background: T.white,
      border: `1px solid ${T.gray200}`,
      borderRadius: 12,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{ color: card.color }}>{card.icon}</div>
        <span style={{
          fontSize: 13,
          color: T.gray500,
          fontWeight: 400,
        }}>
          {card.label}
        </span>
      </div>
      <div style={{
        fontSize: 30,
        fontWeight: 700,
        color: card.color,
        lineHeight: 1,
      }}>
        {card.value}
      </div>
    </div>
  ))}
</div>

      {/* ══ SEARCH / FILTERS ══════════════════════════════════════════════════ */}
<div style={{
  background: T.white,
  border: `1px solid ${T.gray200}`,
  borderRadius: 12,
  padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}}>
  {/* Search bar */}
  <div style={{ position:'relative' }}>
    <Search size={16} style={{
      position:'absolute', left:12, top:'50%',
      transform:'translateY(-50%)', color: T.gray400,
    }} />
    <input
      type="text"
      placeholder="Rechercher par code ou titre…"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      style={{
        width: '100%',
        paddingLeft: 38,
        paddingRight: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 14,
        border: `1px solid ${T.gray200}`,
        borderRadius: 8,
        outline: 'none',
        color: T.gray700,
        background: T.gray50,
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    />
  </div>

  {/* Filters row */}
  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
    <StyledSelect
      value={filterCateg}
      onChange={setFilterCateg}
      options={[
        { value:'Toutes', label:'Tous les domaines' },
        ...DOMAINES.map(d => ({ value: d.key, label: d.label }))
      ]}
    />
    <StyledSelect
      value={filterStatut}
      onChange={setFilterStatut}
      options={[
        { value:'Tous', label:'Tous les statuts' },
        ...STATUTS.map(s => ({ value: s.key, label: s.label }))
      ]}
    />
  </div>
</div>

        {/* ══ TABS + LISTE ══════════════════════════════════════════════════════ */}
        <div style={{
          background:T.white, border:`1px solid ${T.gray200}`,
          borderRadius:14, overflow:'hidden',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${T.gray200}`, overflowX:'auto' }}>
            {DOMAINES.map(d => {
              const dt = DOMAIN_THEMES[d.key];
              const count = controles.filter(c => c.domaine === d.key).length;
              const isActive = activeTab === d.key;
              return (
                <button key={d.key} onClick={() => setActiveTab(d.key)} style={{
                  flex:1, padding:'20px 30px',
                  fontSize:T.sm, fontWeight:T.semibold,
                  letterSpacing:'0.04em', textTransform:'uppercase',
                  cursor:'pointer', border:'none',
                  borderBottom: isActive ? `3px solid ${dt.tabActive}` : `3px solid ${dt.border}`,
                  background: isActive
                    ? dt.headerBg
                    : dt.tabBg,
                  color: isActive ? T.white : dt.tabActive,
                  transition:'all 0.18s', whiteSpace:'nowrap',
                  fontFamily:'inherit',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  opacity: isActive ? 1 : 0.82,
                }}>
                  <span style={{ color: isActive ? T.white : dt.tabActive, display:'flex', alignItems:'center' }}>{dt.icon}</span>
                  {d.label}
                  <span style={{
                    marginLeft:4,
                    background: isActive ? 'rgba(255,255,255,0.25)' : dt.accentLight,
                    color: isActive ? T.white : dt.accent,
                    borderRadius:20, padding:'2px 9px',
                    fontSize:T.xs, fontWeight:T.bold,
                    border: isActive ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${dt.border}`,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>



          {/* Rows */}
          <div style={{ background: theme.bg }}>
            {loading ? (
              <div style={{ padding:80, textAlign:'center' }}>
                <div style={{
                  display:'inline-block', width:40, height:40, borderRadius:'50%',
                  border:`4px solid ${theme.accentLight}`, borderTop:`4px solid ${theme.accent}`,
                  animation:'spin 0.8s linear infinite', marginBottom:16,
                }} />
                <p style={{ fontSize:T.md, color:T.gray400, fontWeight:T.medium }}>Récupération des données…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:60, textAlign:'center', color:T.gray400, fontSize:T.md }}>
                Aucun contrôle trouvé
              </div>
            ) : (
              filtered.map((ctrl, i) => (
                <ControleRow
                  key={ctrl.id}
                  ctrl={ctrl}
                  theme={theme}
                  expanded={expandedId === ctrl.id}
                  onToggle={() => setExpandedId(expandedId === ctrl.id ? null : ctrl.id)}
                  isLast={i === filtered.length - 1}
                  onEdit={() => setEditingCtrl({ ...ctrl })}
                  onActionPlan={() => setActionPlanCtrl(ctrl)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* ══ MODAL ÉDITION ══════════════════════════════════════════════════════ */}
      {editingCtrl && (
        <EditModal
          ctrl={editingCtrl}
          onClose={() => setEditingCtrl(null)}
          onSave={handleSave}
        />
      )}

      {/* ══ MODAL PLAN D'ACTIONS ═══════════════════════════════════════════════ */}
      {actionPlanCtrl && (
        <ActionPlanModal
          ctrl={actionPlanCtrl}
          onClose={() => setActionPlanCtrl(null)}
        />
      )}
    </div>
  );
}

/* ─── SELECT ──────────────────────────────────────────────────────────────── */
function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: T.gray700,
        border: `1px solid ${T.gray200}`,
        borderRadius: 8,
        padding: '8px 16px',
        background: T.gray50,
        outline: 'none',
        cursor: 'pointer',
        minWidth: 180,
        fontFamily: 'inherit',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ─── CONTROLE ROW ────────────────────────────────────────────────────────── */
function ControleRow({ ctrl, theme, expanded, onToggle, isLast, onEdit, onActionPlan }) {
  const statut = STATUTS.find(s => s.key === ctrl.statut) || STATUTS[0];
  const isNC = ctrl.statut === 'NCMineure' || ctrl.statut === 'NCMajeure';
  const risques = ctrl.risquesAssocies
    ? ctrl.risquesAssocies.split(',').map(r => r.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${theme.border}` }}>

      {/* ── Row header ── */}
      <div
        onClick={onToggle}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = theme.rowBgHover; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = theme.rowBg; }}
        style={{
          display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          padding:'22px 32px', cursor:'pointer',
          background: expanded ? theme.rowBgExp : theme.rowBg,
          transition:'background 0.15s',
          borderLeft: `4px solid ${expanded ? theme.accent : 'transparent'}`,
        }}
      >
        {/* Left */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:16, flex:1, minWidth:0 }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:statut.bg, border:`1.5px solid ${statut.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:statut.color, marginTop:2,
          }}>
            {statut.icon}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:T.md, fontWeight:T.semibold, color:T.black, lineHeight:1.4 }}>
              {ctrl.code} – {ctrl.titre}
            </div>
            <div style={{ fontSize:T.sm, color:T.gray500, marginTop:5, lineHeight:1.6 }}>
              {ctrl.description}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:28, flexShrink:0 }}>
          <Pill bg={ctrl.applicable ? '#f0fdf4' : T.gray100} color={ctrl.applicable ? '#059669' : T.gray500} border={ctrl.applicable ? '#bbf7d0' : T.gray200}>
            {ctrl.applicable ? 'Applicable' : 'N/A'}
          </Pill>
          <Pill bg={statut.bg} color={statut.color} border={statut.border}>
            {statut.label}
          </Pill>

          {/* Plan d'actions — affiché seulement si NC */}
          {isNC && (
            <button
              onClick={e => { e.stopPropagation(); onActionPlan(); }}
              title="Plan d'actions"
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:8,
                border:`1px solid ${statut.border}`,
                background:statut.bg, color:statut.color,
                cursor:'pointer', fontSize:T.sm, fontWeight:T.semibold,
                fontFamily:'inherit', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}
            >
              <ClipboardList size={16} />
              Plan d'actions
            </button>
          )}

          {/* Edit */}
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            title="Modifier"
            onMouseEnter={e => { e.currentTarget.style.background = theme.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:34, height:34, borderRadius:8,
              border:'none', background:'transparent',
              color:theme.accent, cursor:'pointer',
              transition:'all 0.15s',
            }}
          >
            <Pencil size={18} />
          </button>

          <div style={{ marginLeft:2 }}>
            {expanded
              ? <ChevronUp size={22} color={theme.accent} />
              : <ChevronDown size={22} color={T.gray400} />}
          </div>
        </div>
      </div>

     {/* ── Expanded detail ── */}
{expanded && (
  <div style={{
    borderTop:`1px solid ${theme.border}`,
    padding:'26px 32px 32px',
    background:T.white,
    borderLeft:`4px solid ${theme.accent}`,
  }}>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
      <FieldBlock label="Justification d'applicabilité" value={ctrl.justificationApplicabilite} accent={theme.accent} />
      <FieldBlock label="Preuves d'implémentation" value={ctrl.preuves} accent={theme.accent} />
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, marginBottom:24 }}>
      <MetaField label="Responsable" value={ctrl.responsable} />
      <MetaField label="Dernière revue" value={
        ctrl.dateMiseAJour
          ? new Date(ctrl.dateMiseAJour).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })
          : undefined
      } />
      <MetaField label="Référence document" value={ctrl.referenceDocument} />
    </div>
  </div>
)}
    </div>
  );
}

/* ─── EDIT MODAL ─────────────────────────────────────────────────────────── */
function EditModal({ ctrl, onClose, onSave }) {
  const [form, setForm] = useState({ ...ctrl });
  const theme = DOMAIN_THEMES[form.domaine] || DOMAIN_THEMES.Organisationnel;

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:T.white, borderRadius:18,
        width:'100%', maxWidth:720,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.2)',
        display:'flex', flexDirection:'column',
      }}>
        {/* Modal header */}
        <div style={{
          background:theme.headerBg, padding:'24px 32px',
          borderRadius:'18px 18px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          position:'sticky', top:0, zIndex:10,
        }}>
          <div>
            <div style={{ fontSize:T.xs, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
              Modification du contrôle
            </div>
            <div style={{ fontSize:T.xl, fontWeight:T.bold, color:T.white }}>
              {form.code}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.15)', border:'none',
            borderRadius:10, padding:8, cursor:'pointer',
            color:T.white, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:22 }}>

          {/* Titre */}
          <FormField label="Titre">
            <input value={form.titre || ''} onChange={e => set('titre', e.target.value)}
              style={inputStyle} />
          </FormField>

          {/* Description */}
          <FormField label="Description">
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              rows={3} style={{ ...inputStyle, resize:'vertical' }} />
          </FormField>

          {/* Statut + Applicable */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <FormField label="Statut">
              <select value={form.statut || 'NonEvalue'} onChange={e => set('statut', e.target.value)}
                style={inputStyle}>
                {STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </FormField>
            <FormField label="Applicable">
              <select value={form.applicable ? 'true' : 'false'} onChange={e => set('applicable', e.target.value === 'true')}
                style={inputStyle}>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </FormField>
          </div>

          {/* Domaine */}
          <FormField label="Domaine">
            <select value={form.domaine || 'Organisationnel'} onChange={e => set('domaine', e.target.value)}
              style={inputStyle}>
              {DOMAINES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </FormField>

          {/* Justification */}
          <FormField label="Justification d'applicabilité">
            <textarea value={form.justificationApplicabilite || ''} onChange={e => set('justificationApplicabilite', e.target.value)}
              rows={3} style={{ ...inputStyle, resize:'vertical' }} />
          </FormField>

          {/* Preuves */}
          <FormField label="Preuves d'implémentation">
            <textarea value={form.preuves || ''} onChange={e => set('preuves', e.target.value)}
              rows={3} style={{ ...inputStyle, resize:'vertical' }}
              placeholder="Ex: Politique_MDP_v2.pdf, Rapport_audit_2025.pdf…" />
          </FormField>

          {/* Responsable + Référence */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <FormField label="Responsable">
              <input value={form.responsable || ''} onChange={e => set('responsable', e.target.value)}
                style={inputStyle} />
            </FormField>
            <FormField label="Référence document">
              <input value={form.referenceDocument || ''} onChange={e => set('referenceDocument', e.target.value)}
                style={inputStyle} />
            </FormField>
          </div>

          {/* Risques */}
          <FormField label="Risques associés (séparés par des virgules)">
            <input value={form.risquesAssocies || ''} onChange={e => set('risquesAssocies', e.target.value)}
              style={inputStyle} />
          </FormField>
        </div>

        {/* Footer */}
        <div style={{
          padding:'20px 32px', borderTop:`1px solid ${T.gray200}`,
          display:'flex', gap:12, justifyContent:'flex-end',
          background:T.gray50, borderRadius:'0 0 18px 18px',
          position:'sticky', bottom:0,
        }}>
          <button onClick={onClose} style={{
            padding:'12px 24px', borderRadius:10, border:`1px solid ${T.gray200}`,
            background:T.white, color:T.gray700, fontSize:T.base, fontWeight:T.medium,
            cursor:'pointer', fontFamily:'inherit',
          }}>
            Annuler
          </button>
          <button onClick={() => onSave(form)} style={{
            padding:'12px 28px', borderRadius:10, border:'none',
            background:theme.headerBg, color:T.white,
            fontSize:T.base, fontWeight:T.semibold,
            cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <Save size={18} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ACTION PLAN MODAL ──────────────────────────────────────────────────── */
function ActionPlanModal({ ctrl, onClose }) {
  const statut = STATUTS.find(s => s.key === ctrl.statut) || STATUTS[3];
  const [actions, setActions] = useState([
    { id:1, description:'', responsable:'', echeance:'', priorite:'Haute', statut:'EnCours' }
  ]);

  const addAction = () => setActions(a => [...a, {
    id: Date.now(), description:'', responsable:'', echeance:'', priorite:'Moyenne', statut:'EnCours'
  }]);

  const updateAction = (id, field, val) =>
    setActions(a => a.map(x => x.id === id ? { ...x, [field]: val } : x));

  const removeAction = (id) =>
    setActions(a => a.filter(x => x.id !== id));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:T.white, borderRadius:18,
        width:'100%', maxWidth:780,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          background: ctrl.statut === 'NCMajeure'
            ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
            : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          padding:'24px 32px', borderRadius:'18px 18px 0 0',
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          position:'sticky', top:0, zIndex:10,
        }}>
          <div>
            <div style={{ fontSize:T.xs, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
              <ClipboardList size={16} />
              Plan d'actions correctives
            </div>
            <div style={{ fontSize:T.xl, fontWeight:T.bold, color:T.white }}>{ctrl.code} – {ctrl.titre}</div>
            <div style={{ marginTop:8 }}>
              <Pill bg='rgba(255,255,255,0.15)' color={T.white} border='rgba(255,255,255,0.3)'>
                {statut.label}
              </Pill>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10,
            padding:8, cursor:'pointer', color:T.white,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* NC context */}
          <div style={{
            background: ctrl.statut === 'NCMajeure' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${ctrl.statut === 'NCMajeure' ? '#fecaca' : '#fde68a'}`,
            borderRadius:12, padding:'16px 20px',
          }}>
            <div style={{ fontSize:T.sm, fontWeight:T.bold, color: ctrl.statut === 'NCMajeure' ? '#dc2626' : '#d97706', marginBottom:6 }}>
              {ctrl.statut === 'NCMajeure' ? '⚠ Non-conformité majeure détectée' : '⚠ Non-conformité mineure détectée'}
            </div>
            <div style={{ fontSize:T.sm, color:T.gray700 }}>{ctrl.description || 'Aucune description disponible.'}</div>
          </div>

          {/* Actions list */}
          <div>
            <div style={{ fontSize:T.base, fontWeight:T.bold, color:T.black, marginBottom:14 }}>
              Actions correctives ({actions.length})
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {actions.map((action, idx) => (
                <div key={action.id} style={{
                  border:`1px solid ${T.gray200}`, borderRadius:12, padding:'18px 20px',
                  background:T.gray50, position:'relative',
                }}>
                  <div style={{ fontSize:T.sm, fontWeight:T.bold, color:T.gray400, marginBottom:12 }}>
                    Action #{idx + 1}
                  </div>
                  <button onClick={() => removeAction(action.id)} style={{
                    position:'absolute', top:14, right:14,
                    background:'transparent', border:'none', cursor:'pointer',
                    color:T.gray400, display:'flex', alignItems:'center',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.color=T.gray400}
                  >
                    <X size={16} />
                  </button>

                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <FormField label="Description de l'action">
                      <textarea
                        value={action.description}
                        onChange={e => updateAction(action.id, 'description', e.target.value)}
                        rows={2} style={{ ...inputStyle, resize:'vertical' }}
                        placeholder="Décrire l'action corrective à mettre en œuvre…"
                      />
                    </FormField>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                      <FormField label="Responsable">
                        <input value={action.responsable} onChange={e => updateAction(action.id, 'responsable', e.target.value)}
                          style={inputStyle} placeholder="Nom / équipe" />
                      </FormField>
                      <FormField label="Échéance">
                        <input type="date" value={action.echeance} onChange={e => updateAction(action.id, 'echeance', e.target.value)}
                          style={inputStyle} />
                      </FormField>
                      <FormField label="Priorité">
                        <select value={action.priorite} onChange={e => updateAction(action.id, 'priorite', e.target.value)}
                          style={inputStyle}>
                          <option>Critique</option>
                          <option>Haute</option>
                          <option>Moyenne</option>
                          <option>Basse</option>
                        </select>
                      </FormField>
                    </div>
                    <FormField label="Statut de l'action">
                      <select value={action.statut} onChange={e => updateAction(action.id, 'statut', e.target.value)}
                        style={inputStyle}>
                        <option value="EnCours">En cours</option>
                        <option value="Planifie">Planifié</option>
                        <option value="Termine">Terminé</option>
                        <option value="Annule">Annulé</option>
                      </select>
                    </FormField>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addAction} style={{
              marginTop:14, padding:'12px 20px', borderRadius:10,
              border:`2px dashed ${T.gray200}`, background:'transparent',
              color:T.gray500, fontSize:T.base, fontWeight:T.medium,
              cursor:'pointer', width:'100%', fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.gray200; e.currentTarget.style.color=T.gray500; }}
            >
              + Ajouter une action
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:'20px 32px', borderTop:`1px solid ${T.gray200}`,
          display:'flex', gap:12, justifyContent:'flex-end',
          background:T.gray50, borderRadius:'0 0 18px 18px',
          position:'sticky', bottom:0,
        }}>
          <button onClick={onClose} style={{
            padding:'12px 24px', borderRadius:10, border:`1px solid ${T.gray200}`,
            background:T.white, color:T.gray700, fontSize:T.base, fontWeight:T.medium,
            cursor:'pointer', fontFamily:'inherit',
          }}>
            Fermer
          </button>
          <button onClick={onClose} style={{
            padding:'12px 28px', borderRadius:10, border:'none',
            background: ctrl.statut === 'NCMajeure'
              ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
              : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            color:T.white, fontSize:T.base, fontWeight:T.semibold,
            cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <Save size={18} />
            Enregistrer le plan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FORM FIELD ─────────────────────────────────────────────────────────── */
function FormField({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:T.sm, fontWeight:T.semibold, color:T.gray700 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'11px 14px',
  fontSize:T.base, border:`1px solid ${T.gray200}`,
  borderRadius:8, outline:'none',
  color:T.gray700, background:T.white,
  fontFamily:'inherit', boxSizing:'border-box',
};

/* ─── PILL ───────────────────────────────────────────────────────────────── */
function Pill({ bg, color, border, children }) {
  return (
    <span style={{
      fontSize:T.sm, fontWeight:T.medium, color,
      background:bg, border:`1px solid ${border}`,
      borderRadius:8, padding:'5px 16px', whiteSpace:'nowrap',
      display:'inline-block',
    }}>
      {children}
    </span>
  );
}

/* ─── FIELD BLOCK ────────────────────────────────────────────────────────── */
function FieldBlock({ label, value, accent }) {
  const empty = !value || value.trim() === '';
  return (
    <div>
      <div style={{ fontSize:T.base, fontWeight:T.semibold, color:T.gray700, marginBottom:10 }}>
        {label}
      </div>
      <div style={{
        fontSize:T.base, color:empty ? T.gray400 : T.gray700,
        background:T.gray50, border:`1px solid ${T.gray200}`,
        borderRadius:8, padding:'14px 18px', minHeight:52, lineHeight:1.65,
      }}>
        {empty ? 'Non renseigné' : value}
      </div>
    </div>
  );
}

/* ─── META FIELD ─────────────────────────────────────────────────────────── */
function MetaField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize:T.xs, fontWeight:T.bold, color:T.gray400, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
        {label}
      </div>
      <div style={{ fontSize:T.md, fontWeight:T.medium, color:T.black }}>
        {value || '—'}
      </div>
    </div>
  );
}