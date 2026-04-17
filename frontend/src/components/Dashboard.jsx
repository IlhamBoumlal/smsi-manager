import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Lock,
  TrendingUp,
  Users,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { getDashboard, getGlobalStats } from '../api/clauses';
import { getCycle, getCycles } from '../api/pdca';
import { getRiskStudies } from '../api/risques';
import { getEffectiveWorkshopStatus, getStudyProgress } from './risques/riskModel';

const PHS = { plan: 'PLAN', do: 'DO', check: 'CHECK', act: 'ACT' };
const CAT_LABELS = { mgmt: 'Management', real: 'Realisation', supp: 'Support' };
const DASHBOARD_TABS = [
  { key: 'synthese', label: 'Synthese' },
  { key: 'risques', label: 'Risques' },
  { key: 'conformite', label: 'Conformite' },
  { key: 'pdca', label: 'PDCA' },
  { key: 'operations', label: 'Operations' },
];
const VIEW_MODES = [
  { key: 'compact', label: 'Compact' },
  { key: 'detail', label: 'Detail' },
];
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0);
const dmy = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR');
};
const pdcaStatus = (s) => (s === 'done' || s === 'completed' ? 'done' : s === 'ip' || s === 'in-progress' ? 'ip' : 'todo');
const classifKey = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase();
const toneFromRate = (v) => (num(v) >= 80 ? 'green' : num(v) >= 50 ? 'amber' : 'red');
const toneFromAlertCount = (v) => (num(v) === 0 ? 'green' : num(v) <= 2 ? 'amber' : 'red');

function Card({ title, value, sub, icon, tone = 'blue' }) {
  const tones = {
    blue: 'from-blue-50 to-indigo-50 border-blue-100 text-blue-700',
    green: 'from-emerald-50 to-green-50 border-emerald-100 text-emerald-700',
    amber: 'from-amber-50 to-orange-50 border-amber-100 text-amber-700',
    red: 'from-red-50 to-rose-50 border-red-100 text-red-700',
    violet: 'from-violet-50 to-fuchsia-50 border-violet-100 text-violet-700',
    slate: 'from-slate-50 to-zinc-50 border-slate-200 text-slate-700',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone] || tones.blue}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-extrabold leading-none">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-500">{sub}</div>
    </div>
  );
}

function LeanKpi({ title, value, sub, tone = 'blue' }) {
  const tones = {
    blue: 'border-blue-200 text-blue-700',
    green: 'border-emerald-200 text-emerald-700',
    amber: 'border-amber-200 text-amber-700',
    red: 'border-red-200 text-red-700',
    violet: 'border-violet-200 text-violet-700',
    slate: 'border-slate-200 text-slate-700',
  };
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${tones[tone] || tones.blue}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-500">{sub}</div>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Donut({ data }) {
  const total = data.reduce((s, x) => s + num(x.value), 0);
  let at = 0;
  const gradient =
    total === 0
      ? 'conic-gradient(#e2e8f0 0deg 360deg)'
      : `conic-gradient(${data
          .map((x) => {
            const a = at;
            const b = at + (num(x.value) / total) * 360;
            at = b;
            return `${x.color} ${a}deg ${b}deg`;
          })
          .join(', ')})`;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 rounded-full" style={{ background: gradient }}>
        <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center">
          <div>
            <div className="text-lg font-extrabold text-slate-800">{total}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">total</div>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((x) => (
          <div key={x.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
              {x.label}
            </span>
            <span className="font-bold text-slate-700">
              {x.value} <span className="text-xs text-slate-400">({pct(x.value, total)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ rows }) {
  const max = rows.reduce((m, x) => Math.max(m, num(x.value)), 0);
  return (
    <div className="space-y-3">
      {rows.map((x) => (
        <div key={x.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{x.label}</span>
            <span className="font-bold text-slate-700">{x.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full" style={{ width: `${max ? Math.max(6, Math.round((num(x.value) / max) * 100)) : 0}%`, background: x.color || '#2563eb' }} />
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="text-sm text-slate-400">Aucune donnee.</div>}
    </div>
  );
}

function Table({ columns, rows }) {
  if (!rows.length) return <div className="text-sm text-slate-400">Aucune donnee.</div>;
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((c) => (
              <th key={c.key} className="pb-2 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="py-2 text-slate-700">
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('synthese');
  const [viewMode, setViewMode] = useState('compact');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [clauses, setClauses] = useState([]);
  const [stats, setStats] = useState({ averageConformity: 0, totalClauses: 0, conformeClauses: 0, nonConformeClauses: 0, totalActions: 0, completedActions: 0, inProgressActions: 0, delayedActions: 0 });
  const [controles, setControles] = useState([]);
  const [docs, setDocs] = useState([]);
  const [actifs, setActifs] = useState([]);
  const [pdca, setPdca] = useState({ phase: { plan: 0, do: 0, check: 0, act: 0 }, done: 0, ip: 0, todo: 0, total: 0, global: 0 });
  const [carto, setCarto] = useState([]);
  const [riskStudies, setRiskStudies] = useState([]);

  useEffect(() => {
    let on = true;
    const pdcaLoad = async () => {
      const list = await getCycles();
      const cycles = Array.isArray(list) ? list : [];
      if (!cycles.length) return { phase: { plan: 0, do: 0, check: 0, act: 0 }, done: 0, ip: 0, todo: 0, total: 0, global: 0 };
      const cycle = await getCycle(cycles[0].id);
      const groups = { plan: [], do: [], check: [], act: [] };
      (cycle?.phases || []).forEach((p) => {
        const k = String(p?.key || '').toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(groups, k)) return;
        groups[k] = (p?.sections || []).flatMap((s) => (s?.items || []).map((i) => pdcaStatus(i?.status)));
      });
      const all = Object.values(groups).flat();
      const done = all.filter((s) => s === 'done').length;
      const ip = all.filter((s) => s === 'ip').length;
      const todo = all.filter((s) => s === 'todo').length;
      return {
        phase: Object.fromEntries(Object.keys(groups).map((k) => [k, pct(groups[k].filter((x) => x === 'done').length, groups[k].length)])),
        done, ip, todo, total: all.length, global: pct(done, all.length),
      };
    };
    (async () => {
      setLoading(true);
      setError('');
      const warn = [];
      try {
        const [c1, c2, c3, c4, c5, c6, c7] = await Promise.allSettled([getDashboard(), getGlobalStats(), axiosInstance.get('/api/controles'), axiosInstance.get('/api/documentation'), axiosInstance.get('/api/actifs'), pdcaLoad(), getRiskStudies()]);
        if (!on) return;
        c1.status === 'fulfilled' ? setClauses(Array.isArray(c1.value) ? c1.value : []) : warn.push('Clauses indisponibles');
        c2.status === 'fulfilled' ? setStats((s) => ({ ...s, ...(c2.value || {}) })) : warn.push('Stats clauses indisponibles');
        c3.status === 'fulfilled' ? setControles(Array.isArray(c3.value?.data) ? c3.value.data : []) : warn.push('Controles indisponibles');
        c4.status === 'fulfilled' ? setDocs(Array.isArray(c4.value?.data) ? c4.value.data : []) : warn.push('Documentation indisponible');
        c5.status === 'fulfilled' ? setActifs(Array.isArray(c5.value?.data) ? c5.value.data : []) : warn.push('Actifs indisponibles');
        c6.status === 'fulfilled' ? setPdca(c6.value) : warn.push('PDCA indisponible');
        c7.status === 'fulfilled' ? setRiskStudies(Array.isArray(c7.value) ? c7.value : []) : warn.push('Risques indisponibles');
        try { const raw = localStorage.getItem('smq_v7'); setCarto(raw ? JSON.parse(raw) : []); } catch { warn.push('Cartographie locale illisible'); setCarto([]); }
      } catch (e) {
        if (on) setError(e?.message || 'Erreur chargement dashboard');
      } finally {
        if (on) { setWarnings(warn); setLoading(false); }
      }
    })();
    return () => { on = false; };
  }, []);

  const controls = useMemo(() => {
    const rows = controles.map((c) => ({ code: c?.code ?? c?.Code, titre: c?.titre ?? c?.Titre, domaine: c?.domaine ?? c?.Domaine, statut: c?.statut ?? c?.Statut ?? 'NonEvalue' }));
    const total = rows.length;
    const n = {
      total,
      nonEvalue: rows.filter((x) => x.statut === 'NonEvalue').length,
      conforme: rows.filter((x) => x.statut === 'Conforme').length,
      remarque: rows.filter((x) => x.statut === 'Remarque').length,
      ncMineure: rows.filter((x) => x.statut === 'NCMineure').length,
      ncMajeure: rows.filter((x) => x.statut === 'NCMajeure').length,
      byDomain: {},
      rows,
    };
    rows.forEach((x) => { n.byDomain[x.domaine || 'Non renseigne'] = (n.byDomain[x.domaine || 'Non renseigne'] || 0) + 1; });
    n.taux = pct(n.conforme, total);
    return n;
  }, [controles]);

  const documentation = useMemo(() => {
    const rows = docs.map((d) => ({ name: d?.name ?? d?.Name ?? 'Sans nom', type: d?.type ?? d?.Type ?? '-', status: d?.status ?? d?.Status ?? 'brouillon', updatedAt: d?.updatedAt ?? d?.UpdatedAt }));
    return {
      total: rows.length,
      approuve: rows.filter((x) => x.status === 'approuve').length,
      validation: rows.filter((x) => x.status === 'en-validation').length,
      brouillon: rows.filter((x) => x.status === 'brouillon').length,
      aRevoir: rows.filter((x) => x.status === 'a-revoir').length,
      rows,
    };
  }, [docs]);

  const assets = useMemo(() => {
    const rows = actifs.map((a) => ({ nom: a?.nom ?? a?.Nom ?? 'Actif', type: a?.type ?? a?.Type ?? '-', categorie: a?.categorie ?? a?.Categorie ?? '-', classification: a?.classification ?? a?.Classification ?? '-' }));
    return {
      total: rows.length,
      sensibles: rows.filter((x) => ['secret', 'topsecret'].includes(classifKey(x.classification))).length,
      primaires: rows.filter((x) => x.type === 'Primaire').length,
      support: rows.filter((x) => x.type === 'Support').length,
      rows,
      byType: rows.reduce((o, x) => ({ ...o, [x.type]: (o[x.type] || 0) + 1 }), {}),
    };
  }, [actifs]);

  const cartography = useMemo(() => {
    const by = { mgmt: 0, real: 0, supp: 0 };
    let docsCount = 0;
    const p = (Array.isArray(carto) ? carto : []).map((x) => {
      const cat = x?.cat || 'supp';
      if (Object.prototype.hasOwnProperty.call(by, cat)) by[cat] += 1;
      const d = Array.isArray(x?.docs) ? x.docs.length : 0;
      docsCount += d;
      return { name: x?.name || 'Processus', docs: d };
    });
    return { by, total: p.length, docs: docsCount, top: [...p].sort((a, b) => b.docs - a.docs).slice(0, 5) };
  }, [carto]);

  const clauseBars = useMemo(() => [...clauses].map((x) => ({ label: `Clause ${x?.clause?.number ?? '-'}`, value: num(x?.computedScore), color: '#2563eb', n: Number(x?.clause?.number) || 0 })).sort((a, b) => a.n - b.n).slice(0, 10), [clauses]);
  const clausesNC = useMemo(() => [...clauses].filter((x) => !x?.isFullyCompliant).sort((a, b) => num(a?.computedScore) - num(b?.computedScore)).slice(0, 6).map((x) => ({ clause: x?.clause?.number || '-', titre: x?.clause?.title || '-', score: `${num(x?.computedScore)}%`, ecart: `${Object.values(x?.subConformities || {}).filter((s) => s?.status !== 'conforme').length} ecarts` })), [clauses]);
  const docsReview = useMemo(() => documentation.rows.filter((x) => x.status === 'a-revoir').slice(0, 6).map((x) => ({ nom: x.name, type: x.type, maj: dmy(x.updatedAt) })), [documentation.rows]);
  const controlsCritical = useMemo(() => controls.rows.filter((x) => x.statut === 'NCMajeure' || x.statut === 'Remarque').slice(0, 6).map((x) => ({ controle: x.code || '-', domaine: x.domaine || '-', statut: x.statut === 'NCMajeure' ? 'NC majeure' : 'Remarque' })), [controls.rows]);
  const sensitiveAssets = useMemo(() => assets.rows.filter((x) => ['secret', 'topsecret'].includes(classifKey(x.classification))).slice(0, 6).map((x) => ({ actif: x.nom, type: x.type, classif: x.classification })), [assets.rows]);
  const riskMetrics = useMemo(() => {
    const studyStatus = { non_evalue: 0, en_cours: 0, a_valider: 0, termine: 0, bloque: 0 };
    const workshopStatus = { non_evalue: 0, en_cours: 0, a_valider: 0, termine: 0, bloque: 0 };
    let totalPct = 0;
    let studiesDone = 0;
    let studiesInProgress = 0;
    let workshopsToValidate = 0;
    let workshopsBlocked = 0;
    let riskEntries = 0;
    let criticalRisks = 0;
    let residualRisks = 0;
    let totalMeasures = 0;
    let measureDone = 0;
    let measureInProgress = 0;
    let measureTodo = 0;
    let isoApplied = 0;
    let isoPartial = 0;
    let isoNotApplied = 0;
    const topCriticalStudies = [];

    riskStudies.forEach((study) => {
      const progress = getStudyProgress(study);
      totalPct += num(progress.pct);
      workshopsToValidate += num(progress.toValidate);
      workshopsBlocked += num(progress.blocked);

      if (progress.done === 5) studiesDone += 1;
      if (progress.status === 'en_cours') studiesInProgress += 1;
      if (Object.prototype.hasOwnProperty.call(studyStatus, progress.status)) studyStatus[progress.status] += 1;

      [1, 2, 3, 4, 5].forEach((workshopId) => {
        const status = getEffectiveWorkshopStatus(study, workshopId);
        if (Object.prototype.hasOwnProperty.call(workshopStatus, status)) workshopStatus[status] += 1;
      });

      const entries = Array.isArray(study?.workshop5?.riskEntries) ? study.workshop5.riskEntries : [];
      const criticalCount = entries.filter((risk) => num(risk?.gravity) * num(risk?.likelihood) >= 10).length;
      riskEntries += entries.length;
      criticalRisks += criticalCount;

      const residual = Array.isArray(study?.workshop5?.residualRisks) ? study.workshop5.residualRisks : [];
      residualRisks += residual.length;

      const measures = Array.isArray(study?.workshop5?.measures) ? study.workshop5.measures : [];
      totalMeasures += measures.length;
      measures.forEach((item) => {
        const status = String(item?.status || '').toLowerCase();
        if (status.includes('fait')) {
          measureDone += 1;
          return;
        }
        if (status.includes('cours')) {
          measureInProgress += 1;
          return;
        }
        measureTodo += 1;
      });

      const controlsIso = Array.isArray(study?.workshop1?.isoControls) ? study.workshop1.isoControls : [];
      controlsIso.forEach((item) => {
        const status = String(item?.status || '').toLowerCase();
        if (status === 'applique') {
          isoApplied += 1;
          return;
        }
        if (status === 'partiel' || status === 'en_cours') {
          isoPartial += 1;
          return;
        }
        if (status === 'non_applique') isoNotApplied += 1;
      });

      topCriticalStudies.push({
        etude: study?.name || 'Etude',
        critiques: criticalCount,
        registre: entries.length,
        progression: `${num(progress.pct)}%`,
      });
    });

    const avgProgress = riskStudies.length ? Math.round(totalPct / riskStudies.length) : 0;
    const topCritical = topCriticalStudies
      .filter((x) => x.critiques > 0)
      .sort((a, b) => b.critiques - a.critiques || b.registre - a.registre)
      .slice(0, 6);

    return {
      totalStudies: riskStudies.length,
      avgProgress,
      studiesDone,
      studiesInProgress,
      workshopsToValidate,
      workshopsBlocked,
      riskEntries,
      criticalRisks,
      residualRisks,
      totalMeasures,
      measureDone,
      measureInProgress,
      measureTodo,
      isoApplied,
      isoPartial,
      isoNotApplied,
      studyStatus,
      workshopStatus,
      topCritical,
    };
  }, [riskStudies]);
  const riskMeasureDoneRate = pct(riskMetrics.measureDone, riskMetrics.totalMeasures);
  const isoTotal = riskMetrics.isoApplied + riskMetrics.isoPartial + riskMetrics.isoNotApplied;
  const isoAppliedRate = pct(riskMetrics.isoApplied, isoTotal);
  const docsApprovedRate = pct(documentation.approuve, documentation.total);
  const priorityKpis = useMemo(
    () => [
      {
        title: 'Ateliers a valider',
        value: riskMetrics.workshopsToValidate,
        sub: `${riskMetrics.workshopsBlocked} bloques`,
        tone: toneFromAlertCount(riskMetrics.workshopsToValidate),
      },
      {
        title: 'Etudes terminees',
        value: `${riskMetrics.studiesDone}/${Math.max(riskMetrics.totalStudies, 1)}`,
        sub: `${Math.max(0, riskMetrics.totalStudies - riskMetrics.studiesDone)} restantes`,
        tone: toneFromRate(pct(riskMetrics.studiesDone, riskMetrics.totalStudies)),
      },
      {
        title: 'Mesures en cours',
        value: riskMetrics.measureInProgress,
        sub: `${riskMetrics.measureDone} faites · ${riskMetrics.measureTodo} a faire`,
        tone: 'blue',
      },
      {
        title: 'Taux ISO appliques',
        value: `${isoAppliedRate}%`,
        sub: `${riskMetrics.isoApplied}/${Math.max(isoTotal, 1)} controles`,
        tone: toneFromRate(isoAppliedRate),
      },
      {
        title: 'Documents approuves',
        value: `${documentation.approuve}/${Math.max(documentation.total, 1)}`,
        sub: `${docsApprovedRate}% approuves`,
        tone: toneFromRate(docsApprovedRate),
      },
      {
        title: 'Actifs support',
        value: assets.support,
        sub: `${assets.total} actifs au total`,
        tone: 'slate',
      },
    ],
    [
      riskMetrics.workshopsToValidate,
      riskMetrics.workshopsBlocked,
      riskMetrics.studiesDone,
      riskMetrics.totalStudies,
      riskMetrics.measureInProgress,
      riskMetrics.measureDone,
      riskMetrics.measureTodo,
      riskMetrics.isoApplied,
      isoAppliedRate,
      isoTotal,
      documentation.approuve,
      documentation.total,
      docsApprovedRate,
      assets.support,
      assets.total,
    ],
  );
  const isCompact = viewMode === 'compact';
  const executiveTones = useMemo(() => ({
    conformite: toneFromRate(stats.averageConformity),
    risquesCritiques: toneFromAlertCount(riskMetrics.criticalRisks),
    ateliersBloques: toneFromAlertCount(riskMetrics.workshopsBlocked),
    actionsRetard: toneFromAlertCount(stats.delayedActions),
    pdca: toneFromRate(pdca.global),
    progressionRisques: toneFromRate(riskMetrics.avgProgress),
    isoApplied: toneFromRate(isoAppliedRate),
  }), [
    stats.averageConformity,
    riskMetrics.criticalRisks,
    riskMetrics.workshopsBlocked,
    stats.delayedActions,
    pdca.global,
    riskMetrics.avgProgress,
    isoAppliedRate,
  ]);
  const alertRows = useMemo(
    () => ([
      { label: 'Risques critiques', value: riskMetrics.criticalRisks, color: '#dc2626' },
      { label: 'Ateliers bloques', value: riskMetrics.workshopsBlocked, color: '#ef4444' },
      { label: 'Actions en retard', value: num(stats.delayedActions), color: '#f59e0b' },
      { label: 'NC majeures', value: controls.ncMajeure, color: '#dc2626' },
      { label: 'Documents a revoir', value: documentation.aRevoir, color: '#f59e0b' },
    ]).filter((item) => num(item.value) > 0),
    [riskMetrics.criticalRisks, riskMetrics.workshopsBlocked, stats.delayedActions, controls.ncMajeure, documentation.aRevoir],
  );
  const pulseRows = useMemo(
    () => [
      { label: 'Conformite globale', value: Math.round(num(stats.averageConformity)), color: '#16a34a' },
      { label: 'PDCA global', value: pdca.global, color: '#7c3aed' },
      { label: 'Progression risques', value: riskMetrics.avgProgress, color: '#2563eb' },
      { label: 'Mesures de risque realisees', value: riskMeasureDoneRate, color: '#0891b2' },
      { label: 'Taux conformite controles', value: controls.taux, color: '#4f46e5' },
    ],
    [stats.averageConformity, pdca.global, riskMetrics.avgProgress, riskMeasureDoneRate, controls.taux],
  );

  if (loading) {
    return <div className="min-h-screen bg-slate-100 p-8"><div className="mx-auto max-w-7xl animate-pulse space-y-4"><div className="h-40 rounded-3xl bg-slate-200" /><div className="h-96 rounded-3xl bg-slate-200" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-6 py-7 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider"><TrendingUp size={14} /> Executive dashboard SMSI</p>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Tableau de bord global</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">Vision centralisee des KPI conformite, controles, documentation, actifs, PDCA et cartographie.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-blue-100">Conformite globale</p>
              <p className="text-4xl font-extrabold leading-none">{Math.round(num(stats.averageConformity))}%</p>
              <p className="mt-1 text-xs text-blue-100">{num(stats.totalClauses)} clauses</p>
            </div>
          </div>
        </header>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {warnings.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Chargement partiel: {warnings.join(' | ')}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Conformite globale" value={`${Math.round(num(stats.averageConformity))}%`} sub={`${num(stats.conformeClauses)}/${Math.max(num(stats.totalClauses), 1)} clauses conformes`} icon={<CheckCircle2 size={18} />} tone={executiveTones.conformite} />
          <Card title="Risques critiques" value={riskMetrics.criticalRisks} sub={`${riskMetrics.riskEntries} dans le registre`} icon={<AlertTriangle size={18} />} tone={executiveTones.risquesCritiques} />
          <Card title="Actions en retard" value={num(stats.delayedActions)} sub={`${num(stats.inProgressActions)} en cours`} icon={<Clock3 size={18} />} tone={executiveTones.actionsRetard} />
          <Card title="PDCA global" value={`${pdca.global}%`} sub={`${pdca.done}/${Math.max(pdca.total, 1)} items termines`} icon={<ClipboardList size={18} />} tone={executiveTones.pdca} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {DASHBOARD_TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {VIEW_MODES.map((mode) => {
                const active = viewMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setViewMode(mode.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {activeTab === 'synthese' ? (
          <>
            <Block title="KPI prioritaires">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {priorityKpis.map((kpi) => (
                  <LeanKpi key={kpi.title} title={kpi.title} value={kpi.value} sub={kpi.sub} tone={kpi.tone} />
                ))}
              </div>
            </Block>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Alertes immediates">
                {alertRows.length ? (
                  <div className="space-y-2">
                    {alertRows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="rounded-full px-2 py-0.5 text-sm font-bold text-white" style={{ background: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700">Aucune alerte immediate.</div>
                )}
              </Block>
              <Block title="Pulse global (%)">
                <Bars rows={pulseRows} />
              </Block>
            </section>
            {!isCompact ? (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Block title="Top etudes a risque critique">
                  <Table columns={[{ key: 'etude', label: 'Etude' }, { key: 'critiques', label: 'Risques critiques' }, { key: 'registre', label: 'Registre' }, { key: 'progression', label: 'Progression' }]} rows={riskMetrics.topCritical} />
                </Block>
                <Block title="Plans d'action par etat">
                  <Bars rows={[{ label: 'Terminees', value: num(stats.completedActions), color: '#16a34a' }, { label: 'En cours', value: num(stats.inProgressActions), color: '#2563eb' }, { label: 'En retard', value: num(stats.delayedActions), color: '#ef4444' }]} />
                </Block>
              </section>
            ) : null}
          </>
        ) : null}

        {activeTab === 'risques' ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card title="Progression risques" value={`${riskMetrics.avgProgress}%`} sub={`${riskMetrics.studiesInProgress} en cours`} icon={<TrendingUp size={18} />} tone={executiveTones.progressionRisques} />
              <Card title="Risques residuels" value={riskMetrics.residualRisks} sub="Apres traitement" icon={<Ban size={18} />} tone={toneFromAlertCount(riskMetrics.residualRisks)} />
              <Card title="Mesures securite" value={riskMetrics.totalMeasures} sub={`${riskMetrics.measureDone} faites`} icon={<CheckCircle2 size={18} />} tone="green" />
              <Card title="ISO non appliques" value={riskMetrics.isoNotApplied} sub="A traiter / justifier" icon={<AlertTriangle size={18} />} tone={toneFromAlertCount(riskMetrics.isoNotApplied)} />
            </section>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Etudes de risques par statut">
                <Donut data={[{ label: 'Terminees', value: riskMetrics.studyStatus.termine, color: '#16a34a' }, { label: 'A valider', value: riskMetrics.studyStatus.a_valider, color: '#f59e0b' }, { label: 'En cours', value: riskMetrics.studyStatus.en_cours, color: '#2563eb' }, { label: 'Non evaluees', value: riskMetrics.studyStatus.non_evalue, color: '#94a3b8' }]} />
              </Block>
              <Block title="Ateliers de risques par statut">
                <Bars rows={[{ label: 'Termines', value: riskMetrics.workshopStatus.termine, color: '#16a34a' }, { label: 'A valider', value: riskMetrics.workshopStatus.a_valider, color: '#f59e0b' }, { label: 'En cours', value: riskMetrics.workshopStatus.en_cours, color: '#2563eb' }, { label: 'Bloques', value: riskMetrics.workshopStatus.bloque, color: '#dc2626' }, { label: 'Non evalues', value: riskMetrics.workshopStatus.non_evalue, color: '#94a3b8' }]} />
              </Block>
            </section>
            {!isCompact ? (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Block title="Mesures de securite - Atelier 5">
                  <Donut data={[{ label: 'Faites', value: riskMetrics.measureDone, color: '#16a34a' }, { label: 'En cours', value: riskMetrics.measureInProgress, color: '#2563eb' }, { label: 'A faire', value: riskMetrics.measureTodo, color: '#94a3b8' }]} />
                </Block>
                <Block title="Top etudes a risque critique">
                  <Table columns={[{ key: 'etude', label: 'Etude' }, { key: 'critiques', label: 'Risques critiques' }, { key: 'registre', label: 'Registre' }, { key: 'progression', label: 'Progression' }]} rows={riskMetrics.topCritical} />
                </Block>
              </section>
            ) : null}
          </>
        ) : null}

        {activeTab === 'conformite' ? (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Conformite par clause"><Bars rows={clauseBars} /></Block>
              <Block title="Controles par domaine"><Bars rows={Object.entries(controls.byDomain).map(([label, value]) => ({ label, value, color: '#4f46e5' }))} /></Block>
            </section>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Clauses conformes / non conformes"><Donut data={[{ label: 'Conformes', value: num(stats.conformeClauses), color: '#16a34a' }, { label: 'Non conformes', value: num(stats.nonConformeClauses), color: '#dc2626' }]} /></Block>
              <Block title="Controles par statut"><Donut data={[{ label: 'Conformes', value: controls.conforme, color: '#16a34a' }, { label: 'Remarques', value: controls.remarque, color: '#2563eb' }, { label: 'NC mineures', value: controls.ncMineure, color: '#f59e0b' }, { label: 'NC majeures', value: controls.ncMajeure, color: '#dc2626' }, { label: 'Non evalues', value: controls.nonEvalue, color: '#94a3b8' }]} /></Block>
            </section>
            {!isCompact ? (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Block title="Top clauses non conformes"><Table columns={[{ key: 'clause', label: 'Clause' }, { key: 'titre', label: 'Titre' }, { key: 'score', label: 'Score' }, { key: 'ecart', label: 'Ecart' }]} rows={clausesNC} /></Block>
                <Block title="Controles critiques"><Table columns={[{ key: 'controle', label: 'Controle' }, { key: 'domaine', label: 'Domaine' }, { key: 'statut', label: 'Statut' }]} rows={controlsCritical} /></Block>
              </section>
            ) : null}
          </>
        ) : null}

        {activeTab === 'pdca' ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card title="PDCA global" value={`${pdca.global}%`} sub={`${pdca.done}/${Math.max(pdca.total, 1)} termines`} icon={<ClipboardList size={18} />} tone={executiveTones.pdca} />
              <Card title="Taches terminees" value={pdca.done} sub={`${pdca.total} au total`} icon={<CheckCircle2 size={18} />} tone="green" />
              <Card title="Taches en cours" value={pdca.ip} sub="Execution active" icon={<Clock3 size={18} />} tone="blue" />
              <Card title="Taches a faire" value={pdca.todo} sub="Backlog" icon={<Ban size={18} />} tone="slate" />
            </section>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Progression PDCA par phase"><Bars rows={Object.keys(pdca.phase).map((k) => ({ label: PHS[k], value: pdca.phase[k], color: k === 'plan' ? '#a855f7' : k === 'do' ? '#2563eb' : k === 'check' ? '#0891b2' : '#ef4444' }))} /></Block>
              <Block title="PDCA taches"><Donut data={[{ label: 'Terminees', value: pdca.done, color: '#16a34a' }, { label: 'En cours', value: pdca.ip, color: '#f59e0b' }, { label: 'A faire', value: pdca.todo, color: '#94a3b8' }]} /></Block>
            </section>
            {!isCompact ? (
              <section className="grid grid-cols-1 gap-4">
                <Block title="Plans d'action par etat"><Bars rows={[{ label: 'Terminees', value: num(stats.completedActions), color: '#16a34a' }, { label: 'En cours', value: num(stats.inProgressActions), color: '#2563eb' }, { label: 'En retard', value: num(stats.delayedActions), color: '#ef4444' }]} /></Block>
              </section>
            ) : null}
          </>
        ) : null}

        {activeTab === 'operations' ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card title="Documents a revoir" value={documentation.aRevoir} sub={`${documentation.total} documents`} icon={<FileText size={18} />} tone={toneFromAlertCount(documentation.aRevoir)} />
              <Card title="Actifs sensibles" value={assets.sensibles} sub={`${assets.total} actifs`} icon={<Lock size={18} />} tone={toneFromAlertCount(assets.sensibles)} />
              <Card title="Actifs primaires" value={assets.primaires} sub={`${assets.support} actifs support`} icon={<Building2 size={18} />} tone="slate" />
              <Card title="Total controles" value={controls.total} sub={`Conformite ${controls.taux}%`} icon={<Users size={18} />} tone="blue" />
            </section>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Block title="Documentation par statut"><Donut data={[{ label: 'Approuves', value: documentation.approuve, color: '#16a34a' }, { label: 'En validation', value: documentation.validation, color: '#f59e0b' }, { label: 'Brouillons', value: documentation.brouillon, color: '#64748b' }, { label: 'A revoir', value: documentation.aRevoir, color: '#ef4444' }]} /></Block>
              <Block title="Cartographie: processus par categorie"><Bars rows={Object.entries(cartography.by).map(([k, value]) => ({ label: CAT_LABELS[k] || k, value, color: k === 'mgmt' ? '#0ea5e9' : k === 'real' ? '#8b5cf6' : '#10b981' }))} /></Block>
            </section>
            {!isCompact ? (
              <>
                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Block title="Documents a revoir"><Table columns={[{ key: 'nom', label: 'Document' }, { key: 'type', label: 'Type' }, { key: 'maj', label: 'Derniere MAJ' }]} rows={docsReview} /></Block>
                  <Block title="Actifs sensibles"><Table columns={[{ key: 'actif', label: 'Actif' }, { key: 'type', label: 'Type' }, { key: 'classif', label: 'Classification' }]} rows={sensitiveAssets} /></Block>
                </section>
                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Block title="Cartographie">
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex justify-between"><span>Total processus</span><span className="font-bold">{cartography.total}</span></div>
                      <div className="flex justify-between"><span>Documents associes</span><span className="font-bold">{cartography.docs}</span></div>
                    </div>
                  </Block>
                  <Block title="Conformite controles">
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex justify-between"><span>Conformes</span><span className="font-bold text-emerald-600">{controls.conforme}</span></div>
                      <div className="flex justify-between"><span>NC mineures</span><span className="font-bold text-amber-600">{controls.ncMineure}</span></div>
                      <div className="flex justify-between"><span>NC majeures</span><span className="font-bold text-red-600">{controls.ncMajeure}</span></div>
                    </div>
                  </Block>
                </section>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
