// Progression.jsx - Version avec style KPI identique à ClausesDashboard

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCycle, getCycles, createCycle,
  addSection, renameSection, deleteSection,
  addItem, updateItem, deleteItem,
} from "../api/pdca";

const toBack = s => {
  if (s === "ip")   return "in-progress";
  if (s === "done") return "completed";
  if (s === "todo") return "pending";
  return s;
};

const toFront = s => {
  if (s === "in-progress") return "ip";
  if (s === "completed")   return "done";
  if (s === "pending")     return "todo";
  return s;
};

// ── Palette bleue par degrés ──────────────────────────────────────────────────
// PLAN  : bleu ciel clair  (#38BDF8 → #0284C7)
// DO    : bleu royal       (#3B82F6 → #1D4ED8)
// CHECK : bleu marine      (#1E40AF → #1E3A8A)
// ACT   : bleu nuit        (#1E3A8A → #0F172A)
const INITIAL_DATA = {
  plan: {
    key: "plan", label: "PLAN", sub: "Planification & Cadrage",
    color: "#0284C7", darkColor: "#0369A1", lightBg: "#E0F2FE", borderColor: "#BAE6FD",
    gradStart: "#38BDF8", gradEnd: "#0284C7", sections: []
  },
  do: {
    key: "do", label: "DO", sub: "Déploiement & Mise en œuvre",
    color: "#2563EB", darkColor: "#1D4ED8", lightBg: "#EFF6FF", borderColor: "#BFDBFE",
    gradStart: "#60A5FA", gradEnd: "#1D4ED8", sections: []
  },
  check: {
    key: "check", label: "CHECK", sub: "Surveillance & Évaluation",
    color: "#1E40AF", darkColor: "#1E3A8A", lightBg: "#EEF2FF", borderColor: "#C7D2FE",
    gradStart: "#4F46E5", gradEnd: "#1E3A8A", sections: []
  },
  act: {
    key: "act", label: "ACT", sub: "Amélioration & Certification",
    color: "#1E3A8A", darkColor: "#0F172A", lightBg: "#F0F4FF", borderColor: "#A5B4FC",
    gradStart: "#3730A3", gradEnd: "#0F172A", sections: []
  },
};

const STATUS_CYCLE = { done: "todo", todo: "ip", ip: "done" };
const STATUS_LABEL = { done: "Terminé", todo: "À faire", ip: "En cours" };
const STATUS_STYLE = {
  done: { bg: "#DBEAFE", color: "#1D4ED8" },
  todo: { bg: "#F1F5F9", color: "#64748B" },
  ip:   { bg: "#E0F2FE", color: "#0284C7" },
};
const WHEEL_SHIFT = { plan: "right", do: "left", check: "left", act: "right" };
const SLICE_POP   = { plan: { tx: -22, ty: -22 }, do: { tx: 22, ty: -22 }, check: { tx: 22, ty: 22 }, act: { tx: -22, ty: 22 } };
const PANEL_POS   = { plan: { side: "left", vert: "top" }, do: { side: "right", vert: "top" }, check: { side: "right", vert: "bottom" }, act: { side: "left", vert: "bottom" } };

const VB = 500, CX = 250, CY = 250, OUTER_R = 190, INNER_R = 72;

const SEGMENTS  = [
  { key: "plan",  start: 180, end: 270 },
  { key: "do",    start: 270, end: 360 },
  { key: "check", start: 0,   end: 90  },
  { key: "act",   start: 90,  end: 180 },
];
const LABEL_POS = { plan: { x: 157, y: 157 }, do: { x: 343, y: 157 }, check: { x: 343, y: 343 }, act: { x: 157, y: 343 } };
const SEP_LINES = [0, 90, 180, 270].map(deg => {
  const r = deg * Math.PI / 180;
  return {
    x1: CX + INNER_R * Math.cos(r), y1: CY + INNER_R * Math.sin(r),
    x2: CX + OUTER_R * Math.cos(r), y2: CY + OUTER_R * Math.sin(r)
  };
});

const AXE_ROUTES = {
  "tableau-bord": "/dashboard", "pdca": "/pdca", "clauses": "/Clausesdashboard",
  "controles": "/controles", "documentation": "/documentation",
  "risques": "/risques", "audits": "/audits", "actifs": "/actifs",
};

function transformCycle(cycle, fallback) {
  if (!cycle || !cycle.phases || !Array.isArray(cycle.phases)) {
    return JSON.parse(JSON.stringify(fallback));
  }
  const result = {};
  for (const phaseKey of ['plan', 'do', 'check', 'act']) {
    result[phaseKey] = { ...fallback[phaseKey], phaseId: null, sections: [] };
  }
  for (const phase of cycle.phases) {
    const key = phase.key?.toLowerCase();
    if (!key || !result[key]) continue;
    result[key].phaseId = phase.id;
    result[key].sections = (phase.sections || []).map(s => ({
      id: s.id,
      title: s.title ?? '',
      items: (s.items || []).map(i => ({
        id: i.id,
        name: i.text ?? '',
        s: toFront(i.status),
      })),
    }));
  }
  return result;
}

function calcPct(ph) {
  const all = ph.sections.flatMap(s => s.items);
  if (!all.length) return 0;
  return Math.round(all.filter(i => i.s === "done").length / all.length * 100);
}

function calcGlobal(data) {
  const all  = Object.values(data).flatMap(p => p.sections).flatMap(s => s.items);
  const done = all.filter(i => i.s === "done").length;
  const ip   = all.filter(i => i.s === "ip").length;
  return { pct: all.length ? Math.round(done / all.length * 100) : 0, done, ip, total: all.length };
}

function donutPath(startDeg, endDeg) {
  const rad = d => d * Math.PI / 180;
  const s = rad(startDeg), e = rad(endDeg);
  const lg = (endDeg - startDeg) > 180 ? 1 : 0;
  const f  = v => v.toFixed(4);
  const ox1 = CX + OUTER_R * Math.cos(s), oy1 = CY + OUTER_R * Math.sin(s);
  const ox2 = CX + OUTER_R * Math.cos(e), oy2 = CY + OUTER_R * Math.sin(e);
  const ix1 = CX + INNER_R * Math.cos(e), iy1 = CY + INNER_R * Math.sin(e);
  const ix2 = CX + INNER_R * Math.cos(s), iy2 = CY + INNER_R * Math.sin(s);
  return `M${f(ox1)} ${f(oy1)} A${OUTER_R} ${OUTER_R} 0 ${lg} 1 ${f(ox2)} ${f(oy2)} L${f(ix1)} ${f(iy1)} A${INNER_R} ${INNER_R} 0 ${lg} 0 ${f(ix2)} ${f(iy2)}Z`;
}

const PATHS = Object.fromEntries(SEGMENTS.map(({ key, start, end }) => [key, donutPath(start, end)]));

/* ════════ KPI STRIP (Style identique à ClausesDashboard) ════════ */
function KpiStrip({ data }) {
  const g = calcGlobal(data);
  
  // Calcul des valeurs pour chaque phase
  const planPct = calcPct(data.plan);
  const doPct = calcPct(data.do);
  const checkPct = calcPct(data.check);
  const actPct = calcPct(data.act);

  // Format identique à ClausesDashboard
  const kpis = [
    { 
      label: "Conformité PDCA",  
      value: `${g.pct}%`, 
      sub: `${g.total} actions totales`, 
      color: "#1D4ED8", 
      bg: "linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)", 
      light: false,
      progress: g.pct
    },
    { 
      label: "Actions terminées",   
      value: g.done,                     
      sub: `${g.ip} en cours`,   
      color: "#10B981", 
      bg: "#fff", 
      light: true 
    },
    { 
      label: "Plan (Phase P)",      
      value: `${planPct}%`,                        
      sub: `${data.plan.sections.flatMap(s => s.items).length} actions`,          
      color: "#0284C7", 
      bg: "#fff", 
      light: true 
    },
    { 
      label: "Do (Phase D)",   
      value: `${doPct}%`,                      
      sub: `${data.do.sections.flatMap(s => s.items).length} actions`,         
      color: "#2563EB", 
      bg: "#fff", 
      light: true 
    },
    { 
      label: "Check (Phase C)",   
      value: `${checkPct}%`,                      
      sub: `${data.check.sections.flatMap(s => s.items).length} actions`,         
      color: "#1E40AF", 
      bg: "#fff", 
      light: true 
    },
    { 
      label: "Act (Phase A)",   
      value: `${actPct}%`,                      
      sub: `${data.act.sections.flatMap(s => s.items).length} actions`,         
      color: "#0F172A", 
      bg: "#fff", 
      light: true 
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: k.bg,
          borderRadius: 14,
          padding: "20px 22px",
          boxShadow: k.light 
            ? "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)" 
            : "0 8px 24px rgba(29,78,216,.35)",
          animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
        }}>
          <div style={{
            fontSize: 32, fontWeight: 800, lineHeight: 1,
            color: k.light ? "#111827" : "#fff",
            fontFamily: "'Sora', sans-serif", letterSpacing: "-1.5px",
          }}>{k.value}</div>
          <div style={{ 
            fontSize: 12.5, fontWeight: 600, 
            color: k.light ? "#374151" : "rgba(255,255,255,.9)", 
            marginTop: 6 
          }}>{k.label}</div>
          <div style={{ 
            fontSize: 11.5, 
            color: k.light ? "#9CA3AF" : "rgba(255,255,255,.6)", 
            marginTop: 2 
          }}>{k.sub}</div>
          {!k.light && (
            <div style={{ 
              marginTop: 12, height: 4, borderRadius: 99, 
              background: "rgba(255,255,255,.2)", overflow: "hidden" 
            }}>
              <div style={{
                height: "100%", width: `${k.progress}%`,
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

/* ════════ SECTION ROW ════════ */
function SectionRow({ sec, phaseKey, phase, editMode, onToggle, onDeleteItem, onDeleteSection, onRenameSection, onAddItem }) {
  const [open, setOpen]               = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal]       = useState(sec.title ?? '');
  const [newItemName, setNewItemName] = useState("");
  const titleRef = useRef(null);

  useEffect(() => { setTitleVal(sec.title ?? ''); }, [sec.title]);
  useEffect(() => { if (editingTitle && titleRef.current) titleRef.current.focus(); }, [editingTitle]);

  const saveTitle = () => {
    const t = (titleVal ?? '').trim();
    if (t && t !== sec.title) onRenameSection(phaseKey, sec.id, t);
    setEditingTitle(false);
  };

  const done  = sec.items.filter(i => i.s === "done").length;
  const total = sec.items.length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 10px", borderRadius: 9, cursor: "pointer", userSelect: "none"
      }}
        onClick={() => !editingTitle && setOpen(o => !o)}
        onMouseEnter={e => e.currentTarget.style.background = "#F0F4FF"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "#0D1117", minWidth: 0, flex: 1 }}>
          <span style={{ color: phase.color, flexShrink: 0, fontSize: 13 }}>🔷</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editMode && editingTitle ? (
              <input ref={titleRef} value={titleVal} onChange={e => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%", fontSize: 11.5, fontWeight: 600,
                  border: `1.5px solid ${phase.color}`, borderRadius: 6,
                  padding: "2px 6px", outline: "none", background: "#fff", color: "#0D1117"
                }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sec.title}</span>
                {editMode && (
                  <button onClick={e => { e.stopPropagation(); setEditingTitle(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#94A3B8", padding: 0, flexShrink: 0, lineHeight: 1 }}>✎</button>
                )}
              </div>
            )}
            <div style={{ width: 42, height: 3, background: "#DBEAFE", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: pct + "%", background: phase.color, borderRadius: 99, transition: "width .5s" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            background: phase.lightBg, color: phase.color,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            padding: "2px 7px", borderRadius: 5, fontWeight: 600
          }}>{done}/{total}</span>
          {editMode && (
            <button onClick={e => { e.stopPropagation(); onDeleteSection(phaseKey, sec.id); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#93C5FD", padding: "0 2px", lineHeight: 1 }}>🗑</button>
          )}
          <span style={{ fontSize: 10, color: "#94A3B8", display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ paddingLeft: 4 }}>
          {sec.items.map(item => {
            const ss = STATUS_STYLE[item.s] ?? STATUS_STYLE["todo"];
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", borderRadius: 8, marginBottom: 2,
                border: "1px solid transparent", transition: "all .15s"
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                <div onClick={() => onToggle(phaseKey, sec.id, item.id)} style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                  border: item.s === "done" ? "none" : item.s === "ip" ? `1.5px solid ${phase.color}` : "1.5px solid #BFDBFE",
                  background: item.s === "done" ? phase.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", transition: "all .2s"
                }}>
                  {item.s === "done" && "✓"}
                  {item.s === "ip"   && <div style={{ width: 6, height: 6, borderRadius: "50%", background: phase.color }} />}
                </div>
                <span onClick={() => onToggle(phaseKey, sec.id, item.id)} style={{
                  flex: 1, fontSize: 11, lineHeight: 1.4, cursor: "pointer",
                  color: item.s === "done" ? "#93C5FD" : "#374151",
                  textDecoration: item.s === "done" ? "line-through" : "none"
                }}>{item.name}</span>
                <span onClick={() => onToggle(phaseKey, sec.id, item.id)} style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                  padding: "2px 7px", borderRadius: 4, fontWeight: 600,
                  background: ss.bg, color: ss.color, flexShrink: 0, cursor: "pointer"
                }}>{STATUS_LABEL[item.s]}</span>
                {editMode && (
                  <button onClick={() => onDeleteItem(phaseKey, sec.id, item.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: "#BFDBFE", padding: 0, flexShrink: 0, lineHeight: 1, transition: "color .15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "#3B82F6"}
                    onMouseLeave={e => e.currentTarget.style.color = "#BFDBFE"}>✕</button>
                )}
              </div>
            );
          })}
          {editMode && (
            <div style={{ display: "flex", gap: 6, padding: "5px 10px 7px" }}>
              <input value={newItemName} onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newItemName.trim()) {
                    onAddItem(phaseKey, sec.id, newItemName.trim());
                    setNewItemName("");
                  }
                }}
                placeholder="Ajouter une action…"
                style={{
                  flex: 1, fontSize: 11, padding: "5px 10px", borderRadius: 8,
                  outline: "none", border: `1.5px solid ${phase.borderColor}`,
                  background: phase.lightBg, color: "#1E3A8A"
                }} />
              <button onClick={() => {
                if (newItemName.trim()) {
                  onAddItem(phaseKey, sec.id, newItemName.trim());
                  setNewItemName("");
                }
              }} style={{
                padding: "5px 12px", borderRadius: 8, border: "none",
                background: phase.color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
              }}>+</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════ PHASE PANEL ════════ */
function PhasePanel({ phase, isOpen, onClose, onToggle, onDeleteItem, onDeleteSection, onRenameSection, onAddItem, onAddSection }) {
  const [editMode, setEditMode]     = useState(false);
  const [newSecName, setNewSecName] = useState("");
  const newSecRef = useRef(null);
  const pos  = PANEL_POS[phase.key];
  const pct  = calcPct(phase);
  const all  = phase.sections.flatMap(s => s.items);
  const stats = {
    done:  all.filter(i => i.s === "done").length,
    ip:    all.filter(i => i.s === "ip").length,
    todo:  all.filter(i => i.s === "todo").length,
    total: all.length
  };
  const circ = 2 * Math.PI * 20;

  useEffect(() => { if (!isOpen) { setEditMode(false); setNewSecName(""); } }, [isOpen]);
  useEffect(() => { if (editMode && newSecRef.current) newSecRef.current.focus(); }, [editMode]);

  return (
    <div style={{
      position: "absolute", width: 405, maxHeight: "74vh",
      background: "#fff", border: "1px solid #DBEAFE", borderRadius: 20,
      boxShadow: `0 12px 48px ${phase.color}30, 0 4px 16px rgba(30,64,175,.10)`,
      overflow: "hidden", zIndex: 10, opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none", display: "flex", flexDirection: "column",
      transition: "opacity .4s ease, transform .45s cubic-bezier(.34,1.15,.64,1)",
      ...(pos.side === "left" ? { left: 28 } : { right: 28 }),
      ...(pos.vert === "top"  ? { top: 0 }   : { bottom: 0 }),
      transform: isOpen ? "translateX(0) scale(1)" :
        pos.side === "left" ? "translateX(-24px) scale(.97)" : "translateX(24px) scale(.97)"
    }}>
      {/* Header gradient bleu propre à chaque phase */}
      <div style={{
        padding: "16px 18px 14px",
        background: `linear-gradient(135deg,${phase.gradStart} 0%,${phase.gradEnd} 100%)`,
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
              <svg width="46" height="46" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="23" cy="23" r="20" fill="rgba(0,0,0,.15)" />
                <circle cx="23" cy="23" r="20" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="3.5" />
                <circle cx="23" cy="23" r="20" fill="none" stroke="white" strokeWidth="3.5"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }} />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9.5, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono',monospace"
              }}>{pct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-.3px", lineHeight: 1.1 }}>{phase.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.8)", marginTop: 2 }}>{phase.sub}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.4)",
            background: "rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", fontSize: 12,
            fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.15)"; }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Terminées", value: stats.done, color: "rgba(255,255,255,.95)" },
            { label: "En cours",  value: stats.ip,   color: "rgba(255,255,255,.75)" },
            { label: "À faire",   value: stats.todo, color: "rgba(255,255,255,.55)" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: "rgba(0,0,0,.18)", borderRadius: 9,
              padding: "6px 8px", textAlign: "center"
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {phase.sections.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#93C5FD", fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔷</div>
            Aucune catégorie. Activez le mode édition pour commencer.
          </div>
        ) : (
          phase.sections.map(sec => (
            <SectionRow key={sec.id} sec={sec} phaseKey={phase.key} phase={phase}
              editMode={editMode} onToggle={onToggle} onDeleteItem={onDeleteItem}
              onDeleteSection={onDeleteSection} onRenameSection={onRenameSection} onAddItem={onAddItem} />
          ))
        )}
      </div>

      <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #DBEAFE", flexShrink: 0 }}>
        {editMode ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={newSecRef} value={newSecName} onChange={e => setNewSecName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newSecName.trim()) {
                  onAddSection(phase.key, newSecName.trim());
                  setNewSecName("");
                }
              }}
              placeholder="Nom de la catégorie…"
              style={{
                flex: 1, fontSize: 11, padding: "6px 10px", borderRadius: 8,
                outline: "none", border: `1.5px solid ${phase.borderColor}`,
                background: phase.lightBg, color: "#1E3A8A"
              }} />
            <button onClick={() => {
              if (newSecName.trim()) { onAddSection(phase.key, newSecName.trim()); setNewSecName(""); }
            }} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: phase.color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>+</button>
            <button onClick={() => setEditMode(false)} style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid #BFDBFE",
              background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, cursor: "pointer"
            }}>✓ Fin</button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)} style={{
            width: "100%", padding: "7px", borderRadius: 9,
            border: `1.5px dashed ${phase.borderColor}`, background: phase.lightBg,
            color: phase.color, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = phase.color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderStyle = "solid"; }}
            onMouseLeave={e => { e.currentTarget.style.background = phase.lightBg; e.currentTarget.style.color = phase.color; e.currentTarget.style.borderStyle = "dashed"; }}>
            ✎ Mode édition
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════ TOAST ════════ */
function Toast({ msg, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      background: "#1E3A8A", color: "#fff", padding: "10px 22px",
      borderRadius: 99, fontSize: 13, fontWeight: 600,
      opacity: visible ? 1 : 0, pointerEvents: "none",
      transition: "all .35s cubic-bezier(.34,1.3,.64,1)",
      boxShadow: "0 8px 28px rgba(30,58,138,.35)", zIndex: 9999,
      fontFamily: "'Sora',sans-serif"
    }}>{msg}</div>
  );
}

/* ════════ MAIN ════════ */
export default function Progression() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data,     setData]     = useState(INITIAL_DATA);
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const [toast,    setToast]    = useState({ msg: "", visible: false });
  const [activeAxe, setActiveAxe] = useState("pdca");
  const [cycleId,  setCycleId]  = useState(null);
  const toastRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cycles = await getCycles();
        const list   = Array.isArray(cycles) ? cycles : [];
        if (list.length > 0) {
          const id    = list[0].id;
          const cycle = await getCycle(id);
          setCycleId(id);
          setData(transformCycle(cycle, INITIAL_DATA));
        } else {
          const created = await createCycle("Cycle PDCA");
          const cycle   = await getCycle(created.id);
          setCycleId(created.id);
          setData(transformCycle(cycle, INITIAL_DATA));
        }
      } catch (e) {
        console.error("Erreur chargement PDCA:", e);
      }
    })();
  }, []);

  const mutate = useCallback(fn => {
    setData(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
  }, []);

  const handleToggle = useCallback(async (phaseKey, secId, itemId) => {
    const currentItem = data[phaseKey]?.sections
      .find(s => s.id === secId)?.items
      .find(i => i.id === itemId);
    if (!currentItem) return;
    const oldStatus = currentItem.s;
    const newStatus = STATUS_CYCLE[oldStatus];
    if (!newStatus) return;

    mutate(d => {
      const item = d[phaseKey]?.sections.find(s => s.id === secId)?.items.find(i => i.id === itemId);
      if (item) item.s = newStatus;
    });

    try {
      await updateItem(itemId, toBack(newStatus));
      showToast({ done: "✅ Terminé !", ip: "⏳ En cours", todo: "↩ À faire" }[newStatus] || "");
    } catch (e) {
      console.error("Erreur mise à jour statut:", e);
      mutate(d => {
        const item = d[phaseKey]?.sections.find(s => s.id === secId)?.items.find(i => i.id === itemId);
        if (item) item.s = oldStatus;
      });
      showToast("❌ Erreur — modification annulée");
    }
  }, [data, mutate, showToast]);

  const handleDeleteItem = useCallback(async (pk, sid, iid) => {
    mutate(d => {
      const sec = d[pk].sections.find(s => s.id === sid);
      if (sec) sec.items = sec.items.filter(i => i.id !== iid);
    });
    try {
      await deleteItem(iid);
      showToast("🗑 Action supprimée");
    } catch (e) {
      console.error("Erreur suppression item:", e);
      showToast("❌ Erreur lors de la suppression");
    }
  }, [mutate, showToast]);

  const handleDeleteSection = useCallback(async (pk, sid) => {
    mutate(d => { d[pk].sections = d[pk].sections.filter(s => s.id !== sid); });
    try {
      await deleteSection(sid);
      showToast("🗑 Catégorie supprimée");
    } catch (e) {
      console.error("Erreur suppression section:", e);
      showToast("❌ Erreur lors de la suppression");
    }
  }, [mutate, showToast]);

  const handleRenameSection = useCallback(async (pk, sid, name) => {
    mutate(d => {
      const sec = d[pk].sections.find(s => s.id === sid);
      if (sec) sec.title = name;
    });
    try {
      await renameSection(sid, name);
    } catch (e) {
      console.error("Erreur renommage:", e);
      showToast("❌ Erreur lors du renommage");
    }
  }, [mutate, showToast]);

  const handleAddItem = useCallback(async (pk, sid, name) => {
    try {
      const res   = await addItem({ sectionId: sid, text: name });
      const newId = res.id;
      mutate(d => {
        const sec = d[pk].sections.find(s => s.id === sid);
        if (sec) sec.items.push({ id: newId, name, s: "todo" });
      });
      showToast("✚ Action ajoutée");
    } catch (e) {
      console.error("Erreur ajout item:", e);
      showToast("❌ Erreur lors de l'ajout");
    }
  }, [mutate, showToast]);

  const handleAddSection = useCallback(async (pk, name) => {
    const phaseId = data[pk]?.phaseId;
    if (!phaseId) { showToast("❌ Phase non initialisée"); return; }
    try {
      const res   = await addSection({ phaseId, title: name });
      const newId = res.id;
      mutate(d => { d[pk].sections.push({ id: newId, title: name, items: [] }); });
      showToast("✚ Catégorie ajoutée");
    } catch (e) {
      console.error("Erreur ajout section:", e);
      showToast("❌ Erreur lors de l'ajout");
    }
  }, [mutate, showToast, data]);

  const handleLogout    = () => { logout(); navigate("/login"); };
  const handleAxeChange = id => { setActiveAxe(id); if (id !== "pdca" && AXE_ROUTES[id]) navigate(AXE_ROUTES[id]); };

  const global = calcGlobal(data);
  const HUB_R  = 52, hubCirc = 2 * Math.PI * HUB_R;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8F9FB",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden"
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
                  Cycle PDCA
                </h1>
              </div>
              <p style={{ fontSize: 13.5, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
                Planifier, Déployer, Contrôler, Améliorer — suivi des actions qualité
              </p>
            </div>
          </div>
        </div>

        {/* KPIs - Style identique à ClausesDashboard */}
        <KpiStrip data={data} />

        {/* Zone du diagramme PDCA */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 0 36px",
          minHeight: 550
        }}>
          <div style={{
            position: "absolute",
            left: selected ? (WHEEL_SHIFT[selected] === "right" ? "68%" : "32%") : "50%",
            top: "50%", transform: "translate(-50%,-50%)",
            transition: "left .65s cubic-bezier(.4,0,.2,1)", zIndex: 1
          }}>
            {/* Anneaux décoratifs — teintés bleu */}
            <div style={{
              position: "absolute", inset: -28, border: "1.5px dashed #BFDBFE",
              borderRadius: "50%", pointerEvents: "none", animation: "pdca-spin 28s linear infinite"
            }} />
            <div style={{
              position: "absolute", inset: -52, border: "1px dashed #DBEAFE",
              borderRadius: "50%", pointerEvents: "none", animation: "pdca-spin 45s linear infinite reverse"
            }} />

            <svg viewBox={`0 0 ${VB} ${VB}`} width="450" height="450" style={{ display: "block", overflow: "visible" }}>
              <defs>
                {/* Gradients bleutés par phase */}
                {Object.values(data).map(p => (
                  <radialGradient key={p.key} id={`rg_${p.key}`} cx="38%" cy="32%" r="72%">
                    <stop offset="0%" stopColor={p.gradStart} />
                    <stop offset="100%" stopColor={p.gradEnd} />
                  </radialGradient>
                ))}
                <filter id="disc-sh" x="-12%" y="-12%" width="124%" height="124%">
                  <feDropShadow dx="0" dy="5" stdDeviation="12" floodColor="rgba(30,64,175,.15)" />
                </filter>
              </defs>

              {/* Disque de fond */}
              <circle cx={CX} cy={CY} r={OUTER_R + 18} fill="white" filter="url(#disc-sh)" />
              <circle cx={CX} cy={CY} r={OUTER_R + 10} fill="none" stroke="#DBEAFE" strokeWidth="5" />

              {SEGMENTS.map(({ key, start, end }) => {
                const ph    = data[key];
                const isSel = selected === key;
                const isHov = hovered === key;
                const dim   = selected && !isSel;
                const { tx, ty } = SLICE_POP[key];
                const lp   = LABEL_POS[key];
                const pct  = calcPct(ph);
                const path = PATHS[key];
                return (
                  <g key={key} style={{
                    cursor: "pointer",
                    transform: isSel ? `translate(${tx}px,${ty}px)` : "translate(0,0)",
                    transformOrigin: `${CX}px ${CY}px`,
                    transition: "transform .5s cubic-bezier(.34,1.35,.64,1), opacity .3s",
                    opacity: dim ? 0.25 : 1
                  }}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(isSel ? null : key)}>
                    <path d={path} fill={`url(#rg_${key})`} />
                    {/* Overlay hover léger */}
                    {isHov && !isSel && <path d={path} fill="white" opacity="0.18" style={{ pointerEvents: "none" }} />}
                    {isSel && <path d={path} fill="white" opacity="0.10" style={{ pointerEvents: "none" }} />}

                    {/* Label phase */}
                    <text x={lp.x} y={lp.y - 9} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="16" fontWeight="800" fontFamily="'Sora',sans-serif"
                      letterSpacing="2" style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 4px rgba(0,0,0,.25))" }}>
                      {ph.label}
                    </text>
                    {/* Badge pourcentage */}
                    <rect x={lp.x - 25} y={lp.y + 1} width={50} height={19} rx={9} fill="rgba(0,0,0,.25)" />
                    <text x={lp.x} y={lp.y + 14} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="11" fontWeight="800" fontFamily="'JetBrains Mono',monospace"
                      style={{ pointerEvents: "none" }}>{pct}%</text>
                    {/* Compteur items */}
                    <text x={lp.x} y={lp.y + 33} textAnchor="middle" fill="rgba(255,255,255,.75)"
                      fontSize="9.5" fontFamily="'Sora',sans-serif" style={{ pointerEvents: "none" }}>
                      {ph.sections.flatMap(s => s.items).filter(i => i.s === "done").length}/
                      {ph.sections.flatMap(s => s.items).length}
                    </text>
                    {!selected && (
                      <text x={lp.x} y={lp.y + 50} textAnchor="middle"
                        fill={isHov ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.2)"}
                        fontSize="9" fontFamily="'Sora',sans-serif"
                        style={{ pointerEvents: "none", transition: "fill .2s" }}>
                        ↗ Explorer
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Séparateurs */}
              {SEP_LINES.map((ln, i) => (
                <line key={i} x1={ln.x1.toFixed(2)} y1={ln.y1.toFixed(2)}
                  x2={ln.x2.toFixed(2)} y2={ln.y2.toFixed(2)}
                  stroke="#EFF6FF" strokeWidth="5" strokeLinecap="square"
                  style={{ pointerEvents: "none" }} />
              ))}

              {/* Hub central */}
              <circle cx={CX} cy={CY} r={INNER_R} fill="white" />
              <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="#EEF2FF" strokeWidth="2" />
              <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke="#DBEAFE" strokeWidth="7" />
              {/* Arc de progression global — bleu marine */}
              <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke="#1D4ED8" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={hubCirc}
                strokeDashoffset={hubCirc * (1 - global.pct / 100)}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }} />

              {/* Texte hub */}
              <text x={CX} y={CY - 12} textAnchor="middle" fill="#1E3A8A" fontSize="18"
                fontWeight="800" fontFamily="'Sora',sans-serif" letterSpacing="-1">{global.pct}%</text>
              <text x={CX} y={CY + 4} textAnchor="middle" fill="#3B82F6" fontSize="9"
                fontWeight="700" fontFamily="'Sora',sans-serif" letterSpacing="2.5">PDCA</text>
              <text x={CX} y={CY + 18} textAnchor="middle" fill="#93C5FD" fontSize="7"
                fontFamily="'Sora',sans-serif" letterSpacing="1.5">QUALITY CYCLE</text>
            </svg>
          </div>

          {Object.values(data).map(ph => (
            <PhasePanel key={ph.key} phase={ph} isOpen={selected === ph.key}
              onClose={() => setSelected(null)}
              onToggle={handleToggle} onDeleteItem={handleDeleteItem}
              onDeleteSection={handleDeleteSection} onRenameSection={handleRenameSection}
              onAddItem={handleAddItem} onAddSection={handleAddSection} />
          ))}

          {!selected && (
            <p style={{
              position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
              fontSize: 12, color: "#93C5FD", whiteSpace: "nowrap", pointerEvents: "none",
              animation: "pdca-blink 2.5s ease-in-out infinite"
            }}>↻ Cliquez sur une phase pour l'explorer</p>
          )}

          {/* Légende statuts — tons bleutés */}
          <div style={{
            position: "absolute", bottom: -10, right: 0, display: "flex", gap: 14,
            background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
            padding: "7px 16px", borderRadius: 99, border: "1px solid #DBEAFE",
            boxShadow: "0 2px 8px rgba(30,64,175,.08)"
          }}>
            {[
              { label: "Terminé",  color: "#1D4ED8" },
              { label: "En cours", color: "#0284C7" },
              { label: "À faire",  color: "#CBD5E1" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Toast msg={toast.msg} visible={toast.visible} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes pdca-spin  { to { transform: rotate(360deg); } }
        @keyframes pdca-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#BFDBFE; border-radius:99px; }
        ::-webkit-scrollbar-thumb:hover { background:#93C5FD; }
      `}</style>
    </div>
  );
}