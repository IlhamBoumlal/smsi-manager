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

const INITIAL_DATA = {
  plan: {
    key: "plan", label: "PLAN", sub: "Planification & Cadrage",
    color: "#F59E0B", darkColor: "#B45309", lightBg: "#FFF7E6", borderColor: "#FDE68A",
    gradStart: "#FCD34D", gradEnd: "#D97706", sections: []
  },
  do: {
    key: "do", label: "DO", sub: "Déploiement & Mise en œuvre",
    color: "#10B981", darkColor: "#047857", lightBg: "#E6FAF4", borderColor: "#A7F3D0",
    gradStart: "#34D399", gradEnd: "#047857", sections: []
  },
  check: {
    key: "check", label: "CHECK", sub: "Surveillance & Évaluation",
    color: "#3B82F6", darkColor: "#1D4ED8", lightBg: "#EFF6FF", borderColor: "#BFDBFE",
    gradStart: "#60A5FA", gradEnd: "#1D4ED8", sections: []
  },
  act: {
    key: "act", label: "ACT", sub: "Amélioration & Certification",
    color: "#EF4444", darkColor: "#B91C1C", lightBg: "#FEF2F2", borderColor: "#FECACA",
    gradStart: "#F87171", gradEnd: "#B91C1C", sections: []
  },
};

const STATUS_CYCLE = { done: "todo", todo: "ip", ip: "done" };
const STATUS_LABEL = { done: "Terminé", todo: "À faire", ip: "En cours" };
const STATUS_STYLE = {
  done: { bg: "#DCFCE7", color: "#16A34A" },
  todo: { bg: "#F1F5F9", color: "#64748B" },
  ip:   { bg: "#FEF9C3", color: "#CA8A04" },
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

/* ════════ KPI STRIP ════════ */
function KpiStrip({ data }) {
  const sparkRef = useRef({ g: [], plan: [], do: [], check: [], act: [], done: [], ip: [] });
  const g = calcGlobal(data);
  const kpis = [
    { id: "g",     label: "GLOBAL",    value: g.pct,            sfx: "%", color: "#0D1117"        },
    { id: "plan",  label: "PLAN",      value: calcPct(data.plan),  sfx: "%", color: data.plan.color  },
    { id: "do",    label: "DO",        value: calcPct(data.do),    sfx: "%", color: data.do.color    },
    { id: "check", label: "CHECK",     value: calcPct(data.check), sfx: "%", color: data.check.color },
    { id: "act",   label: "ACT",       value: calcPct(data.act),   sfx: "%", color: data.act.color   },
    { id: "done",  label: "TERMINÉES", value: g.done,           sfx: "",  color: "#16A34A"        },
    { id: "ip",    label: "EN COURS",  value: g.ip,             sfx: "",  color: "#CA8A04"        },
  ];

  kpis.forEach(k => {
    sparkRef.current[k.id].push(k.value);
    if (sparkRef.current[k.id].length > 8) sparkRef.current[k.id].shift();
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, padding: "16px 36px 0" }}>
      {kpis.map(k => {
        const hist = sparkRef.current[k.id];
        const mx   = Math.max(...hist, 1);
        const prev = hist.length > 1 ? hist[hist.length - 2] : k.value;
        const diff = k.value - prev;
        return (
          <div key={k.id} style={{
            background: "#fff", border: "1px solid #E4E8F0", borderRadius: 14,
            padding: "12px 14px", position: "relative", overflow: "hidden",
            transition: "transform .2s, box-shadow .2s", cursor: "default"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: k.color, borderRadius: "14px 14px 0 0" }} />
            <div style={{ fontSize: 9.5, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-1px", color: k.color, lineHeight: 1 }}>{k.value}{k.sfx}</div>
            <div style={{ fontSize: 10, marginTop: 4, color: diff > 0 ? "#16A34A" : diff < 0 ? "#DC2626" : "#94A3B8" }}>
              {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : "→"} vs précédent
            </div>
            <div style={{ height: 22, marginTop: 7, display: "flex", alignItems: "flex-end", gap: 2 }}>
              {hist.map((v, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: "2px 2px 0 0", minHeight: 3,
                  height: Math.max(3, Math.round(v / mx * 20)),
                  background: k.color, opacity: 0.3 + 0.7 * (v / mx), transition: "height .5s"
                }} />
              ))}
            </div>
          </div>
        );
      })}
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
        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "#0D1117", minWidth: 0, flex: 1 }}>
          <span style={{ color: phase.color, flexShrink: 0, fontSize: 13 }}>🚩</span>
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
            <div style={{ width: 42, height: 3, background: "#E4E8F0", borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
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
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#FDA4AF", padding: "0 2px", lineHeight: 1 }}>🗑</button>
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
                onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E4E8F0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                <div onClick={() => onToggle(phaseKey, sec.id, item.id)} style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                  border: item.s === "done" ? "none" : item.s === "ip" ? `1.5px solid ${phase.color}` : "1.5px solid #CBD5E1",
                  background: item.s === "done" ? phase.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", transition: "all .2s"
                }}>
                  {item.s === "done" && "✓"}
                  {item.s === "ip"   && <div style={{ width: 6, height: 6, borderRadius: "50%", background: phase.color }} />}
                </div>
                <span onClick={() => onToggle(phaseKey, sec.id, item.id)} style={{
                  flex: 1, fontSize: 11, lineHeight: 1.4, cursor: "pointer",
                  color: item.s === "done" ? "#94A3B8" : "#374151",
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
                    fontSize: 12, color: "#CBD5E1", padding: 0, flexShrink: 0, lineHeight: 1, transition: "color .15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "#F87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "#CBD5E1"}>✕</button>
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
                  background: phase.lightBg, color: "#374151"
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
  const [editMode, setEditMode]   = useState(false);
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
      background: "#fff", border: "1px solid #E4E8F0", borderRadius: 20,
      boxShadow: `0 12px 48px ${phase.color}22, 0 4px 16px rgba(0,0,0,.08)`,
      overflow: "hidden", zIndex: 10, opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none", display: "flex", flexDirection: "column",
      transition: "opacity .4s ease, transform .45s cubic-bezier(.34,1.15,.64,1)",
      ...(pos.side === "left" ? { left: 28 } : { right: 28 }),
      ...(pos.vert === "top"  ? { top: 0 }   : { bottom: 0 }),
      transform: isOpen ? "translateX(0) scale(1)" :
        pos.side === "left" ? "translateX(-24px) scale(.97)" : "translateX(24px) scale(.97)"
    }}>
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
            { label: "Terminées", value: stats.done,  color: "rgba(255,255,255,.95)" },
            { label: "En cours",  value: stats.ip,    color: "rgba(255,255,255,.75)" },
            { label: "À faire",   value: stats.todo,  color: "rgba(255,255,255,.55)" },
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
          <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
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

      <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
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
                background: phase.lightBg, color: "#374151"
              }} />
            <button onClick={() => {
              if (newSecName.trim()) { onAddSection(phase.key, newSecName.trim()); setNewSecName(""); }
            }} style={{
              padding: "6px 14px", borderRadius: 8, border: "none",
              background: phase.color, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>+</button>
            <button onClick={() => setEditMode(false)} style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid #E4E8F0",
              background: "#fff", color: "#64748B", fontSize: 11, cursor: "pointer"
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
      background: "#1E293B", color: "#fff", padding: "10px 22px",
      borderRadius: 99, fontSize: 13, fontWeight: 600,
      opacity: visible ? 1 : 0, pointerEvents: "none",
      transition: "all .35s cubic-bezier(.34,1.3,.64,1)",
      boxShadow: "0 8px 28px rgba(0,0,0,.22)", zIndex: 9999,
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

  // Chargement initial
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

  // ── TOGGLE STATUT ────────────────────────────────────────────────────────
  // CORRECTION : on calcule le nouveau statut AVANT mutate pour être sûr
  // de l'avoir disponible dans le callback async qui suit.
  // On sauvegarde aussi l'ancien statut pour pouvoir annuler si l'API échoue.
  const handleToggle = useCallback(async (phaseKey, secId, itemId) => {
    // 1. Trouver le statut actuel dans le state (lecture pure, pas de mutation)
    const currentItem = data[phaseKey]?.sections
      .find(s => s.id === secId)?.items
      .find(i => i.id === itemId);

    if (!currentItem) return; // item introuvable, on ne fait rien

    const oldStatus = currentItem.s;
    const newStatus = STATUS_CYCLE[oldStatus]; // todo→ip, ip→done, done→todo

    if (!newStatus) return; // sécurité

    // 2. Mise à jour optimiste de l'UI
    mutate(d => {
      const item = d[phaseKey]?.sections.find(s => s.id === secId)?.items.find(i => i.id === itemId);
      if (item) item.s = newStatus;
    });

    // 3. Appel API avec la valeur convertie pour le backend
    try {
      await updateItem(itemId, toBack(newStatus));
      showToast({ done: "✅ Terminé !", ip: "⏳ En cours", todo: "↩ À faire" }[newStatus] || "");
    } catch (e) {
      console.error("Erreur mise à jour statut:", e);
      // Rollback : remettre l'ancien statut
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
      const newId = res.id; // pdca.js retourne déjà r.data
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
      const newId = res.id; // pdca.js retourne déjà r.data
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
      minHeight: "100vh", background: "#F4F6FA",
      fontFamily: "'Sora','Segoe UI',sans-serif",
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <KpiStrip data={data} />
      <div style={{
        flex: 1, position: "relative", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px 36px 36px", minHeight: 0
      }}>
        <div style={{
          position: "absolute",
          left: selected ? (WHEEL_SHIFT[selected] === "right" ? "68%" : "32%") : "50%",
          top: "50%", transform: "translate(-50%,-50%)",
          transition: "left .65s cubic-bezier(.4,0,.2,1)", zIndex: 1
        }}>
          <div style={{
            position: "absolute", inset: -28, border: "1.5px dashed #CBD5E1",
            borderRadius: "50%", pointerEvents: "none", animation: "pdca-spin 28s linear infinite"
          }} />
          <div style={{
            position: "absolute", inset: -52, border: "1px dashed #DDE2EB",
            borderRadius: "50%", pointerEvents: "none", animation: "pdca-spin 45s linear infinite reverse"
          }} />
          <svg viewBox={`0 0 ${VB} ${VB}`} width="450" height="450" style={{ display: "block", overflow: "visible" }}>
            <defs>
              {Object.values(data).map(p => (
                <radialGradient key={p.key} id={`rg_${p.key}`} cx="38%" cy="32%" r="72%">
                  <stop offset="0%" stopColor={p.gradStart} />
                  <stop offset="100%" stopColor={p.gradEnd} />
                </radialGradient>
              ))}
              <filter id="disc-sh" x="-12%" y="-12%" width="124%" height="124%">
                <feDropShadow dx="0" dy="5" stdDeviation="12" floodColor="rgba(0,0,0,.13)" />
              </filter>
            </defs>
            <circle cx={CX} cy={CY} r={OUTER_R + 18} fill="white" filter="url(#disc-sh)" />
            <circle cx={CX} cy={CY} r={OUTER_R + 10} fill="none" stroke="#E8EDF4" strokeWidth="5" />
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
                  opacity: dim ? 0.2 : 1
                }}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(isSel ? null : key)}>
                  <path d={path} fill={`url(#rg_${key})`} />
                  {isHov && !isSel && <path d={path} fill="#D1DAE8" opacity="0.35" style={{ pointerEvents: "none" }} />}
                  {isSel && <path d={path} fill="white" opacity="0.09" style={{ pointerEvents: "none" }} />}
                  <text x={lp.x} y={lp.y - 9} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="16" fontWeight="800" fontFamily="'Sora',sans-serif"
                    letterSpacing="2" style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 4px rgba(0,0,0,.3))" }}>
                    {ph.label}
                  </text>
                  <rect x={lp.x - 25} y={lp.y + 1} width={50} height={19} rx={9} fill="rgba(0,0,0,.28)" />
                  <text x={lp.x} y={lp.y + 14} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="11" fontWeight="800" fontFamily="'JetBrains Mono',monospace"
                    style={{ pointerEvents: "none" }}>{pct}%</text>
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
            {SEP_LINES.map((ln, i) => (
              <line key={i} x1={ln.x1.toFixed(2)} y1={ln.y1.toFixed(2)}
                x2={ln.x2.toFixed(2)} y2={ln.y2.toFixed(2)}
                stroke="#E0E7F0" strokeWidth="5" strokeLinecap="square"
                style={{ pointerEvents: "none" }} />
            ))}
            <circle cx={CX} cy={CY} r={INNER_R} fill="white" />
            <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="#EDF1F7" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke="#EEF2F8" strokeWidth="7" />
            <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke="#1E293B" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={hubCirc}
              strokeDashoffset={hubCirc * (1 - global.pct / 100)}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: "stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)" }} />
            <text x={CX} y={CY - 12} textAnchor="middle" fill="#0D1117" fontSize="18"
              fontWeight="800" fontFamily="'Sora',sans-serif" letterSpacing="-1">{global.pct}%</text>
            <text x={CX} y={CY + 4} textAnchor="middle" fill="#475569" fontSize="9"
              fontWeight="700" fontFamily="'Sora',sans-serif" letterSpacing="2.5">PDCA</text>
            <text x={CX} y={CY + 18} textAnchor="middle" fill="#94A3B8" fontSize="7"
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
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap", pointerEvents: "none",
            animation: "pdca-blink 2.5s ease-in-out infinite"
          }}>↻ Cliquez sur une phase pour l'explorer</p>
        )}
        <div style={{
          position: "absolute", bottom: 16, right: 36, display: "flex", gap: 14,
          background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
          padding: "7px 16px", borderRadius: 99, border: "1px solid #E4E8F0",
          boxShadow: "0 2px 8px rgba(0,0,0,.05)"
        }}>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{STATUS_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toast.msg} visible={toast.visible} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes pdca-spin  { to { transform: rotate(360deg); } }
        @keyframes pdca-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#E4E8F0; border-radius:99px; }
      `}</style>
    </div>
  );
}