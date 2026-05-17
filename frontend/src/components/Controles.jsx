import React, { useState, useEffect, useCallback } from 'react';
import PlanActionModal from './PlanActionModal';
import {
  Search, CheckCircle2, AlertCircle,
  MinusCircle, AlertTriangle, Ban, X, Save, ClipboardList,
  Building2, Users, Lock, Cpu, ShieldCheck, Upload, FileText,
  ChevronDown, History, ChevronRight, ChevronUp, Clock, User,
  ArrowRight, Eye, Paperclip, Download
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const API = 'http://localhost:5006/api/controles';

// ─────────────────────────────────────────────────────────────────────────────
// THÈME
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const RAISONS_APPLICABILITE = [
  { key: 'attenuation',         label: 'Atténuation',         description: "Réduction d'un risque identifié" },
  { key: 'legale',              label: 'Légale',              description: 'Exigence légale ou réglementaire' },
  { key: 'reconnue',            label: 'Reconnue',            description: 'Bonne pratique reconnue du secteur' },
  { key: 'contractuelle',       label: 'Contractuelle',       description: 'Obligation contractuelle client/partenaire' },
  { key: 'necessite_technique', label: 'Nécessité technique', description: 'Contrainte ou besoin technique' },
];

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

const CHAMP_LABELS = {
  Applicable:              'Applicabilité',
  Statut:                  'Statut',
  RaisonsApplicabilite:    "Raisons d'applicabilité",
  RaisonExclusion:         "Raison d'exclusion",
  JustificationConformite: 'Justification de conformité',
  Remarque:                'Remarque',
  Preuves:                 'Preuves',
  Priorite:                'Priorité',
  StatutPlan:              'Statut du plan',
  ResponsablePlan:         'Responsable du plan',
  DateEcheance:            "Date d'échéance",
  Steps:                   "Étapes du plan d'action",
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.includes('T') ? d.split('T')[0] : d;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return d;
}

function parseJsonSafe(json) {
  if (!json) return null;
  if (typeof json === 'object') return json;
  try { return JSON.parse(json); } catch { return null; }
}

function humanizeChamps(champsStr) {
  if (!champsStr) return '';
  return champsStr
    .split(', ')
    .map(c => CHAMP_LABELS[c] || c)
    .join(' · ');
}

function parsePreuves(preuves) {
  console.log('[parsePreuves] Input:', preuves, typeof preuves);
  if (!preuves) {
    console.log('[parsePreuves] Aucune preuve, retour []');
    return [];
  }
  if (Array.isArray(preuves)) {
    console.log('[parsePreuves] Déjà un tableau, longueur:', preuves.length);
    return preuves;
  }
  if (typeof preuves === 'string') {
    try {
      const parsed = JSON.parse(preuves);
      const arr = Array.isArray(parsed) ? parsed : [];
      console.log('[parsePreuves] String JSON parsée, longueur:', arr.length);
      return arr;
    } catch (e) {
      console.error('[parsePreuves] Erreur parsing JSON', e);
      return [];
    }
  }
  console.log('[parsePreuves] Type non géré, retour []');
  return [];
}

function openPreuve(doc) {
  if (!doc || !doc.data) {
    console.warn("Document invalide", doc);
    return;
  }
  const ext = doc.name.split('.').pop().toLowerCase();
  const map = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
  const mime = map[ext] || 'application/octet-stream';
  const bytes = atob(doc.data);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const blob = new Blob([buffer], { type: mime });
  const url = URL.createObjectURL(blob);

  const isImage = ['png','jpg','jpeg','gif','webp'].includes(ext);
  const isPdf   = ext === 'pdf';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${doc.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #F1F5F9; min-height: 100vh; }
    .topbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 999;
      background: #0F172A; color: #fff; padding: 0 24px;
      height: 54px; display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .topbar-icon { width: 32px; height: 32px; background: #1D4ED8; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .topbar-name { font-size: 14px; font-weight: 600; color: #F8FAFC; max-width: 500px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .topbar-ext { font-size: 11px; color: #94A3B8; background: #1E293B;
      padding: 2px 8px; border-radius: 99px; font-weight: 600; text-transform: uppercase; }
    .btn-dl {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 18px; background: #1D4ED8; color: #fff;
      border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
      cursor: pointer; text-decoration: none; transition: background 0.2s;
    }
    .btn-dl:hover { background: #1E40AF; }
    .content { padding-top: 70px; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; }
    iframe { width: 100%; height: calc(100vh - 54px); border: none; display: block; }
    .img-wrap { padding: 24px; display: flex; align-items: flex-start; justify-content: center; min-height: calc(100vh - 54px); }
    .img-wrap img { max-width: 100%; max-height: calc(100vh - 120px); border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.2); background: #fff; }
    .other-wrap { padding: 60px 24px; text-align: center; color: #64748B; }
    .other-wrap .icon { font-size: 56px; margin-bottom: 16px; }
    .other-wrap p { font-size: 15px; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-icon">${isImage ? '🖼' : isPdf ? '📄' : '📎'}</div>
      <span class="topbar-name">${doc.name}</span>
      <span class="topbar-ext">${ext}</span>
    </div>
    <a class="btn-dl" href="${url}" download="${doc.name}">
      ⬇ Télécharger
    </a>
  </div>
  ${isPdf
    ? `<iframe src="${url}#toolbar=1&navpanes=0" title="${doc.name}"></iframe>`
    : isImage
      ? `<div class="img-wrap"><img src="${url}" alt="${doc.name}" /></div>`
      : `<div class="content"><div class="other-wrap">
           <div class="icon">📎</div>
           <p>Prévisualisation non disponible pour ce type de fichier.</p>
           <br/>
           <a class="btn-dl" href="${url}" download="${doc.name}" style="display:inline-flex">⬇ Télécharger ${doc.name}</a>
         </div></div>`
  }
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, data: reader.result.split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalize(c) {
  console.log('[normalize] Entrée brute:', c);

  let applicableValue = true; // Par défaut applicable
  if (c.applicable !== undefined)  applicableValue = c.applicable;
  else if (c.Applicable !== undefined) applicableValue = c.Applicable;

  let statutValue = 'NonEvalue';
  if (c.statut != null)  statutValue = c.statut;
  else if (c.Statut != null) statutValue = c.Statut;

  let steps = null;
  const rawSteps = c.steps || c.Steps;
  if (rawSteps) {
    if (typeof rawSteps === 'string') {
      try { steps = JSON.parse(rawSteps); } catch { steps = []; }
    } else if (Array.isArray(rawSteps)) { steps = rawSteps; }
  }

  let raisonsApplicabilite = [];
  const raw = c.raisonsApplicabilite || c.RaisonsApplicabilite;
  if (Array.isArray(raw)) raisonsApplicabilite = raw;
  else if (typeof raw === 'string') {
    try { raisonsApplicabilite = JSON.parse(raw); } catch { raisonsApplicabilite = []; }
  }

  let rawPreuves = c.preuves || c.Preuves || null;
  let preuvesArray = parsePreuves(rawPreuves);

  const normalized = {
    id: c.id || c.Id,
    code: c.code || c.Code,
    titre: c.titre || c.Titre,
    description: c.description || c.Description,
    domaine: c.domaine || c.Domaine,
    applicable: applicableValue,
    statut: statutValue,
    responsable: c.responsable || c.Responsable || null,
    societeId: c.societeId || c.SocieteId || null,
    steps,
    priorite: c.priorite || c.Priorite || null,
    raisonsApplicabilite,
    raisonExclusion: c.raisonExclusion || c.RaisonExclusion || null,
    justificationApplicabilite: c.justificationApplicabilite || c.JustificationApplicabilite || null,
    justificationConformite: c.justificationConformite || c.JustificationConformite || null,
    remarque: c.remarque || c.Remarque || null,
    planCorrectif: c.planCorrectif || c.PlanCorrectif || null,
    responsablePlan: c.responsablePlan || c.ResponsablePlan || null,
    preuves: preuvesArray,
    dateEcheance: formatDate(c.dateEcheance || c.DateEcheance),
    statutPlan: c.statutPlan || c.StatutPlan || null,
    dateMiseAJour: formatDate(c.dateMiseAJour || c.DateMiseAJour),
    dernierModificateurNom: c.dernierModificateurNom || c.DernierModificateurNom || null,
    dernierModificateurId: c.dernierModificateurId || c.DernierModificateurId || null,
    impact: c.impact || c.Impact || null,
    ncDescription: c.ncDescription || c.NcDescription || null,
  };
  console.log('[normalize] Sortie normalisée:', { id: normalized.id, titre: normalized.titre, preuves: normalized.preuves, justification: normalized.justificationConformite, remarque: normalized.remarque });
  return normalized;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS (DocumentChip, DocumentsSection, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function RaisonsApplicabilite({ value = [], onChange }) {
  const toggle = (key) => {
    const next = value.includes(key) ? value.filter(k => k !== key) : [...value, key];
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {RAISONS_APPLICABILITE.map(r => {
        const checked = value.includes(r.key);
        return (
          <label key={r.key} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1.5px solid ${checked ? '#1D4ED8' : T.gray200}`,
            background: checked ? '#EFF6FF' : '#fff',
            transition: 'all 0.18s', userSelect: 'none',
          }}>
            <div onClick={() => toggle(r.key)} style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${checked ? '#1D4ED8' : '#D1D5DB'}`,
              background: checked ? '#1D4ED8' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s', marginTop: 1,
            }}>
              {checked && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div onClick={() => toggle(r.key)} style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: checked ? '#1D4ED8' : T.gray900, fontFamily: T.font }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: T.gray500, marginTop: 2, lineHeight: 1.4 }}>{r.description}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function StyledSelect({ value, onChange, options, placeholder = 'Sélectionner...', accentColor }) {
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          width: '100%', padding: '12px 40px 12px 14px',
          fontSize: 14, fontWeight: selected ? 700 : 400,
          fontFamily: T.font, borderRadius: 12,
          border: `2px solid ${selected && accentColor ? accentColor : T.gray200}`,
          background: selected && accentColor ? hexToRgba(accentColor, 0.06) : '#fff',
          color: selected && accentColor ? accentColor : T.gray700,
          appearance: 'none', WebkitAppearance: 'none',
          cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: selected && accentColor ? accentColor : T.gray400, pointerEvents: 'none',
      }} />
    </div>
  );
}

function StatutBadge({ statut, applicable }) {
  if (applicable === false) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
      <Ban size={14} /> Non applicable
    </span>
  );
  if (statut === 'NonEvalue') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}>
      <MinusCircle size={14} /> Non évalué
    </span>
  );
  const s = STATUTS.find(x => x.key === statut);
  if (!s) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.icon} {s.label}
    </span>
  );
}

function DocumentChip({ doc, onRemove, showRemove = false }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: '#EFF6FF', border: '1.5px solid #BFDBFE',
      borderRadius: 8, padding: '6px 10px',
      transition: 'all 0.15s',
    }}>
      <span
        onClick={() => openPreuve(doc)}
        title={`Ouvrir et télécharger : ${doc.name}`}
        style={{
          fontSize: 12, color: '#1D4ED8', cursor: 'pointer',
          fontWeight: 600, maxWidth: 200,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: 'underline', textDecorationStyle: 'dotted',
        }}
      >
        {doc.name}
      </span>
      {showRemove && (
        <X
          size={13}
          color="#DC2626"
          style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 2 }}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Supprimer ce document"
        />
      )}
    </div>
  );
}

function DocumentsSection({ preuves }) {
  if (!preuves || preuves.length === 0) return null;
  return (
    <div style={{ marginBottom: 14, padding: '10px 14px', background: '#F8FAFF', borderRadius: 10, border: '1px solid #DBEAFE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Paperclip size={13} color="#1D4ED8" />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Documents justificatifs ({preuves.length})
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {preuves.map((doc, idx) => (
          <DocumentChip key={idx} doc={doc} showRemove={false} />
        ))}
      </div>
    </div>
  );
}

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
              <div style={{ height: "100%", width: `${Math.round(stats.averageConformity)}%`, background: "rgba(255,255,255,.8)", borderRadius: 99, transition: "width 1.2s cubic-bezier(.4,0,.2,1) .3s" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
          display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 99,
          border: active === t.id ? "none" : "1.5px solid #E5E7EB",
          background: active === t.id ? "#1D4ED8" : "#fff",
          color: active === t.id ? "#fff" : "#4B5563",
          fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "'Sora', sans-serif",
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

function HistoriquePanel({ controleId, onClose }) {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/${controleId}/historique`)
      .then(r => setHistorique(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [controleId]);

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'relative', width: 560, background: '#fff', height: '100vh',
        display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)',
        fontFamily: T.font,
      }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: T.font }}>Historique des modifications</h2>
                <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Traçabilité complète des changements</p>
              </div>
            </div>
            <X onClick={onClose} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }} size={20} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14, color: T.gray500, fontWeight: 600 }}>Chargement de l'historique...</div>
            </div>
          )}
          {!loading && historique.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.gray700 }}>Aucune modification enregistrée</div>
              <div style={{ fontSize: 12.5, color: T.gray400, marginTop: 6 }}>L'historique sera créé lors de la première évaluation.</div>
            </div>
          )}
          {!loading && historique.length > 0 && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 2, background: T.gray200, borderRadius: 99 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {historique.map((h, i) => {
                  const isOpen  = expanded === h.id;
                  const avant   = parseJsonSafe(h.avantJson);
                  const apres   = parseJsonSafe(h.apresJson);
                  const champs  = h.champsModifies ? h.champsModifies.split(', ').filter(Boolean) : [];
                  const isFirst = i === 0;
                  return (
                    <div key={h.id} style={{ position: 'relative', paddingLeft: 46, paddingBottom: 20 }}>
                      <div style={{
                        position: 'absolute', left: 10, top: 4,
                        width: 16, height: 16, borderRadius: '50%',
                        background: isFirst ? '#1D4ED8' : '#fff',
                        border: `2px solid ${isFirst ? '#1D4ED8' : T.gray300 || '#d1d5db'}`,
                        zIndex: 1,
                        boxShadow: isFirst ? '0 0 0 4px rgba(29,78,216,0.15)' : 'none',
                      }} />
                      <div style={{
                        background: isFirst ? '#EFF6FF' : '#fff',
                        borderRadius: 12, border: `1.5px solid ${isFirst ? '#BFDBFE' : T.gray200}`,
                        overflow: 'hidden', transition: 'all 0.2s',
                      }}>
                        <div onClick={() => toggleExpand(h.id)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Clock size={13} color={isFirst ? '#1D4ED8' : T.gray400} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: isFirst ? '#1D4ED8' : T.gray700 }}>
                                {formatDateTime(h.dateModification)}
                              </span>
                              {isFirst && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: '#1D4ED8', color: '#fff', padding: '1px 7px', borderRadius: 99 }}>DERNIER</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={12} color={T.gray400} />
                              <span style={{ fontSize: 12, color: T.gray600 || '#4b5563' }}>{h.modificateurNom || 'Système'}</span>
                            </div>
                            {champs.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {champs.slice(0, 4).map(c => (
                                  <span key={c} style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: T.gray700, border: '1px solid #E5E7EB' }}>
                                    {CHAMP_LABELS[c] || c}
                                  </span>
                                ))}
                                {champs.length > 4 && <span style={{ fontSize: 10.5, color: T.gray400 }}>+{champs.length - 4}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ flexShrink: 0, color: T.gray400 }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                        </div>
                        {isOpen && avant && apres && (
                          <div style={{ borderTop: `1px solid ${T.gray200}`, padding: '14px 16px', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {champs.map(champ => {
                              const vAvant = avant[champ];
                              const vApres = apres[champ];
                              const toStr  = v => {
                                if (v === null || v === undefined) return '—';
                                if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
                                if (Array.isArray(v)) return v.join(', ') || '—';
                                return String(v);
                              };
                              return (
                                <div key={champ} style={{ fontSize: 12, background: '#fff', borderRadius: 8, border: `1px solid ${T.gray200}`, padding: '10px 12px' }}>
                                  <div style={{ fontWeight: 700, color: T.gray700, marginBottom: 8, fontSize: 11.5 }}>{CHAMP_LABELS[champ] || champ}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ flex: 1, padding: '6px 10px', borderRadius: 6, background: '#FEF2F2', color: '#991B1B', fontSize: 11.5, border: '1px solid #FECACA', wordBreak: 'break-word' }}>{toStr(vAvant)}</div>
                                    <ArrowRight size={14} color={T.gray400} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, padding: '6px 10px', borderRadius: 6, background: '#F0FDF4', color: '#166534', fontSize: 11.5, border: '1px solid #BBF7D0', wordBreak: 'break-word' }}>{toStr(vApres)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.gray400 }}>{historique.length} entrée{historique.length > 1 ? 's' : ''} dans l'historique</span>
          <button onClick={onClose} style={{ ...btnSecondary, flex: 'none', padding: '9px 18px' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Controles() {
  const { canRead, canWrite, canEdit, canDelete, canExport } = useAuth();
  const moduleCode = "controles";
  const hasAccess = canRead(moduleCode);
  
  const [controles, setControles]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [activeTab, setActiveTab]           = useState('all');
  const [evaluationCtrl, setEvaluationCtrl] = useState(null);
  const [filterDomain, setFilterDomain]     = useState('all');
  const [historiqueCtrl, setHistoriqueCtrl] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchData();
  }, []);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    axios.get(API, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        console.log('[API] Réponse brute:', r.data);
        const data = r.data.map(normalize);
        console.log('[API] Après normalisation:', data);
        setControles(data.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateLocalControle = (updatedControle) => {
    setControles(prev => prev.map(ctrl => {
      if (ctrl.id === updatedControle.id) return { ...ctrl, ...updatedControle };
      if (ctrl.code === updatedControle.code) return { ...ctrl, ...updatedControle };
      return ctrl;
    }));
  };

  const handleSaveEvaluation = async (updated) => {
    const token = localStorage.getItem('token');
    
    let preuvesToSend = updated.preuves;
    if (Array.isArray(updated.preuves)) {
      preuvesToSend = JSON.stringify(updated.preuves);
      console.log('[Sauvegarde] Preuves tableau -> stringifié:', preuvesToSend);
    } else if (typeof updated.preuves === 'string') {
      preuvesToSend = updated.preuves;
      console.log('[Sauvegarde] Preuves déjà string, conservation:', preuvesToSend);
    } else {
      preuvesToSend = "[]";
      console.log('[Sauvegarde] Preuves null/undefined -> []');
    }

    try {
      const command = {
        Id: updated.id,
        Titre: updated.titre,
        Description: updated.description || null,
        Domaine: updated.domaine,
        Applicable: updated.applicable,
        Statut: updated.statut || 'NonEvalue',
        RaisonsApplicabilite: updated.raisonsApplicabilite || [],
        Steps: updated.steps || null,
        RaisonExclusion: updated.raisonExclusion || null,
        JustificationConformite: updated.justificationConformite || null,
        Remarque: updated.remarque || null,
        Preuves: preuvesToSend,
        Priorite: updated.priorite || null,
        StatutPlan: updated.statutPlan || null,
        ResponsablePlan: updated.responsablePlan || null,
        DateEcheance: updated.dateEcheance || null,
        SocieteId: updated.societeId || updated.SocieteId || null,
        NcDescription: updated.NcDescription || null,
        Impact: updated.Impact || null,
        ActionImmediate: updated.ActionImmediate || null,
        ResponsableImm: updated.ResponsableImm || null,
        DelaiActionImm: updated.DelaiActionImm || null,
        CausesRacines: updated.CausesRacines || null,
        MethodeAnalyse: updated.MethodeAnalyse || null,
        PlanCorrectif: updated.PlanCorrectif || null,
        Indicateurs: updated.Indicateurs || null,
        DateVerification: updated.DateVerification || null,
      };

      console.log('[Sauvegarde] Commande envoyée:', command);

      const response = await axios.put(`${API}/${updated.id}`, command, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 200 || response.status === 204) {
        const savedData = response.data ? normalize(response.data) : normalize(updated);
        console.log('[Sauvegarde] Réponse normalisée:', savedData);
        updateLocalControle(savedData);
        setEvaluationCtrl(null);
      }
    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // Vérification d'accès
  if (!hasAccess) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: T.font }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⛔</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>Accès non autorisé</div>
        <p style={{ fontSize: 13, color: '#6B7280' }}>Vous n'avez pas les permissions nécessaires pour accéder aux contrôles.</p>
      </div>
    );
  }

  const totalControles    = controles.length;
  const conformeCount     = controles.filter(c => c.statut === 'Conforme').length;
  const nonConformeCount  = controles.filter(c => c.statut === 'NCMineure' || c.statut === 'NCMajeure').length;
  const ncMineureCount    = controles.filter(c => c.statut === 'NCMineure').length;
  const ncMajeureCount    = controles.filter(c => c.statut === 'NCMajeure').length;
  const nonEvalueCount    = controles.filter(c => c.statut === 'NonEvalue').length;
  // Conformite stricte: 100% uniquement si tous les controles sont conformes.
  const averageConformity = totalControles > 0 ? Math.round((conformeCount / totalControles) * 100) : 0;
  const stats = { totalControles, averageConformity, conformeCount, nonConformeCount, ncMineureCount, ncMajeureCount, nonEvalueCount, delayedActions: 0, inProgressActions: 0 };

  const filtered = controles.filter(c => {
    const matchesSearch = (c.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (c.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterDomain !== 'all' && c.domaine !== filterDomain) return false;
    if (activeTab === 'conforme')     return c.statut === 'Conforme';
    if (activeTab === 'non-conforme') return c.statut === 'NCMineure' || c.statut === 'NCMajeure';
    if (activeTab === 'non-evalue')   return c.statut === 'NonEvalue';
    return true;
  });

  const counts      = { all: controles.length, nc: nonConformeCount, ok: conformeCount, ne: nonEvalueCount };
  const domainStats = Object.keys(DOMAIN_THEMES).map(domain => ({ domain, ...DOMAIN_THEMES[domain], total: controles.filter(c => c.domaine === domain).length }));

  const getBarColor = (ctrl) => {
    if (!ctrl.applicable) return 'linear-gradient(90deg,#9CA3AF,#D1D5DB)';
    if (ctrl.statut === 'Conforme')  return 'linear-gradient(90deg,#10B981,#34D399)';
    if (ctrl.statut === 'Remarque')  return 'linear-gradient(90deg,#2563EB,#3B82F6)';
    if (ctrl.statut === 'NCMineure') return 'linear-gradient(90deg,#F59E0B,#FCD34D)';
    if (ctrl.statut === 'NCMajeure') return 'linear-gradient(90deg,#EF4444,#F87171)';
    return 'linear-gradient(90deg,#E5E7EB,#D1D5DB)';
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 36px 60px', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.8px' }}>
            Contrôles ISO 27001 — Annexe A
          </h1>
          <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, marginTop: 6 }}>Évaluation de conformité des contrôles de sécurité</p>
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
            <span style={{ minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 99, fontSize: 11, fontWeight: 700, background: filterDomain === 'all' ? 'rgba(255,255,255,.25)' : '#F3F4F6', color: filterDomain === 'all' ? '#fff' : '#6B7280', padding: '0 5px' }}>{totalControles}</span>
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
              <span style={{ minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 99, fontSize: 11, fontWeight: 700, background: filterDomain === ds.domain ? 'rgba(255,255,255,.25)' : ds.accentLight, color: filterDomain === ds.domain ? '#fff' : ds.accent, padding: '0 5px' }}>{ds.total}</span>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
            <input
              type="text" placeholder="Rechercher un contrôle..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 40px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 12, outline: 'none', fontFamily: T.font, background: '#fff', transition: 'all 0.2s' }}
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
              <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #E6EEF9' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1D4ED8', fontFamily: "'Sora', sans-serif" }}>C</span>
              </div>
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
              <div style={{ height: 4, background: getBarColor(ctrl) }} />

              <div style={{ padding: '20px 22px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: DOMAIN_THEMES[ctrl.domaine]?.headerBg || T.gradBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,58,138,.3)' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{ctrl.code}</span>
                    </div>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: DOMAIN_THEMES[ctrl.domaine]?.accent || '#1D4ED8', background: DOMAIN_THEMES[ctrl.domaine]?.accentLight || '#EEF2FF', padding: '2px 7px', borderRadius: 99, marginBottom: 4 }}>
                        {DOMAIN_THEMES[ctrl.domaine]?.icon} {DOMAIN_THEMES[ctrl.domaine]?.label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.25, fontFamily: "'Sora', sans-serif", letterSpacing: '-.2px' }}>{ctrl.titre}</div>
                    </div>
                  </div>
                  <StatutBadge statut={ctrl.statut} applicable={ctrl.applicable} />
                </div>

                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>{ctrl.description}</p>

                {ctrl.statut === 'Conforme' && ctrl.justificationConformite && (
                  <div style={{ marginBottom: 12, padding: '12px 14px', background: '#F0FDF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Justification de conformité</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#374151', margin: 0, lineHeight: 1.6 }}>{ctrl.justificationConformite}</p>
                  </div>
                )}

                {ctrl.statut === 'Remarque' && ctrl.remarque && (
                  <div style={{ marginBottom: 12, padding: '12px 14px', background: '#EFF6FF', borderRadius: 10, borderLeft: '4px solid #2563EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <AlertCircle size={14} color="#2563EB" />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Remarque</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#374151', margin: 0, lineHeight: 1.6 }}>{ctrl.remarque}</p>
                  </div>
                )}

                {ctrl.applicable === false && ctrl.raisonExclusion && (
                  <div style={{ marginBottom: 12, padding: '12px 14px', background: '#FEF2F2', borderRadius: 10, borderLeft: '4px solid #EF4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <Ban size={14} color="#DC2626" />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Raison d'exclusion</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#374151', margin: 0, lineHeight: 1.6 }}>{ctrl.raisonExclusion}</p>
                  </div>
                )}

                <DocumentsSection preuves={ctrl.preuves} />

                {ctrl.dateMiseAJour && (
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
                    <Clock size={12} />
                    <span>Modifié le {ctrl.dateMiseAJour}</span>
                    {ctrl.dernierModificateurNom && <><span>·</span><span>par {ctrl.dernierModificateurNom}</span></>}
                  </div>
                )}

                {(ctrl.statut === 'NCMineure' || ctrl.statut === 'NCMajeure') && ctrl.steps && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, borderLeft: '4px solid #EF4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ClipboardList size={14} color="#EF4444" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Plan d'action en cours</span>
                      {ctrl.responsablePlan && <span style={{ fontSize: 11, color: '#9CA3AF' }}>— {ctrl.responsablePlan}</span>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {canWrite(moduleCode) && (
                    <button
                      onClick={() => setEvaluationCtrl(ctrl)}
                      style={{
                        flex: 1, padding: '11px 16px', borderRadius: 10,
                        border: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? '1.5px solid #1D4ED8' : 'none',
                        background: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? '#fff' : 'linear-gradient(135deg,#1D4ED8,#1E40AF)',
                        color: (ctrl.applicable === false || ctrl.statut !== 'NonEvalue') ? '#1D4ED8' : '#fff',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                      }}
                    >
                      {(ctrl.applicable === false || ctrl.statut !== 'NonEvalue')
                        ? <><FileText size={15} /> Modifier l'évaluation</>
                        : <><ShieldCheck size={15} /> Évaluer le contrôle</>
                      }
                    </button>
                  )}
                  {ctrl.dateMiseAJour && canRead(moduleCode) && (
                    <button
                      onClick={() => setHistoriqueCtrl(ctrl)}
                      title="Voir l'historique des modifications"
                      style={{
                        padding: '11px 14px', borderRadius: 10,
                        border: '1.5px solid #E5E7EB', background: '#fff',
                        color: T.gray500, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                        fontFamily: T.font, transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B7280'; e.currentTarget.style.color = T.gray900; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = T.gray500; }}
                    >
                      <History size={15} /> Historique
                    </button>
                  )}
                </div>
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
          onViewHistorique={() => { setEvaluationCtrl(null); setHistoriqueCtrl(evaluationCtrl); }}
        />
      )}
      {historiqueCtrl && (
        <HistoriquePanel
          controleId={historiqueCtrl.id}
          onClose={() => setHistoriqueCtrl(null)}
        />
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

// ─────────────────────────────────────────────────────────────────────────────
// PANNEAU D'ÉVALUATION
// ─────────────────────────────────────────────────────────────────────────────

function EvaluationPanel({ ctrl, onClose, onSave, theme, onViewHistorique }) {
  const { canWrite } = useAuth();
  const moduleCode = "controles";

  const [form, setForm] = useState(() => ({
    ...ctrl,
    societeId: ctrl.societeId || ctrl.SocieteId || null,
    raisonsApplicabilite: ctrl.raisonsApplicabilite || [],
    raisonExclusion: ctrl.raisonExclusion || '',
    priorite: ctrl.priorite || ctrl.Priorite || 'Basse',
    steps: ctrl.steps || ctrl.Steps || null,
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
    preuves: Array.isArray(ctrl.preuves) ? ctrl.preuves : parsePreuves(ctrl.preuves),
    Indicateurs: ctrl.indicateurs || ctrl.Indicateurs || '',
    DateVerification: ctrl.dateVerification || ctrl.DateVerification || '',
    CommentaireCloture: ctrl.commentaireCloture || ctrl.CommentaireCloture || '',
    CloturePar: ctrl.cloturePar || ctrl.CloturePar || '',
    DateCloture: ctrl.dateCloture || ctrl.DateCloture || '',
    StatutPlan: ctrl.statutPlan || ctrl.StatutPlan || 'EnCours',
  }));

  const [localDocs, setLocalDocs] = useState(() => {
    const p = ctrl.preuves;
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === 'string') {
      try { return JSON.parse(p); } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    console.log('[EvaluationPanel] ctrl.preuves reçu:', ctrl.preuves);
    const p = ctrl.preuves;
    if (!p) setLocalDocs([]);
    else if (Array.isArray(p)) setLocalDocs(p);
    else if (typeof p === 'string') {
      try { setLocalDocs(JSON.parse(p)); } catch { setLocalDocs([]); }
    } else setLocalDocs([]);
  }, [ctrl.preuves]);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isApplicable     = form.applicable === true;
  const isNotApplicable  = form.applicable === false;
  const isStatusSelected = form.statut && form.statut !== 'NonEvalue';
  const isNC             = form.statut === 'NCMineure' || form.statut === 'NCMajeure';

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const base64Docs = await Promise.all(files.map(readFileAsBase64));
    const nextDocs = [...localDocs, ...base64Docs];
    setLocalDocs(nextDocs);
    setForm(f => ({ ...f, preuves: nextDocs }));
    e.target.value = '';
  };

  const removeDoc = (index) => {
    const nextDocs = localDocs.filter((_, i) => i !== index);
    setLocalDocs(nextDocs);
    setForm(f => ({ ...f, preuves: nextDocs }));
  };

  const hasPlanAction = () => {
    if (!form.steps) return false;
    if (typeof form.steps === 'string') {
      try { const p = JSON.parse(form.steps); return Array.isArray(p) && p.length > 0; } catch { return false; }
    }
    return Array.isArray(form.steps) && form.steps.length > 0;
  };

  const canSaveForm =
    (isNotApplicable && (form.raisonExclusion?.trim().length ?? 0) > 0) ||
    (isApplicable && isStatusSelected);

  const handleApplicableChange = (val) => {
    if (val === 'oui') {
      setForm(f => ({ ...f, applicable: true, raisonExclusion: '', statut: f.statut !== 'NonEvalue' ? f.statut : 'NonEvalue' }));
    } else if (val === 'non') {
      setForm(f => ({
        ...f,
        applicable: false,
        raisonsApplicabilite: [],
        statut: 'NonEvalue',
        justificationConformite: null,
        remarque: null,
        NcDescription: null,
        Impact: null,
        preuves: [],
        steps: null
      }));
      setLocalDocs([]);
    } else {
      setForm(f => ({ ...f, applicable: null }));
    }
  };

  const handleStatutChange = (val) => {
    setForm(f => ({ ...f, statut: val || 'NonEvalue' }));
  };

  const handleSaveClick = async () => {
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission de modifier ce contrôle");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const DocumentUploadBlock = ({ borderColor = T.gray200, bgColor = '#f9fafb', accentColor = '#1D4ED8', label = 'Ajouter des documents' }) => (
    <>
      {localDocs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.gray500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Documents joints ({localDocs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {localDocs.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', borderRadius: 9, border: `1.5px solid ${borderColor}` }}>
                
                <span
                  onClick={() => openPreuve(doc)}
                  title={`Ouvrir : ${doc.name}`}
                  style={{ flex: 1, fontSize: 12.5, color: accentColor, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textDecorationStyle: 'dotted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {doc.name}
                </span>
                <button
                  onClick={() => removeDoc(i)}
                  title="Supprimer ce document"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <X size={14} color="#DC2626" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label style={{ ...uploadAreaStyle, borderColor, background: bgColor, cursor: 'pointer' }}>
        <Upload size={15} color={accentColor} />
        <span style={{ color: accentColor, fontWeight: 600, fontSize: 12.5 }}>{label}</span>
        <input type="file" multiple hidden onChange={handleFileUpload} accept="*/*" />
      </label>
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 620, background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)', fontFamily: T.font }}>

        <div style={{ background: theme?.headerBg || T.gradBlue, padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: T.font }}>{form.code} — Évaluation</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, maxWidth: 400 }}>{form.titre}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {ctrl.dateMiseAJour && (
                <button onClick={onViewHistorique} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
                  <History size={14} /> Historique
                </button>
              )}
              <X onClick={onClose} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }} size={20} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 30, display: 'flex', flexDirection: 'column', gap: 28 }}>

          <Section num="1" title="Applicabilité du contrôle">
            <StyledSelect
              value={form.applicable === true ? 'oui' : form.applicable === false ? 'non' : ''}
              onChange={handleApplicableChange}
              placeholder="Sélectionner..."
              options={[{ value: 'oui', label: 'Applicable' }, { value: 'non', label: 'Non Applicable' }]}
              accentColor={isApplicable ? '#059669' : isNotApplicable ? '#dc2626' : null}
            />
          </Section>

          {isNotApplicable && (
            <Section num="2" title="Raison d'exclusion" animate accentBg="#fef2f2" accentBorder="#fecaca" accentColor="#dc2626">
              <p style={{ fontSize: 12, color: '#991b1b', margin: '0 0 10px', lineHeight: 1.5 }}>Expliquez pourquoi ce contrôle est exclu du périmètre de l'ISMS.</p>
              <textarea rows={4} style={inputStyle} placeholder="Ex : Ce contrôle ne s'applique pas car..." value={form.raisonExclusion || ''} onChange={e => setForm(f => ({ ...f, raisonExclusion: e.target.value }))} />
            </Section>
          )}

          {isApplicable && (
            <Section num="2" title="Raison d'applicabilité" animate accentBg="#f0fdf4" accentBorder="#bbf7d0" accentColor="#059669">
              <p style={{ fontSize: 12, color: '#065f46', margin: '0 0 12px', lineHeight: 1.5 }}>Sélectionnez une ou plusieurs raisons (au moins une obligatoire).</p>
              <RaisonsApplicabilite value={form.raisonsApplicabilite || []} onChange={next => setForm(f => ({ ...f, raisonsApplicabilite: next }))} />
              {form.raisonsApplicabilite.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
                    {form.raisonsApplicabilite.length} raison{form.raisonsApplicabilite.length > 1 ? 's' : ''} :&nbsp;
                    {form.raisonsApplicabilite.map(k => RAISONS_APPLICABILITE.find(r => r.key === k)?.label).join(', ')}
                  </span>
                </div>
              )}
            </Section>
          )}

          {isApplicable && (
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

          {isStatusSelected && isApplicable && (
            <div style={{ animation: 'fadeInUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {form.statut === 'Conforme' && (
                <Section num="4" title="Justification de conformité" accentBg="#f0fdf4" accentBorder="#bbf7d0" accentColor="#059669">
                  <textarea
                    rows={4} style={inputStyle}
                    placeholder="Démontrez comment le contrôle est respecté..."
                    value={form.justificationConformite || ''}
                    onChange={e => setForm(f => ({ ...f, justificationConformite: e.target.value }))}
                  />
                  <DocumentUploadBlock
                    borderColor="#bbf7d0"
                    bgColor="#f0fdf4"
                    accentColor="#059669"
                    label="Ajouter des preuves de conformité"
                  />
                </Section>
              )}

              {form.statut === 'Remarque' && (
                <Section num="4" title="Détail de la remarque" accentBg="#eff6ff" accentBorder="#bfdbfe" accentColor="#2563eb">
                  <textarea
                    rows={4} style={inputStyle}
                    placeholder="Saisissez l'observation..."
                    value={form.remarque || ''}
                    onChange={e => setForm(f => ({ ...f, remarque: e.target.value }))}
                  />
                  <DocumentUploadBlock
                    borderColor="#bfdbfe"
                    bgColor="#eff6ff"
                    accentColor="#2563eb"
                    label="Ajouter des documents de remarque"
                  />
                </Section>
              )}

              {isNC && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div style={{ textAlign: 'center', padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px dashed #ef4444' }}>
                    <p style={{ fontSize: 13, color: '#991b1b', marginBottom: 15, fontWeight: 700, fontFamily: T.font }}>
                      {hasPlanAction() ? "Un plan d'action est déjà configuré pour cette NC." : "Un plan d'action est recommandé pour ce statut de Non-Conformité."}
                    </p>
                    <button onClick={() => setIsPlanModalOpen(true)} style={{ ...btnPrimary, background: T.gradBlue, width: 'auto', margin: '0 auto', padding: '10px 20px' }}>
                      <ClipboardList size={16} />
                      {hasPlanAction() ? "Modifier le plan d'action" : "Créer le plan d'action"}
                    </button>
                  </div>
                  {isPlanModalOpen && (
                    <PlanActionModal
                      ctrl={form}
                      onClose={() => setIsPlanModalOpen(false)}
                      onSave={(planData) => {
                        setForm(prev => ({ ...prev, ...planData, steps: planData.steps || prev.steps }));
                        setIsPlanModalOpen(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={btnSecondary}>Annuler</button>
          <button
            onClick={handleSaveClick}
            disabled={!canSaveForm || saving || !canWrite(moduleCode)}
            style={{ ...btnPrimary, background: canSaveForm && !saving && canWrite(moduleCode) ? T.gradBlue : T.gray200, cursor: canSaveForm && !saving && canWrite(moduleCode) ? 'pointer' : 'not-allowed', color: canSaveForm && !saving && canWrite(moduleCode) ? '#fff' : T.gray400 }}
          >
            {saving ? <>⏳ Sauvegarde...</> : <><Save size={16} /> Enregistrer l'évaluation</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, children, animate, accentBg, accentBorder, accentColor }) {
  return (
    <section style={{ animation: animate ? 'fadeInUp 0.3s ease' : 'none', padding: accentBg ? 18 : 0, background: accentBg || 'transparent', borderRadius: accentBg ? 14 : 0, border: accentBg ? `1.5px solid ${accentBorder}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: accentColor || '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.font }}>{num}</span>
        <label style={{ fontSize: 14, fontWeight: 800, color: accentColor || T.gray900, fontFamily: T.font }}>{title}</label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
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
  marginTop: 10, fontFamily: T.font, transition: 'all 0.2s',
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
