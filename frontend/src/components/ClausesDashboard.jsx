import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, getGlobalStats } from "../api/clauses";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faRotateRight, faTriangleExclamation, faPlus } from '@fortawesome/free-solid-svg-icons';

/* ═══════════════════════════════════════════════════════════
   CLAUSE CONFIG
═══════════════════════════════════════════════════════════ */
const CLAUSE_META = {
  4:  { emoji: "🏛", phase: "P", gradient: "135deg, #1e3a5f 0%, #0f2540 100%" },
  5:  { emoji: "👑", phase: "P", gradient: "135deg, #1e3a5f 0%, #0f2540 100%" },
  6:  { emoji: "🎯", phase: "P", gradient: "135deg, #1e3a5f 0%, #0f2540 100%" },
  7:  { emoji: "⚙️", phase: "D", gradient: "135deg, #1a3a5c 0%, #0d2035 100%" },
  8:  { emoji: "🔧", phase: "D", gradient: "135deg, #1a3a5c 0%, #0d2035 100%" },
  9:  { emoji: "📊", phase: "C", gradient: "135deg, #1b3a5e 0%, #0e2438 100%" },
  10: { emoji: "♻️", phase: "A", gradient: "135deg, #1c3a60 0%, #0f2840 100%" },
};

const PDCA_COLORS = {
  P: { bg: "#EEF2FF", text: "#3730A3", label: "Plan"  },
  D: { bg: "#F0FDF4", text: "#166534", label: "Do"    },
  C: { bg: "#FFF7ED", text: "#9A3412", label: "Check" },
  A: { bg: "#FDF2F8", text: "#86198F", label: "Act"   },
};

function computeAverageConformity(dashboard) {
  if (!Array.isArray(dashboard) || dashboard.length === 0) return 0;
  let totalSubs = 0;
  let totalConforme = 0;
  for (const item of dashboard) {
    const subs = Object.values(item.subConformities || {});
    totalSubs += subs.length;
    totalConforme += subs.filter(s => s.status === "conforme").length;
  }
  if (totalSubs === 0) return 0;
  return Math.round((totalConforme / totalSubs) * 100);
}

function mergeStats(apiStats, dashboard) {
  const localAvg = computeAverageConformity(dashboard);
  const averageConformity = apiStats?.averageConformity > 0 ? apiStats.averageConformity : localAvg;
  const conformeClauses = dashboard.filter(i => i.isFullyCompliant).length;
  const nonConformeClauses = dashboard.filter(i => {
    const hasEval = Object.values(i.subConformities || {}).some(c => c.status !== "non-évalué");
    return !i.isFullyCompliant && hasEval;
  }).length;

  return {
    totalClauses:       apiStats?.totalClauses       ?? dashboard.length,
    averageConformity,
    conformeClauses:    apiStats?.conformeClauses     ?? conformeClauses,
    nonConformeClauses: apiStats?.nonConformeClauses  ?? nonConformeClauses,
    totalActions:       apiStats?.totalActions        ?? 0,
    completedActions:   apiStats?.completedActions    ?? 0,
    inProgressActions:  apiStats?.inProgressActions   ?? 0,
    delayedActions:     apiStats?.delayedActions      ?? 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   RADIAL SCORE
═══════════════════════════════════════════════════════════ */
function RadialScore({ value, size = 64, compliant, evaluated }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = evaluated ? (value / 100) * circ : 0;
  const color = !evaluated ? "#e5e7eb" : compliant ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={5} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLAUSE CARD
═══════════════════════════════════════════════════════════ */
function ClauseCard({ item, index, onClick }) {
  const [hov, setHov] = useState(false);
  const { clause, computedScore, isFullyCompliant, subConformities, totalSubClauses, actionCount, doneCount, inProgress } = item;
  const num  = parseInt(clause.number);
  const meta = CLAUSE_META[num] || CLAUSE_META[4];
  const pdca = PDCA_COLORS[meta.phase];

  const hasEvaluated  = Object.values(subConformities || {}).some(c => c.status !== "non-évalué");
  const conformeCount = Object.values(subConformities || {}).filter(c => c.status === "conforme").length;
  const totalSub      = totalSubClauses || Object.keys(subConformities || {}).length;

  const statusColor  = !hasEvaluated ? "#9CA3AF" : isFullyCompliant ? "#10B981" : "#EF4444";
  const statusLabel  = !hasEvaluated ? "Non évalué" : isFullyCompliant ? "Conforme" : "Non conforme";
  const statusBg     = !hasEvaluated ? "#F9FAFB" : isFullyCompliant ? "#ECFDF5" : "#FEF2F2";
  const statusBorder = !hasEvaluated ? "#E5E7EB" : isFullyCompliant ? "#6EE7B7" : "#FCA5A5";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? "0 20px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(30,58,95,.12)"
          : "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)",
        transition: "transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1)",
        animationDelay: `${index * 60}ms`,
        animation: "slideUp .5s cubic-bezier(.4,0,.2,1) both",
      }}
    >
      <div style={{
        height: 4,
        background: isFullyCompliant
          ? "linear-gradient(90deg, #10B981, #34D399)"
          : hasEvaluated
          ? "linear-gradient(90deg, #EF4444, #F87171)"
          : "linear-gradient(90deg, #E5E7EB, #D1D5DB)",
      }} />

      <div style={{ padding: "20px 22px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(30,58,138,.3)",
            }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.5px" }}>
                {clause.number}
              </span>
            </div>

            <div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: ".8px",
                textTransform: "uppercase",
                color: pdca.text, background: pdca.bg,
                padding: "2px 7px", borderRadius: 99,
                marginBottom: 4,
              }}>
                {meta.phase} · {pdca.label}
              </span>
              <div style={{
                fontSize: 13.5, fontWeight: 700, color: "#111827",
                lineHeight: 1.25, fontFamily: "'Sora', sans-serif",
                letterSpacing: "-.2px",
              }}>
                {clause.title}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", flexShrink: 0 }}>
            <RadialScore value={computedScore} size={52} compliant={isFullyCompliant} evaluated={hasEvaluated} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: "rotate(90deg)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#111827", fontFamily: "'Sora', sans-serif" }}>
                {hasEvaluated ? `${computedScore}%` : "—"}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 99, padding: "4px 10px",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
          {hasEvaluated && (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>· {conformeCount}/{totalSub} sous-clauses</span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { label: "Plans",    value: actionCount, accent: "#3B82F6" },
            { label: "Terminés", value: doneCount,   accent: "#10B981" },
            { label: "En cours", value: inProgress,  accent: "#8B5CF6" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#F9FAFB",
              borderRadius: 10, padding: "10px 8px",
              textAlign: "center",
              border: "1px solid #F3F4F6",
            }}>
              <div style={{
                fontSize: 20, fontWeight: 800, lineHeight: 1,
                color: s.value > 0 ? s.accent : "#D1D5DB",
                fontFamily: "'Sora', sans-serif", letterSpacing: "-1.5px",
              }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginTop: 3, letterSpacing: ".4px", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          marginTop: 14, gap: 4,
          fontSize: 12, fontWeight: 600,
          color: hov ? "#1D4ED8" : "#9CA3AF",
          transition: "color .15s",
        }}>
          Voir le détail
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   KPI STRIP
═══════════════════════════════════════════════════════════ */
function KpiStrip({ stats }) {
  const kpis = [
    { label: "Conformité globale",  value: `${Math.round(stats.averageConformity)}%`, sub: `${stats.totalClauses} clauses`,              color: "#1D4ED8", bg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)", light: false },
    { label: "Clauses conformes",   value: stats.conformeClauses,                     sub: `${stats.nonConformeClauses} non conformes`,   color: "#10B981", bg: "#fff", light: true },
    { label: "Plans d'action",      value: stats.totalActions,                        sub: `${stats.completedActions} terminés`,           color: "#8B5CF6", bg: "#fff", light: true },
    { label: "Actions en retard",   value: stats.delayedActions,                      sub: `${stats.inProgressActions} en cours`,          color: "#EF4444", bg: "#fff", light: true },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: k.bg,
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: k.light ? "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)" : "0 8px 24px rgba(29,78,216,.35)",
          animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
        }}>
          <div style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1,
            color: k.light ? "#111827" : "#fff",
            fontFamily: "'Sora', sans-serif", letterSpacing: "-1.5px",
          }}>{k.value}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: k.light ? "#374151" : "rgba(255,255,255,.9)", marginTop: 6 }}>{k.label}</div>
          <div style={{ fontSize: 11.5, color: k.light ? "#9CA3AF" : "rgba(255,255,255,.6)", marginTop: 2 }}>{k.sub}</div>
          {!k.light && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${Math.round(stats.averageConformity)}%`,
                background: "rgba(255,255,255,.8)",
                borderRadius: 99,
                transition: "width 1.2s cubic-bezier(.4,0,.2,1) .3s",
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════ */
function FilterBar({ active, onChange, counts }) {
  const tabs = [
    { id: "all",          label: "Toutes",        count: counts.all },
    { id: "non-conforme", label: "Non conformes", count: counts.nc  },
    { id: "conforme",     label: "Conformes",     count: counts.ok  },
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
          transition: "all .2s",
          fontFamily: "'Sora', sans-serif",
          boxShadow: active === t.id ? "0 4px 12px rgba(29,78,216,.3)" : "none",
        }}>
          {t.label}
          <span style={{
            minWidth: 20, height: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: active === t.id ? "rgba(255,255,255,.25)" : "#F3F4F6",
            color: active === t.id ? "#fff" : "#6B7280",
            padding: "0 5px",
          }}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PDCA LEGEND
═══════════════════════════════════════════════════════════ */
function PdcaLegend() {
  const phases = [
    { key: "P", label: "Plan",  clauses: "§ 4–6", color: PDCA_COLORS.P },
    { key: "D", label: "Do",    clauses: "§ 7–8", color: PDCA_COLORS.D },
    { key: "C", label: "Check", clauses: "§ 9",   color: PDCA_COLORS.C },
    { key: "A", label: "Act",   clauses: "§ 10",  color: PDCA_COLORS.A },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {phases.map(p => (
        <div key={p.key} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 99,
          background: p.color.bg, border: `1px solid ${p.color.bg}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: p.color.text, fontFamily: "'Sora', sans-serif" }}>{p.key}</span>
          <span style={{ fontSize: 11, color: p.color.text, opacity: .7 }}>· {p.label} {p.clauses}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
      <div style={{ height: 4, background: "#F3F4F6" }} />
      <div style={{ padding: "20px 22px" }}>
        {[52, 16, 12, 8].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 8, background: "#F3F4F6",
            marginBottom: 14,
            animation: "shimmer 1.5s ease-in-out infinite",
            animationDelay: `${i * .1}s`,
            width: ["44px", "75%", "100%", "45%"][i],
          }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════ */
export default function ClausesDashboard() {
  const navigate = useNavigate();
  const { canRead, canExport } = useAuth();
  const moduleCode = "clauses";
  const hasAccess = canRead(moduleCode);
  
  const [dashboard, setDashboard] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, statsData] = await Promise.all([
        getDashboard(),
        getGlobalStats(),
      ]);

      const safeData = Array.isArray(dashboardData) ? dashboardData : [];
      setDashboard(safeData);
      setStats(mergeStats(statsData, safeData));
    } catch (e) {
      setError(e.message || "Erreur de chargement des données");
      setDashboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = dashboard
    .filter(item => {
      if (filter === "all") return true;
      const hasEvaluated = Object.values(item.subConformities || {}).some(c => c.status !== "non-évalué");
      if (filter === "conforme")     return item.isFullyCompliant;
      if (filter === "non-conforme") return !item.isFullyCompliant && hasEvaluated;
      return true;
    })
    .sort((a, b) => parseInt(a.clause.number) - parseInt(b.clause.number));

  const counts = {
    all: dashboard.length,
    nc:  dashboard.filter(i => {
      const hasEval = Object.values(i.subConformities || {}).some(c => c.status !== "non-évalué");
      return !i.isFullyCompliant && hasEval;
    }).length,
    ok: dashboard.filter(i => i.isFullyCompliant).length,
  };

  // Vérification d'accès
  if (!hasAccess) {
    return (
      <div style={{minHeight: "100vh", background: "#F8F9FB", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12}}>
        <FontAwesomeIcon icon={faTriangleExclamation} style={{fontSize: 48, color: "#EF4444"}}/>
        <div style={{fontSize: 18, fontWeight: 700, color: "#374151"}}>Accès non autorisé</div>
        <p style={{fontSize: 13, color: "#64748B"}}>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8F9FB",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "36px 36px 60px", width: "100%" }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h1 style={{
                  fontSize: 26, fontWeight: 800, color: "#111827", margin: 0,
                  fontFamily: "'Sora', sans-serif", letterSpacing: "-0.8px",
                }}>
                  Clauses normatives
                </h1>
              </div>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
                Exigences du SMSI — suivi de conformité et plans d'action associés
              </p>
            </div>
            <PdcaLegend />
          </div>
        </div>

        {/* KPIs */}
        {stats && <KpiStrip stats={stats} />}

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <FilterBar active={filter} onChange={setFilter} counts={counts} />
          {canExport(moduleCode) && (
            <button onClick={load} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 99,
              border: "1.5px solid #E5E7EB", background: "#fff",
              color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Sora', sans-serif",
              transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#1D4ED8"; e.currentTarget.style.color = "#1D4ED8"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#374151"; }}
            >
              <FontAwesomeIcon icon={faRotateRight} /> Actualiser
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FCA5A5",
            borderRadius: 10, padding: "12px 16px",
            color: "#991B1B", fontSize: 13, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 16 }}>
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} />)
            : filtered.length === 0
            ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", fontFamily: "'Sora', sans-serif" }}>
                  Aucune clause dans cette catégorie
                </div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
                  Essayez un autre filtre
                </div>
              </div>
            )
            : filtered.map((item, i) => (
              <ClauseCard
                key={item.clause.id}
                item={item}
                index={i}
                onClick={() => navigate(`/clauses/${item.clause.id}`)}
              />
            ))
          }
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: .4; }
        }

        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
    </div>
  );
}