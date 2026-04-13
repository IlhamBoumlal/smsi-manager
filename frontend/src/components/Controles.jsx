/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPOSANT : Controles.jsx
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * OBJECTIF :
 *   Tableau de bord d'évaluation de conformité des contrôles ISO 27001 (Annexe A)
 *   Permet d'évaluer, filtrer et visualiser l'état de conformité de 93 contrôles
 * 
 * FONCTIONNALITÉS PRINCIPALES :
 *   ✓ Affichage des KPIs (conformité globale, compteurs par statut)
 *   ✓ Filtrage par domaine (Organisationnel, Personnes, Physique, Technologique)
 *   ✓ Recherche textuelle (code + titre du contrôle)
 *   ✓ Panneau d'évaluation avec étapes guidées
 *   ✓ Support des plans d'action pour les non-conformités
 * 
 * FLUX DE DONNÉES :
 *   1. Fetch des contrôles depuis l'API
 *   2. Normalisation et tri des données
 *   3. Application des filtres et recherche
 *   4. Affichage des cartes et ouverture du panneau d'évaluation
 *   5. Sauvegarde de l'évaluation via PUT API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import PlanActionNC from './PlanActionNC';
import {
  Search, CheckCircle2, AlertCircle,
  MinusCircle, AlertTriangle, Ban, X, Save, ClipboardList,
  Building2, Users, Lock, Cpu, ShieldCheck, Upload, FileText,
  ChevronDown
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION GLOBALE
// ─────────────────────────────────────────────────────────────────────────────

const API = '/api/controles';

// ─────────────────────────────────────────────────────────────────────────────
// THÈME DE COULEURS
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  bg: '#F8F9FB',       // Fond principal
  white: '#ffffff',    // Couleur blanche
  gray900: '#111827',  // Texte principal
  gray700: '#374151',  // Texte secondaire
  gray500: '#6b7280',  // Texte tertiaire
  gray400: '#9ca3af',  // Texte désactivé
  gray200: '#e5e7eb',  // Bordures
  shadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',    // Gradient bleu
  gradGreen: 'linear-gradient(135deg, #059669, #10b981)',   // Gradient vert
  gradOrange: 'linear-gradient(135deg, #d97706, #f59e0b)', // Gradient orange
  gradRed: 'linear-gradient(135deg, #dc2626, #ef4444)',     // Gradient rouge
};

// ─────────────────────────────────────────────────────────────────────────────
// THÈMES PAR DOMAINE ISO 27001
// ─────────────────────────────────────────────────────────────────────────────
// Configuration des couleurs, icônes et styles pour chaque domaine

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

// ─────────────────────────────────────────────────────────────────────────────
// DÉFINITION DES STATUTS ET LEURS PROPRIÉTÉS
// ─────────────────────────────────────────────────────────────────────────────

const STATUTS = [
  { key: 'NonEvalue', label: 'Non évalué',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: <MinusCircle size={16} /> },
  { key: 'Conforme',  label: 'Conforme',    color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={16} /> },
  { key: 'Remarque',  label: 'Remarque',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <AlertCircle  size={16} /> },
  { key: 'NCMineure', label: 'NC Mineure',  color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: <AlertTriangle size={16} /> },
  { key: 'NCMajeure', label: 'NC Majeure',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <Ban          size={16} /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convertit une couleur hex en notation RGBA
 * @param {string} hex - Code couleur hexadécimal (ex: #FF0000)
 * @param {number} alpha - Opacité (0-1)
 * @returns {string} Couleur au format rgba
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS RÉUTILISABLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Select personnalisé avec accent coloré
 * @param {string} value - Valeur sélectionnée
 * @param {function} onChange - Callback de changement
 * @param {Array} options - Tableau des options {value, label}
 * @param {string} placeholder - Texte par défaut
 * @param {string} accentColor - Couleur d'accent au format hex
 */
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

/**
 * Badge affichant le statut de conformité d'un contrôle
 * @param {string} statut - Statut du contrôle (Conforme, NonEvalue, etc.)
 * @param {boolean} applicable - Indique si le contrôle est applicable
 */
function StatutBadge({ statut, applicable }) {
  // Si non applicable, afficher un badge spécifique
  if (applicable === false) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, padding: '3px 10px',
        borderRadius: 99, background: '#f3f4f6', color: '#6b7280',
        border: '1px solid #e5e7eb',
      }}>
        <Ban size={14} /> Non applicable
      </span>
    );
  }
  
  // Si applicable mais non évalué
  if (statut === 'NonEvalue') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, padding: '3px 10px',
        borderRadius: 99, background: '#f9fafb', color: '#6b7280',
        border: '1px solid #e5e7eb',
      }}>
        <MinusCircle size={14} /> Non évalué
      </span>
    );
  }
  
  // Chercher les propriétés du statut
  const s = STATUTS.find(x => x.key === statut);
  if (!s) return null;
  
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

/**
 * Bande de KPIs affichant les statistiques de conformité
 * @param {object} stats - Objet contenant les statistiques
 */
function KpiStrip({ stats }) {
  const kpis = [
    { label: "Conformité globale",  value: `${Math.round(stats.averageConformity)}%`, sub: `${stats.totalControles} contrôles`, bg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)", light: false },
    { label: "Contrôles conformes", value: stats.conformeCount,   sub: `${stats.nonConformeCount} non conformes`, bg: "#fff", light: true },
    { label: "NC Mineure",          value: stats.ncMineureCount,  sub: `${stats.ncMajeureCount} NC majeure`,      bg: "#fff", light: true },
    { label: "Actions en retard",   value: stats.delayedActions || 0, sub: `${stats.inProgressActions || 0} en cours`, bg: "#fff", light: true },
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
              <div style={{
                height: "100%", width: `${Math.round(stats.averageConformity)}%`,
                background: "rgba(255,255,255,.8)", borderRadius: 99,
                transition: "width 1.2s cubic-bezier(.4,0,.2,1) .3s",
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Barre de filtrage par statut
 * @param {string} active - Filtre actif (all, conforme, non-conforme, non-evalue)
 * @param {function} onChange - Callback lors du changement de filtre
 * @param {object} counts - Compteurs des contrôles par statut
 */
function FilterBar({ active, onChange, counts }) {
  const tabs = [
    { id: "all",          label: "Tous",          count: counts.all },
    { id: "non-conforme", label: "Non conformes", count: counts.nc  },
    { id: "conforme",     label: "Conformes",     count: counts.ok  },
    { id: "non-evalue",   label: "Non évalués",   count: counts.ne  },
  ];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 16px", borderRadius: 99,
          border: active === t.id ? "none" : "1.5px solid #E5E7EB",
          background: active === t.id ? "#1D4ED8" : "#fff",
          color: active === t.id ? "#fff" : "#4B5563",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all .2s", fontFamily: "'Sora', sans-serif",
          boxShadow: active === t.id ? "0 4px 12px rgba(29,78,216,.3)" : "none",
        }}>
          {t.label}
          <span style={{
            minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: active === t.id ? "rgba(255,255,255,.25)" : "#F3F4F6",
            color: active === t.id ? "#fff" : "#6B7280", padding: "0 5px",
          }}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL : Controles
// ─────────────────────────────────────────────────────────────────────────────

export default function Controles() {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  const [controles, setControles]           = useState([]); // Liste de tous les contrôles
  const [loading, setLoading]               = useState(true); // État de chargement
  const [searchTerm, setSearchTerm]         = useState(''); // Terme de recherche
  const [activeTab, setActiveTab]           = useState('all'); // Filtre par statut
  const [evaluationCtrl, setEvaluationCtrl] = useState(null); // Contrôle en cours d'évaluation
  const [filterDomain, setFilterDomain]     = useState('all'); // Filtre par domaine

  // ═══════════════════════════════════════════════════════════════════════
  // EFFETS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initialisation du composant
   * - Charger la police Google Fonts
   * - Récupérer les données des contrôles
   */
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchData();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // FONCTIONS DE RÉCUPÉRATION ET SAUVEGARDE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Récupère tous les contrôles depuis l'API
   * Normalise les données et les trie par code
   */
  const fetchData = () => {
    axiosInstance.get(API)
      .then(r => {
        const data = r.data.map(normalize);
        const sortedData = data.sort((a, b) => 
          a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
        );
        setControles(sortedData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  /**
   * Sauvegarde l'évaluation d'un contrôle
   * @param {object} updated - Objet contrôle modifié avec toutes les données
   * Envoie un PUT à l'API avec le token d'authentification
   */
  const handleSaveEvaluation = async (updated) => {
  try {
    const command = {
      Id: updated.id,
      Titre: updated.titre,
      Domaine: updated.domaine,
      Applicable: updated.applicable,
      Statut: updated.statut,
      Description: updated.description || null,
      JustificationApplicabilite: updated.justificationApplicabilite || null,
      JustificationConformite: updated.justificationConformite || null,
      Remarque: updated.remarque || null,
      Responsable: updated.responsable || null,
      
      // ⚠️ Ces champs sont CRUCIAUX pour le plan d'action
      PlanCorrectif: updated.PlanCorrectif || updated.planCorrectif || null,
      ResponsablePlan: updated.ResponsablePlan || updated.responsablePlan || null,
      DateEcheance: updated.DateEcheance || updated.dateEcheance || null,
      Preuves: updated.Preuves || updated.preuves || null,
      ActionImmediate: updated.ActionImmediate || updated.actionImmediate || null,
      ResponsableImm: updated.ResponsableImm || updated.responsableImm || null,
      DelaiActionImm: updated.DelaiActionImm || updated.delaiActionImm || null,
      CausesRacines: updated.CausesRacines || updated.causesRacines || null,
      MethodeAnalyse: updated.MethodeAnalyse || updated.methodeAnalyse || null,
      Indicateurs: updated.Indicateurs || updated.indicateurs || null,
      DateVerification: updated.DateVerification || updated.dateVerification || null,
      CommentaireCloture: updated.CommentaireCloture || updated.commentaireCloture || null,
      CloturePar: updated.CloturePar || updated.cloturePar || null,
      DateCloture: updated.DateCloture || updated.dateCloture || null,
      StatutPlan: updated.StatutPlan || updated.statutPlan || null,
      Impact: updated.Impact || updated.impact || null,
      NcDescription: updated.NcDescription || updated.ncDescription || null,
    };

    await axiosInstance.put(`${API}/${updated.id}`, command, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    await fetchData();
    setEvaluationCtrl(null);
    
  } catch (err) {
    console.error("Erreur détaillée:", {
      status: err.response?.status,
      data: err.response?.data,
    });
    
    const errorMessage = err.response?.data?.error || 
                        err.response?.data?.title || 
                        err.response?.data?.message ||
                        'Erreur inconnue';
    alert(`Erreur lors de la sauvegarde : ${errorMessage}`);
  }
};
  const totalControles   = controles.length;
  const conformeCount    = controles.filter(c => c.statut === 'Conforme').length;
  const nonConformeCount = controles.filter(c => c.statut === 'NCMineure' || c.statut === 'NCMajeure').length;
  const ncMineureCount   = controles.filter(c => c.statut === 'NCMineure').length;
  const ncMajeureCount   = controles.filter(c => c.statut === 'NCMajeure').length;
  const nonEvalueCount   = controles.filter(c => c.statut === 'NonEvalue').length;
  const averageConformity = totalControles > 0
    ? Math.round((conformeCount / ((totalControles - nonEvalueCount) || 1)) * 100)
    : 0;

  const stats = {
    totalControles, averageConformity, conformeCount, nonConformeCount,
    ncMineureCount, ncMajeureCount, nonEvalueCount,
    delayedActions: 0, inProgressActions: 0,
  };

  const filtered = controles.filter(c => {
    const matchesSearch =
      (c.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (c.code?.toLowerCase()  || '').includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterDomain !== 'all' && c.domaine !== filterDomain) return false;
    if (activeTab === 'conforme')     return c.statut === 'Conforme';
    if (activeTab === 'non-conforme') return c.statut === 'NCMineure' || c.statut === 'NCMajeure';
    if (activeTab === 'non-evalue')   return c.statut === 'NonEvalue';
    return true;
  });

  const counts = { all: controles.length, nc: nonConformeCount, ok: conformeCount, ne: nonEvalueCount };

  const domainStats = Object.keys(DOMAIN_THEMES).map(domain => ({
    domain, ...DOMAIN_THEMES[domain],
    total: controles.filter(c => c.domaine === domain).length,
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 36px 60px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.8px' }}>
            Contrôles ISO 27001 — Annexe A
          </h1>
          <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>
            Évaluation de conformité des contrôles de sécurité
          </p>
        </div>

        <KpiStrip stats={stats} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterDomain('all')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99,
            border: filterDomain === 'all' ? 'none' : '1.5px solid #E5E7EB',
            background: filterDomain === 'all' ? '#1D4ED8' : '#fff',
            color: filterDomain === 'all' ? '#fff' : '#4B5563',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: T.font,
            boxShadow: filterDomain === 'all' ? '0 4px 12px rgba(29,78,216,.3)' : 'none',
          }}>
            Tous les domaines
            <span style={{
              minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: filterDomain === 'all' ? 'rgba(255,255,255,.25)' : '#F3F4F6',
              color: filterDomain === 'all' ? '#fff' : '#6B7280', padding: '0 5px',
            }}>{totalControles}</span>
          </button>
          {domainStats.map(ds => (
            <button key={ds.domain} onClick={() => setFilterDomain(ds.domain)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99,
              border: filterDomain === ds.domain ? 'none' : '1.5px solid #E5E7EB',
              background: filterDomain === ds.domain ? ds.tabActive : '#fff',
              color: filterDomain === ds.domain ? '#fff' : ds.accent,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: T.font,
              boxShadow: filterDomain === ds.domain ? '0 4px 12px rgba(0,0,0,.2)' : 'none',
            }}>
              {ds.icon} {ds.label}
              <span style={{
                minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: filterDomain === ds.domain ? 'rgba(255,255,255,.25)' : ds.accentLight,
                color: filterDomain === ds.domain ? '#fff' : ds.accent, padding: '0 5px',
              }}>{ds.total}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
            <input
              type="text"
              placeholder="Rechercher un contrôle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 40px', fontSize: 14,
                border: '1.5px solid #E5E7EB', borderRadius: 12,
                outline: 'none', fontFamily: T.font, background: '#fff', transition: 'all 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#1D4ED8'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <FilterBar active={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>Chargement des contrôles...</div>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>Aucun contrôle trouvé</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Essayez un autre filtre ou recherche</div>
            </div>
          )}
          {!loading && filtered.map((ctrl, index) => (
            <div key={ctrl.id} style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)',
              transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s',
              animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${index * 60}ms both`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)'; }}
            >
              <div style={{
                height: 4,
                background: !ctrl.applicable ? 'linear-gradient(90deg,#9CA3AF,#D1D5DB)'
                  : ctrl.statut === 'Conforme' ? 'linear-gradient(90deg,#10B981,#34D399)'
                  : ctrl.statut === 'Remarque' ? 'linear-gradient(90deg,#2563EB,#3B82F6)'
                  : ctrl.statut === 'NonEvalue' ? 'linear-gradient(90deg,#E5E7EB,#D1D5DB)'
                  : 'linear-gradient(90deg,#EF4444,#F87171)',
              }} />
              <div style={{ padding: '20px 22px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: DOMAIN_THEMES[ctrl.domaine]?.headerBg || T.gradBlue,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(30,58,138,.3)',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{ctrl.code}</span>
                    </div>
                    <div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase',
                        color: DOMAIN_THEMES[ctrl.domaine]?.accent || '#1D4ED8',
                        background: DOMAIN_THEMES[ctrl.domaine]?.accentLight || '#EEF2FF',
                        padding: '2px 7px', borderRadius: 99, marginBottom: 4,
                      }}>
                        {DOMAIN_THEMES[ctrl.domaine]?.icon} {DOMAIN_THEMES[ctrl.domaine]?.label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.25, fontFamily: "'Sora', sans-serif", letterSpacing: '-.2px' }}>
                        {ctrl.titre}
                      </div>
                    </div>
                  </div>
                  <StatutBadge statut={ctrl.statut} applicable={ctrl.applicable} />
                </div>

                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>{ctrl.description}</p>

                {ctrl.statut === 'Conforme' && ctrl.justificationConformite && (
                  <div style={{ marginBottom: 16, padding: 12, background: '#F0FDF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Justification de conformité</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{ctrl.justificationConformite}</p>
                  </div>
                )}

                {(ctrl.statut === 'NCMineure' || ctrl.statut === 'NCMajeure') && ctrl.planCorrectif && (
                  <div style={{ marginBottom: 16, padding: 12, background: '#FEF2F2', borderRadius: 10, borderLeft: '4px solid #EF4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ClipboardList size={14} color="#EF4444" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Plan d'action en cours</span>
                      {ctrl.responsable && <span style={{ fontSize: 11, color: '#9CA3AF' }}>— {ctrl.responsable}</span>}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setEvaluationCtrl(ctrl)}
                  style={{
                    width: '100%', 
                    marginTop: 12, 
                    padding: '12px 20px', 
                    borderRadius: 10, 
                    border: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? '1.5px solid #1D4ED8' : 'none',
                    background: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') 
                      ? '#fff' 
                      : 'linear-gradient(135deg,#1D4ED8,#1E40AF)', 
                    color: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? '#1D4ED8' : '#fff',
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    fontFamily: T.font,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.9';
                    if(ctrl.applicable === false || ctrl.statut !== 'NonEvalue') {
                      e.currentTarget.style.background = '#F0F7FF';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1';
                    if(ctrl.applicable === false || ctrl.statut !== 'NonEvalue') {
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  {(ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? (
                    <>
                      <FileText size={16} /> Modifier l'évaluation
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Évaluer le contrôle
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════
   PANNEAU D'ÉVALUATION - VERSION CORRIGÉE
═══════════════════════════════════════════════════════════════════════ */
function EvaluationPanel({ ctrl, onClose, onSave, theme }) {
  // Initialiser le formulaire avec TOUTES les données du contrôle
  const [form, setForm] = useState(() => {
    // S'assurer que tous les champs du plan d'action sont présents
    return {
      ...ctrl,
      // Champs du plan d'action avec leurs valeurs existantes
      NcDescription: ctrl.ncDescription || ctrl.NcDescription || '',
      Impact: ctrl.impact || ctrl.Impact || '',
      ActionImmediate: ctrl.actionImmediate || ctrl.ActionImmediate || '',
      ResponsableImm: ctrl.responsableImm || ctrl.ResponsableImm || '',
      DelaiActionImm: ctrl.delaiActionImm || ctrl.DelaiActionImm || '',
      CausesRacines: ctrl.causesRacines || ctrl.CausesRacines || '',
      MethodeAnalyse: ctrl.methodeAnalyse || ctrl.MethodeAnalyse || '5-pourquoi',
      PlanCorrectif: ctrl.planCorrectif || ctrl.PlanCorrectif || '',
      ResponsablePlan: ctrl.responsablePlan || ctrl.ResponsablePlan || '',
      DateEcheance: ctrl.dateEcheance || ctrl.DateEcheance || '',
      Preuves: ctrl.preuves || ctrl.Preuves || '',
      Indicateurs: ctrl.indicateurs || ctrl.Indicateurs || '',
      DateVerification: ctrl.dateVerification || ctrl.DateVerification || '',
      CommentaireCloture: ctrl.commentaireCloture || ctrl.CommentaireCloture || '',
      CloturePar: ctrl.cloturePar || ctrl.CloturePar || '',
      DateCloture: ctrl.dateCloture || ctrl.DateCloture || '',
      StatutPlan: ctrl.statutPlan || ctrl.StatutPlan || 'En cours',
    };
  });
  
  const [filesStep2, setFilesStep2] = useState([]);
  const [filesStep4, setFilesStep4] = useState([]);
  const [showPlan, setShowPlan] = useState(!!(ctrl.planCorrectif || ctrl.PlanCorrectif)); 
  const [filesNA, setFilesNA] = useState([]);

  const isApplicable     = form.applicable === true;
  const isNotApplicable  = form.applicable === false;
  const showStep2        = isApplicable;
  const showStepNA = isNotApplicable;
  const showStep3        = isApplicable && ((form.justificationApplicabilite?.trim().length ?? 0) > 5 || filesStep2.length > 0);
  const isStatusSelected = form.statut && form.statut !== 'NonEvalue';
  const isNC             = form.statut === 'NCMineure' || form.statut === 'NCMajeure';

  const handleFilesNA = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name }));
      setFilesNA(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFileNA = (index) => {
    setFilesNA(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplicableChange = (val) => {
    setShowPlan(false);
    setFilesNA([]);
    setFilesStep2([]);
    setFilesStep4([]);
    
    if (val === 'oui') {
      setForm(f => ({ 
        ...f, 
        applicable: true,
        statut: f.statut !== 'NonEvalue' ? f.statut : 'NonEvalue'
      }));
    } else if (val === 'non') {
      setForm(f => ({
        ...f, 
        applicable: false, 
        statut: 'NonEvalue',
        justificationApplicabilite: f.justificationApplicabilite || '',
        justificationConformite: null,
        remarque: null,
        NcDescription: null,
        Impact: null,
        ActionImmediate: null,
        ResponsableImm: null,
        DelaiActionImm: null,
        CausesRacines: null,
        MethodeAnalyse: null,
        PlanCorrectif: null,
        ResponsablePlan: null,
        DateEcheance: null,
        Preuves: null,
        Indicateurs: null,
        DateVerification: null,
        CommentaireCloture: null,
        CloturePar: null,
        DateCloture: null,
        StatutPlan: null,
      }));
    } else {
      setForm(f => ({ ...f, applicable: null }));
    }
  };

  const canSave = 
    (isNotApplicable && (filesNA.length > 0 || (form.justificationApplicabilite?.trim().length ?? 0) > 0)) ||
    (isApplicable && isStatusSelected && (
      (form.statut === 'Conforme' && (
        (form.justificationConformite?.trim().length ?? 0) > 0 || filesStep4.length > 0
      )) ||
      (form.statut === 'Remarque' && (
        (form.remarque?.trim().length ?? 0) > 0 || filesStep4.length > 0
      )) ||
      isNC
    ));

  const handleStatutChange = (val) => {
    setShowPlan(false);
    setFilesStep4([]);
    setForm(f => ({ ...f, statut: val || 'NonEvalue' }));
  };

  const handleFileStep2 = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesStep2([{ name: e.target.files[0].name }]);
    }
    e.target.value = '';
  };

  const handleFilesStep4 = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name }));
      setFilesStep4(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFileStep4 = (index) => {
    setFilesStep4(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', width: 620, background: '#fff', height: '100vh',
        display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)',
        fontFamily: T.font,
      }}>
        <div style={{ background: theme?.headerBg || T.gradBlue, padding: '28px 30px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: T.font }}>{form.code} — Évaluation</h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 30, display: 'flex', flexDirection: 'column', gap: 30 }}>
          {/* ÉTAPE 1 */}
          <Section num="1" title="Applicabilité du contrôle">
            <StyledSelect
              value={form.applicable === true ? 'oui' : form.applicable === false ? 'non' : ''}
              onChange={handleApplicableChange}
              placeholder="Sélectionner..."
              options={[
                { value: 'oui', label: 'Applicable' },
                { value: 'non', label: 'Non Applicable' },
              ]}
              accentColor={isApplicable ? '#059669' : isNotApplicable ? '#dc2626' : null}
            />
          </Section>
          
          {/* ÉTAPE NA — Justification de non-applicabilité */}
          {showStepNA && (
            <Section num="2" title="Justification de non-applicabilité" animate
              accentBg="#fef2f2" accentBorder="#fecaca" accentColor="#dc2626">
              <textarea
                rows={3}
                style={inputStyle}
                placeholder="Pourquoi ce contrôle ne s'applique-t-il pas ? (optionnel)"
                value={form.justificationApplicabilite || ''}
                onChange={e => setForm(f => ({ ...f, justificationApplicabilite: e.target.value }))}
              />
              <label style={{ ...uploadAreaStyle, borderColor: '#fecaca', background: '#fef2f2' }}>
                <Upload size={16} color="#dc2626" />
                <span style={{ color: '#dc2626' }}>Joindre des documents justificatifs</span>
                <input
                  type="file" multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={handleFilesNA}
                />
              </label>
              {filesNA.map((f, i) => (
                <div key={i} style={{ ...fileChipStyle, background: '#FEE2E2', color: '#DC2626', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={13} /> {f.name}
                  </span>
                  <X size={13} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => removeFileNA(i)} />
                </div>
              ))}
            </Section>
          )}

          {/* ÉTAPE 2 */}
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
                <Upload size={16} />
                <span>Joindre une preuve d'applicabilité</span>
                <input type="file" style={{ display: 'none' }} onChange={handleFileStep2} />
              </label>
              {filesStep2.map((f, i) => (
                <div key={i} style={fileChipStyle}>
                  <FileText size={13} /> {f.name}
                </div>
              ))}
            </Section>
          )}

          {/* ÉTAPE 3 */}
          {showStep3 && (
            <Section num="3" title="État de conformité" animate>
              <StyledSelect
                value={isStatusSelected ? form.statut : ''}
                onChange={handleStatutChange}
                placeholder="Sélectionner l'état..."
                options={STATUTS.filter(s => s.key !== 'NonEvalue').map(s => ({ value: s.key, label: s.label }))}
                accentColor={isStatusSelected ? STATUTS.find(s => s.key === form.statut)?.color : null}
              />
            </Section>
          )}

          {/* ÉTAPE 4 */}
          {isStatusSelected && isApplicable && (
            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
              {/* CONFORME */}
              {form.statut === 'Conforme' && (
                <Section num="4" title="Justification de conformité" accentBg="#f0fdf4" accentBorder="#bbf7d0" accentColor="#059669">
                  <textarea
                    rows={4}
                    style={inputStyle}
                    placeholder="Démontrez comment le contrôle est respecté... (optionnel si fichier joint)"
                    value={form.justificationConformite || ''}
                    onChange={e => setForm(f => ({ ...f, justificationConformite: e.target.value }))}
                  />
                  <label style={{ ...uploadAreaStyle, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                    <Upload size={16} color="#059669" />
                    <span style={{ color: '#059669' }}>Joindre des preuves (PDF, Word, Excel, images...)</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={handleFilesStep4}
                    />
                  </label>
                  {filesStep4.map((f, i) => (
                    <div key={i} style={{ ...fileChipStyle, background: '#DCFCE7', color: '#15803D', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} /> {f.name}
                      </span>
                      <X size={13} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => removeFileStep4(i)} />
                    </div>
                  ))}
                </Section>
              )}

              {/* REMARQUE */}
              {form.statut === 'Remarque' && (
                <Section num="4" title="Détail de la remarque" accentBg="#eff6ff" accentBorder="#bfdbfe" accentColor="#2563eb">
                  <textarea
                    rows={4}
                    style={inputStyle}
                    placeholder="Saisissez l'observation... (optionnel si fichier joint)"
                    value={form.remarque || ''}
                    onChange={e => setForm(f => ({ ...f, remarque: e.target.value }))}
                  />
                  <label style={{ ...uploadAreaStyle, borderColor: '#bfdbfe', background: '#eff6ff' }}>
                    <Upload size={16} color="#2563eb" />
                    <span style={{ color: '#2563eb' }}>Joindre des documents (PDF, Word, Excel, images...)</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={handleFilesStep4}
                    />
                  </label>
                  {filesStep4.map((f, i) => (
                    <div key={i} style={{ ...fileChipStyle, background: '#DBEAFE', color: '#1D4ED8', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} /> {f.name}
                      </span>
                      <X size={13} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => removeFileStep4(i)} />
                    </div>
                  ))}
                </Section>
              )}

              {/* NC */}
              {isNC && !showPlan && (
                <div style={{ textAlign: 'center', padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px dashed #ef4444' }}>
                  <p style={{ fontSize: 13, color: '#991b1b', marginBottom: 15, fontWeight: 700 }}>
                    Un plan d'action est recommandé pour ce statut de Non-Conformité.
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
                  onChange={(planData) => {
                    console.log('PlanActionNC onChange received:', planData); // Debug
                    setForm(prev => ({ ...prev, ...planData }));
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={btnSecondary}>Annuler</button>
          <button
            onClick={() => {
              console.log('Saving form data:', form); // Debug
              onSave(form);
            }}
            disabled={!canSave}
            style={{
              ...btnPrimary,
              background: canSave ? T.gradBlue : T.gray200,
              cursor: canSave ? 'pointer' : 'not-allowed',
              color: canSave ? '#fff' : T.gray400,
            }}
          >
            <Save size={16} /> Enregistrer l'évaluation
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, children, animate, accentBg, accentBorder, accentColor }) {
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
          background: accentColor || '#1D4ED8', color: '#fff',
          fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontFamily: T.font,
        }}>{num}</span>
        <label style={{ fontSize: 14, fontWeight: 800, color: accentColor || T.gray900, fontFamily: T.font }}>{title}</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

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
  marginTop: 10, fontFamily: T.font,
};

const fileChipStyle = {
  marginTop: 7, fontSize: 12, background: '#EFF6FF', color: '#1D4ED8',
  padding: '7px 12px', borderRadius: 8, display: 'flex', alignItems: 'center',
  gap: 7, fontWeight: 600, fontFamily: T.font,
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

function normalize(c) {
  const formatDate = (d) => {
    if (!d) return null;
    if (typeof d === 'string') {
      if (d.includes('T')) return d.split('T')[0];
      return d;
    }
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return d;
  };

  let applicableValue = null;
  if (c.applicable !== undefined) {
    applicableValue = c.applicable;
  } else if (c.Applicable !== undefined) {
    applicableValue = c.Applicable;
  }

  let statutValue = 'NonEvalue';
  if (c.statut) {
    statutValue = c.statut;
  } else if (c.Statut) {
    statutValue = c.Statut;
  }

  // IMPORTANT: Ne pas modifier le statut pour les contrôles non applicables
  // Le statut reste "NonEvalue" dans la BD, mais l'affichage sera géré par le badge
  
  return {
    id: c.id || c.Id,
    code: c.code || c.Code,
    titre: c.titre || c.Titre,
    description: c.description || c.Description,
    domaine: c.domaine || c.Domaine,
    applicable: applicableValue,
    statut: statutValue,
    responsable: c.responsable || c.Responsable || null,
    
    justificationApplicabilite: c.justificationApplicabilite || c.JustificationApplicabilite || null,
    justificationConformite: c.justificationConformite || c.JustificationConformite || null,
    remarque: c.remarque || c.Remarque || null,
    
    planCorrectif: c.planCorrectif || c.PlanCorrectif || null,
    responsablePlan: c.responsablePlan || c.ResponsablePlan || null,
    actionImmediate: c.actionImmediate || c.ActionImmediate || null,
    responsableImm: c.responsableImm || c.ResponsableImm || null,
    delaiActionImm: formatDate(c.delaiActionImm || c.DelaiActionImm),
    causesRacines: c.causesRacines || c.CausesRacines || null,
    methodeAnalyse: c.methodeAnalyse || c.MethodeAnalyse || null,
    preuves: c.preuves || c.Preuves || c.verification || c.Verification || null,
    indicateurs: c.indicateurs || c.Indicateurs || null,
    dateEcheance: formatDate(c.dateEcheance || c.DateEcheance),
    dateVerification: formatDate(c.dateVerification || c.DateVerification),
    commentaireCloture: c.commentaireCloture || c.CommentaireCloture || null,
    cloturePar: c.cloturePar || c.CloturePar || null,
    dateCloture: formatDate(c.dateCloture || c.DateCloture),
    statutPlan: c.statutPlan || c.StatutPlan || null,
    impact: c.impact || c.Impact || null,
    ncDescription: c.ncDescription || c.NcDescription || null,
  };
}
