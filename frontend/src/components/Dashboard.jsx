import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  ShieldCheck, AlertTriangle, FileText, RefreshCcw,
  ClipboardList,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (from Controles page)
───────────────────────────────────────────── */
const T = {
  xs: 12, sm: 14, base: 15, md: 16, lg: 18, xl: 22,
  normal: 400, medium: 500, semibold: 600, bold: 700,
  black:   "#0b1526",
  gray900: "#17263c",
  gray700: "#304866",
  gray500: "#5b6f88",
  gray400: "#8a98ad",
  gray200: "#d8dee8",
  gray100: "#e8edf4",
  gray50:  "#f3f6fa",
  white:   "#ffffff",
  bg:      "#f1f5f9",
};

/* ─────────────────────────────────────────────
   TAB THEMES — one gradient + palette per tab
───────────────────────────────────────────── */
const TAB_THEMES = {
  global: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
  conformite: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
  risques: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
  actions: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
  incidents: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
  amelioration: {
    accent: "#2f63d9", accentLight: "#eff4ff", border: "#dbe5ff",
    bg: "#eff4ff", rowBgHover: "#eef4ff",
    headerBg: "#ffffff", tabBg: "#f3f6fa",
  },
};

const TABS = [
  { value: "global",       label: "Vue globale" },
  { value: "conformite",   label: "Conformité ISO" },
  { value: "risques",      label: "Risques" },
  { value: "actions",      label: "Plan d'actions" },
  { value: "incidents",    label: "Incidents" },
  { value: "amelioration", label: "Amélioration continue" },
];

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const governanceKpis = [
  { id:"GOV-01", label:"Indicateurs SMSI suivis",  value:92, unit:"%", greenThreshold:"≥ 90%", redThreshold:"< 70%",  status:"green",  trend:3  },
  { id:"GOV-02", label:"Actions SMSI réalisées",    value:78, unit:"%", greenThreshold:"≥ 85%", redThreshold:"< 60%",  status:"orange", trend:-2 },
  { id:"GOV-03", label:"Avancement PDCA",           value:85, unit:"%", greenThreshold:"≥ 90%", redThreshold:"< 70%",  status:"orange", trend:5  },
  { id:"GOV-04", label:"Conformité ISO 27001",      value:88, unit:"%", greenThreshold:"≥ 90%", redThreshold:"< 70%",  status:"orange", trend:4  },
  { id:"GOV-05", label:"Écarts d'audit (NC)",       value:7,  unit:"%", greenThreshold:"≤ 5%",  redThreshold:"> 15%",  status:"orange", trend:-1 },
];
const riskKpis = [
  { id:"RSK-01", label:"Risques réévalués",           value:95, unit:"%", greenThreshold:"100%",  redThreshold:"< 80%", status:"orange" },
  { id:"RSK-02", label:"Réduction risques critiques", value:72, unit:"%", greenThreshold:"≥ 70%", redThreshold:"< 40%", status:"green"  },
  { id:"RSK-03", label:"Risques traités",             value:81, unit:"%", greenThreshold:"≥ 80%", redThreshold:"< 60%", status:"green"  },
  { id:"RSK-04", label:"Risques critiques ouverts",   value:12, unit:"%", greenThreshold:"≤ 10%", redThreshold:"> 25%", status:"orange" },
  { id:"RSK-05", label:"Délai moyen traitement",      value:28, unit:"j", greenThreshold:"≤ 30j", redThreshold:"> 60j", status:"green"  },
];
const clauseScores = [
  { clause:"4",  title:"Contexte",       score:90 },
  { clause:"5",  title:"Leadership",     score:85 },
  { clause:"6",  title:"Planification",  score:72 },
  { clause:"7",  title:"Support",        score:88 },
  { clause:"8",  title:"Fonctionnement", score:80 },
  { clause:"9",  title:"Évaluation",     score:75 },
  { clause:"10", title:"Amélioration",   score:70 },
];
const annexADomains = [
  { id:"A.5",       title:"Politiques de sécurité",    controls:37, implemented:30, partial:5, notImplemented:2 },
  { id:"A.6",       title:"Organisation de la sécurité",controls:8,  implemented:6,  partial:2, notImplemented:0 },
  { id:"A.7",       title:"Sécurité des RH",            controls:6,  implemented:5,  partial:1, notImplemented:0 },
  { id:"A.8",       title:"Gestion des actifs",         controls:34, implemented:25, partial:6, notImplemented:3 },
  { id:"5.1–5.6",   title:"Gouvernance",                controls:6,  implemented:5,  partial:1, notImplemented:0 },
  { id:"5.7–5.14",  title:"Gestion identités",          controls:8,  implemented:6,  partial:1, notImplemented:1 },
  { id:"5.15–5.23", title:"Relations fournisseurs",     controls:5,  implemented:3,  partial:2, notImplemented:0 },
  { id:"5.24–5.30", title:"Gestion incidents",          controls:7,  implemented:6,  partial:1, notImplemented:0 },
  { id:"5.31–5.36", title:"Continuité & conformité",    controls:6,  implemented:4,  partial:1, notImplemented:1 },
  { id:"6.1–6.8",   title:"Sécurité personnes",         controls:8,  implemented:7,  partial:1, notImplemented:0 },
  { id:"7.1–7.14",  title:"Sécurité physique",          controls:14, implemented:10, partial:3, notImplemented:1 },
  { id:"8.1–8.12",  title:"Sécurité techno (accès)",    controls:12, implemented:9,  partial:2, notImplemented:1 },
  { id:"8.13–8.24", title:"Sécurité techno (ops)",      controls:12, implemented:8,  partial:3, notImplemented:1 },
  { id:"8.25–8.34", title:"Sécurité techno (dev)",      controls:10, implemented:7,  partial:2, notImplemented:1 },
];
const riskEntries = [
  { id:"R-001", name:"Ransomware sur serveur principal",   impact:4, probability:3, score:12, level:"Critique", treatment:"Réduire",    owner:"DSI"  },
  { id:"R-002", name:"Fuite données clients",              impact:4, probability:2, score:8,  level:"Élevé",    treatment:"Réduire",    owner:"RSSI" },
  { id:"R-003", name:"Indisponibilité cloud provider",     impact:3, probability:2, score:6,  level:"Modéré",   treatment:"Transférer", owner:"DSI"  },
  { id:"R-004", name:"Phishing ciblé direction",           impact:3, probability:3, score:9,  level:"Élevé",    treatment:"Réduire",    owner:"RSSI" },
  { id:"R-005", name:"Perte de clés de chiffrement",       impact:4, probability:1, score:4,  level:"Modéré",   treatment:"Éviter",     owner:"DSI"  },
  { id:"R-006", name:"Non-conformité RGPD",                impact:3, probability:2, score:6,  level:"Modéré",   treatment:"Réduire",    owner:"DPO"  },
  { id:"R-007", name:"Intrusion réseau interne",           impact:4, probability:2, score:8,  level:"Élevé",    treatment:"Réduire",    owner:"DSI"  },
  { id:"R-008", name:"Erreur humaine suppression données", impact:2, probability:3, score:6,  level:"Modéré",   treatment:"Réduire",    owner:"RSSI" },
  { id:"R-009", name:"Défaillance sauvegarde",             impact:3, probability:1, score:3,  level:"Faible",   treatment:"Accepter",   owner:"DSI"  },
  { id:"R-010", name:"Vol de matériel mobile",             impact:2, probability:2, score:4,  level:"Faible",   treatment:"Accepter",   owner:"RSSI" },
];
const actionEntries = [
  { id:"ACT-001", title:"Déployer MFA sur tous les comptes",      responsible:"DSI",  deadline:"2026-04-15", progress:85,  status:"En cours",  module:"Sécurité"       },
  { id:"ACT-002", title:"Mettre à jour la politique de sécurité", responsible:"RSSI", deadline:"2026-03-01", progress:100, status:"Terminé",   module:"Gouvernance"    },
  { id:"ACT-003", title:"Former 100% des employés à la sécurité", responsible:"RH",   deadline:"2026-06-30", progress:65,  status:"En cours",  module:"RH"             },
  { id:"ACT-004", title:"Audit fournisseurs critiques",            responsible:"RSSI", deadline:"2026-03-10", progress:40,  status:"En retard", module:"Fournisseurs"   },
  { id:"ACT-005", title:"Corriger NC audit interne Q4",            responsible:"RSSI", deadline:"2026-05-01", progress:30,  status:"En cours",  module:"Conformité"     },
  { id:"ACT-006", title:"Implémenter SIEM centralisé",             responsible:"DSI",  deadline:"2026-07-15", progress:15,  status:"Planifié",  module:"Infrastructure" },
  { id:"ACT-007", title:"Revue des droits d'accès annuelle",       responsible:"DSI",  deadline:"2026-04-30", progress:50,  status:"En cours",  module:"Sécurité"       },
  { id:"ACT-008", title:"Plan de continuité — test annuel",        responsible:"RSSI", deadline:"2026-03-20", progress:20,  status:"En retard", module:"Continuité"     },
];
const incidentEntries = [
  { id:"INC-001", title:"Tentative de phishing — DG",       type:"Phishing",           date:"2026-03-12", severity:"Majeur",   resolved:true, resolutionTime:4  },
  { id:"INC-002", title:"Brute force SSH serveur prod",      type:"Intrusion",          date:"2026-03-05", severity:"Critique", resolved:true, resolutionTime:2  },
  { id:"INC-003", title:"Fuite email interne accidentelle",  type:"Fuite données",      date:"2026-02-28", severity:"Mineur",   resolved:true, resolutionTime:1  },
  { id:"INC-004", title:"Malware poste utilisateur",         type:"Malware",            date:"2026-02-15", severity:"Majeur",   resolved:true, resolutionTime:6  },
  { id:"INC-005", title:"Indisponibilité VPN 2h",            type:"Disponibilité",      date:"2026-01-22", severity:"Mineur",   resolved:true, resolutionTime:2  },
  { id:"INC-006", title:"Accès non autorisé partage réseau", type:"Accès non autorisé", date:"2026-01-10", severity:"Majeur",   resolved:true, resolutionTime:8  },
  { id:"INC-007", title:"Ransomware bloqué par EDR",         type:"Malware",            date:"2025-12-18", severity:"Critique", resolved:true, resolutionTime:1  },
  { id:"INC-008", title:"Perte clé USB chiffrée",            type:"Perte matériel",     date:"2025-11-30", severity:"Mineur",   resolved:true, resolutionTime:24 },
  { id:"INC-009", title:"DDoS site web 30min",               type:"Disponibilité",      date:"2025-10-15", severity:"Majeur",   resolved:true, resolutionTime:3  },
];
const nonConformities = [
  { id:"NC-001", clause:"6.1", description:"Appréciation des risques incomplète",      status:"En cours",  dateOpened:"2026-01-15" },
  { id:"NC-002", clause:"7.2", description:"Compétences sécurité non documentées",     status:"Clôturée",  dateOpened:"2025-11-01", dateClosed:"2026-02-10" },
  { id:"NC-003", clause:"9.2", description:"Programme d'audit non respecté",           status:"Ouverte",   dateOpened:"2026-02-20" },
  { id:"NC-004", clause:"7.5", description:"Documents obsolètes non retirés",          status:"En cours",  dateOpened:"2026-01-30" },
  { id:"NC-005", clause:"8.1", description:"Plan de traitement risques incomplet",     status:"Clôturée",  dateOpened:"2025-10-15", dateClosed:"2026-01-20" },
  { id:"NC-006", clause:"5.3", description:"Rôles SMSI non formalisés",                status:"Ouverte",   dateOpened:"2026-03-01" },
];
const incidentsByMonth = [
  { month:"Oct", count:1 },{ month:"Nov", count:1 },{ month:"Déc", count:1 },
  { month:"Jan", count:2 },{ month:"Fév", count:2 },{ month:"Mar", count:2 },
];
const auditHistory = [
  { date:"2025-06-15", type:"Audit interne",           scope:"Clauses 4–10",       findings:5, status:"Clôturé"  },
  { date:"2025-12-10", type:"Audit interne",           scope:"Annexe A",           findings:3, status:"Clôturé"  },
  { date:"2026-02-20", type:"Audit externe (stage 1)", scope:"Documentation SMSI", findings:2, status:"En cours" },
];
const trainingData = [
  { name:"Sensibilisation sécurité", actual:89, target:95 },
  { name:"Formation RGPD",           actual:78, target:90 },
  { name:"Réponse incidents",        actual:65, target:80 },
  { name:"Développement sécurisé",   actual:72, target:95 },
];

/* ─────────────────────────────────────────────
   SEMANTIC STYLE MAPS
───────────────────────────────────────────── */
const S_COLOR = { green:"#059669", orange:"#d97706", red:"#dc2626" };

const RISK_S = {
  Critique:{ color:"#ef4444", bg:"#f7e8eb", border:"#f1d4da" },
  Élevé:   { color:"#f59e0b", bg:"#f6edd9", border:"#efe2c0" },
  Modéré:  { color:"#0284d8", bg:"#deedf8", border:"#d4e5f2" },
  Faible:  { color:"#0e9f4c", bg:"#dcf2e2", border:"#d0ead8" },
};
const ACT_S = {
  "Terminé":  { color:"#0e9f4c", bg:"#dcf2e2", border:"#d0ead8" },
  "En cours": { color:"#0284d8", bg:"#deedf8", border:"#d4e5f2" },
  "En retard":{ color:"#ef4444", bg:"#f8e4e8", border:"#f1d4da" },
  "Planifié": { color:"#64748b", bg:"#edf1f6", border:"#e3e8ef" },
};
const NC_S = {
  Ouverte:    { color:"#ef4444", bg:"#f8e4e8", border:"#f1d4da" },
  "En cours": { color:"#f59e0b", bg:"#f6edd9", border:"#efe2c0" },
  Clôturée:   { color:"#0e9f4c", bg:"#dcf2e2", border:"#d0ead8" },
};
const SEV_S = {
  Critique:{ color:"#ef4444", bg:"#f8e4e8", border:"#f1d4da" },
  Majeur:  { color:"#f59e0b", bg:"#f6edd9", border:"#efe2c0" },
  Mineur:  { color:"#0284d8", bg:"#deedf8", border:"#d4e5f2" },
};

/* ─────────────────────────────────────────────
   REUSABLE UI COMPONENTS
───────────────────────────────────────────── */

function Pill({ label, style = {} }) {
  return (
    <span style={{
      fontSize:T.sm, fontWeight:T.medium,
      borderRadius:999, padding:"4px 12px",
      whiteSpace:"nowrap", display:"inline-block",
      border:`1px solid ${style.border||T.gray200}`,
      background:style.bg||T.gray100,
      color:style.color||T.gray700,
    }}>{label}</span>
  );
}

function StatCard({ label, value, color, valueColor, icon, iconColor = "#f59e0b", iconBg = "#fff3dc", footnote }) {
  const finalValueColor = valueColor || color || T.black;
  return (
    <div style={{
      background:T.white, border:`1px solid ${T.gray200}`,
      borderRadius:16, padding:"18px 20px",
      boxShadow:"0 1px 2px rgba(15,23,42,0.06)",
    }}>
      {icon && (
        <div style={{ width:40, height:40, borderRadius:14, background:iconBg, color:iconColor, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize:36, fontWeight:T.bold, color:finalValueColor, lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:T.base, color:T.gray500, fontWeight:T.normal }}>{label}</div>
      {footnote && <div style={{ marginTop:4, fontSize:T.sm, color:T.gray500 }}>{footnote}</div>}
    </div>
  );
}

/* Card with optional gradient header */
function Card({ children, title, subtitle, p = 0, actionLabel }) {
  return (
    <div style={{
      background:T.white, border:`1px solid ${T.gray200}`,
      borderRadius:16, overflow:"hidden",
      boxShadow:"0 1px 2px rgba(15,23,42,0.06)",
    }}>
      {title && (
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.gray200}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <span style={{ fontWeight:T.bold, fontSize:T.lg, color:T.black }}>{title}</span>
            {subtitle ? <div style={{ marginTop:2, fontSize:T.sm, color:T.gray500 }}>{subtitle}</div> : null}
          </div>
          {actionLabel ? <button style={{ border:"none", background:"transparent", color:"#2f63d9", fontSize:T.base, fontWeight:T.medium, cursor:"pointer" }}>{actionLabel}</button> : null}
        </div>
      )}
      <div style={{ padding:p }}>{children}</div>
    </div>
  );
}

function ProgressBar({ value, height = 6, color = "#2f63d9" }) {
  return (
    <div style={{ background:"#e6ebf3", borderRadius:999, height, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${Math.min(value,100)}%`, height:"100%", background:color, borderRadius:999, transition:"width .4s" }} />
    </div>
  );
}

function MiniDonut({ value, color }) {
  return (
    <div style={{ width:76, height:76, flexShrink:0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[{value},{value:100-value}]} cx="50%" cy="50%"
            innerRadius={22} outerRadius={32} startAngle={90} endAngle={-270}
            dataKey="value" strokeWidth={0}>
            <Cell fill={color}/><Cell fill={T.gray200}/>
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const TT = { contentStyle:{ borderRadius:12, border:`1px solid ${T.gray200}`, boxShadow:"0 8px 24px rgba(15,23,42,.12)", fontSize:12 } };

const Th = ({ children, center }) => (
  <th style={{ padding:"12px 18px", fontWeight:T.medium, fontSize:T.md, color:T.gray500,
    textAlign:center?"center":"left", borderBottom:`1px solid ${T.gray200}`,
    whiteSpace:"nowrap", background:T.gray50 }}>{children}</th>
);
const Td = ({ children, center, mono, bold, color }) => (
  <td style={{ padding:"12px 18px", textAlign:center?"center":"left",
    fontVariantNumeric:mono?"tabular-nums":undefined,
    fontWeight:bold?T.semibold:T.normal, color:color||T.gray700, fontSize:T.base }}>{children}</td>
);
function TRow({ children }) {
  const [h,setH] = useState(false);
  return <tr onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{ borderBottom:`1px solid ${T.gray200}`, background:h?"#f7f9fc":T.white, transition:"background .15s" }}>{children}</tr>;
}

/* ─────────────────────────────────────────────
   TAB: VUE GLOBALE
───────────────────────────────────────────── */
const MATURITE = [
  { label:"Maturité organisationnelle", value:78, color:"#4f46e5" },
  { label:"Maturité technique",         value:72, color:"#0ea5e9" },
  { label:"Maturité humaine",           value:85, color:"#059669" },
];

function TabVueGlobale({ theme }) {
  const topRisks = riskEntries.filter(r=>r.level==="Critique"||r.level==="Élevé").slice(0,5);
  const kpis = [
    { label:"Conformité ISO",       value:`${governanceKpis[3].value}%`, status:governanceKpis[3].status, icon:<ShieldCheck size={18}/> },
    { label:"Contrôles Annexe A",   value:"76/93",                        status:"orange",                  icon:<ClipboardList size={18}/> },
    { label:"Risques résiduels",    value:`${riskEntries.filter(r=>r.level==="Critique"||r.level==="Élevé").length}`, status:"orange", icon:<AlertTriangle size={18}/> },
    { label:"NC ouvertes",          value:"4",                             status:"orange",                  icon:<FileText size={18}/> },
    { label:"Avancement PDCA",      value:`${governanceKpis[2].value}%`, status:governanceKpis[2].status, icon:<RefreshCcw size={18}/> },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPI stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
        {kpis.map(k=>(
          <StatCard key={k.label} label={k.label} value={k.value}
            valueColor={T.black} icon={k.icon} iconColor="#f59e0b" iconBg="#fff3dc" />
        ))}
      </div>

      {/* Maturité donuts */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {MATURITE.map(d=>(
          <div key={d.label} style={{
            background:T.white, border:`1px solid ${T.gray200}`,
            borderRadius:12, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,.06)",
            display:"flex", alignItems:"center", gap:16,
          }}>
            <MiniDonut value={d.value} color={d.color}/>
            <div>
              <div style={{ fontSize:24, fontWeight:T.bold, color:T.black }}>{d.value}%</div>
              <div style={{ fontSize:T.sm, color:T.gray500, marginTop:4 }}>{d.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Certification + Incidents */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ padding:"24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"#dcf4e3", color:"#0e9f4c", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize:T.xl, fontWeight:T.bold, color:T.black }}>Certification ISO 27001:2022</div>
                <div style={{ fontSize:T.lg, fontWeight:T.semibold, color:"#0e9f4c" }}>Active — Valide jusqu'au 15/09/2028</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize:T.xs, fontWeight:T.bold, color:T.gray400, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Synthèse par clause</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {clauseScores.map(c=>(
                  <div key={c.clause} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:T.sm, color:T.gray500, width:120, flexShrink:0 }}>Cl. {c.clause} – {c.title}</span>
                    <ProgressBar value={c.score}/>
                    <span style={{ fontSize:T.sm, fontWeight:T.bold, width:36, textAlign:"right",
                      color:c.score>=90?"#059669":c.score>=70?"#d97706":"#dc2626" }}>{c.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Incidents (6 derniers mois)">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gray200}/>
                <XAxis dataKey="month" tick={{ fontSize:12 }} stroke={T.gray400}/>
                <YAxis tick={{ fontSize:12 }} stroke={T.gray400} allowDecimals={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="count" name="Incidents" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top risques + Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Top risques" actionLabel="Voir tout →">
          <div>
            {topRisks.map(r=>{
              const s=RISK_S[r.level]||RISK_S.Faible;
              return (
                <div key={r.id} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"14px 24px", borderBottom:`1px solid ${T.gray200}`,
                }}>
                  <div>
                    <div style={{ fontWeight:T.semibold, fontSize:T.base, color:T.black }}>{r.name}</div>
                    <div style={{ fontSize:T.sm, color:T.gray500, marginTop:3 }}>{r.owner} · Score {r.score}</div>
                  </div>
                  <Pill label={r.level} style={s}/>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Plan d'actions" actionLabel="Voir tout →">
          <div>
            {actionEntries.slice(0,5).map(a=>{
              const s=ACT_S[a.status]||ACT_S["Planifié"];
              return (
                <div key={a.id} style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:"14px 24px", borderBottom:`1px solid ${T.gray200}`,
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:T.semibold, fontSize:T.base, color:T.black, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                    <div style={{ fontSize:T.sm, color:T.gray500, marginTop:3 }}>{a.responsible} · {a.deadline}</div>
                  </div>
                  <div style={{ width:80 }}><ProgressBar value={a.progress} height={5}/></div>
                  <Pill label={a.status} style={s}/>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Audits */}
      <Card title="Historique des audits">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><Th>Date</Th><Th>Type</Th><Th>Périmètre</Th><Th center>Constats</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {auditHistory.map((a,i)=>(
                <TRow key={i}>
                  <Td mono color={T.gray500}>{a.date}</Td>
                  <Td bold color={T.black}>{a.type}</Td>
                  <Td color={T.gray500}>{a.scope}</Td>
                  <Td center mono>{a.findings}</Td>
                  <Td><Pill label={a.status} style={a.status==="Clôturé"
                    ?{color:"#059669",bg:"#f0fdf4",border:"#bbf7d0"}
                    :{color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe"}}/></Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB: CONFORMITÉ
───────────────────────────────────────────── */
const CONF_DONUT = [
  { name:"Conforme",     value:42, color:"#059669" },
  { name:"Partiel",      value:18, color:"#d97706" },
  { name:"Non conforme", value:8,  color:"#dc2626" },
  { name:"Non évalué",   value:12, color:T.gray400 },
];

function TabConformite({ theme }) {
  const kpis = [
    { label:"Conformité globale",  value:governanceKpis[3].value, color:"#f59e0b" },
    { label:"Indicateurs suivis",  value:governanceKpis[0].value, color:"#059669" },
    { label:"Écarts d'audit (OK)", value:100-governanceKpis[4].value, color:"#d97706" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {kpis.map(d=>(
          <div key={d.label} style={{
            background:T.white, border:`1px solid ${T.gray200}`,
            borderRadius:12, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,.06)",
            display:"flex", alignItems:"center", gap:16,
          }}>
            <MiniDonut value={d.value} color={d.color}/>
            <div>
              <div style={{ fontSize:24, fontWeight:T.bold, color:T.black }}>{d.value}%</div>
              <div style={{ fontSize:T.sm, color:T.gray500, marginTop:4 }}>{d.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Répartition par statut">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={CONF_DONUT} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                  {CONF_DONUT.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip {...TT}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10, marginTop:8 }}>
              {CONF_DONUT.map(e=>(
                <div key={e.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:e.color }}/>
                  <span style={{ fontSize:T.sm, color:T.gray500 }}>{e.name} ({e.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Score par clause (4–10)">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clauseScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.gray200}/>
                <XAxis type="number" domain={[0,100]} tick={{ fontSize:11 }} stroke={T.gray400}/>
                <YAxis type="category" dataKey="clause" tick={{ fontSize:11 }} stroke={T.gray400} width={25}/>
                <Tooltip {...TT}/>
                <Bar dataKey="score" name="Score %" fill={theme.accent} radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title={`Annexe A — 14 domaines (${annexADomains.reduce((s,d)=>s+d.controls,0)} contrôles)`}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <Th>Domaine</Th><Th>Titre</Th>
              <Th center>Contrôles</Th><Th center>Implémentés</Th>
              <Th center>Partiels</Th><Th center>Non impl.</Th><Th>Progression</Th>
            </tr></thead>
            <tbody>
              {annexADomains.map(d=>{
                const pct=Math.round((d.implemented/d.controls)*100);
                return (
                  <TRow key={d.id}>
                    <Td bold color={T.black}>{d.id}</Td>
                    <Td>{d.title}</Td>
                    <Td center mono color={T.gray500}>{d.controls}</Td>
                    <Td center mono color="#059669">{d.implemented}</Td>
                    <Td center mono color="#d97706">{d.partial}</Td>
                    <Td center mono color="#dc2626">{d.notImplemented}</Td>
                    <Td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <ProgressBar value={pct} height={5}/>
                        <span style={{ fontSize:T.sm, fontWeight:T.bold, width:34,
                          color:pct>=90?"#059669":pct>=70?"#d97706":"#dc2626" }}>{pct}%</span>
                      </div>
                    </Td>
                  </TRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB: RISQUES
───────────────────────────────────────────── */
const MATRIX_BG = {
  "1-1":"#d2e8d8","1-2":"#d2e8d8","1-3":"#f0e2c5","1-4":"#f0e2c5",
  "2-1":"#d2e8d8","2-2":"#f0e2c5","2-3":"#f0e2c5","2-4":"#ecd0d4",
  "3-1":"#f0e2c5","3-2":"#f0e2c5","3-3":"#ecd0d4","3-4":"#ecd0d4",
  "4-1":"#f0e2c5","4-2":"#ecd0d4","4-3":"#ecd0d4","4-4":"#e7bcc2",
};

function TabRisques({ theme }) {
  const critiques=riskEntries.filter(r=>r.level==="Critique").length;
  const eleves=riskEntries.filter(r=>r.level==="Élevé").length;
  const acceptes=riskEntries.filter(r=>r.treatment==="Accepter").length;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
        {riskKpis.map(k=>(
          <StatCard key={k.id} label={k.label} value={`${k.value}${k.unit}`}
            valueColor={S_COLOR[k.status]} footnote={`${k.greenThreshold} / ${k.redThreshold}`}/>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {[
          { label:"Critiques", value:critiques, ...RISK_S.Critique },
          { label:"Élevés",    value:eleves,    ...RISK_S.Élevé    },
          { label:"Acceptés",  value:acceptes,  ...RISK_S.Faible   },
        ].map(s=>(
          <div key={s.label} style={{
            background:s.bg, border:`1px solid ${s.border}`,
            borderRadius:12, padding:"20px 24px", textAlign:"center",
          }}>
            <div style={{ fontSize:32, fontWeight:T.bold, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:T.sm, color:s.color, fontWeight:T.semibold, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card title="Matrice de criticité (Impact × Probabilité)">
        <div style={{ padding:"20px 24px", overflowX:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, minWidth:320 }}>
            {[4,3,2,1].map(impact=>
              [1,2,3,4].map(prob=>{
                const risks=riskEntries.filter(r=>r.impact===impact&&r.probability===prob);
                return (
                  <div key={`${impact}-${prob}`} style={{
                    borderRadius:8, padding:"8px 6px", minHeight:58,
                    background:MATRIX_BG[`${impact}-${prob}`]||T.gray50,
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center",
                  }}>
                    <span style={{ fontSize:10, color:T.gray500, fontWeight:T.semibold }}>{impact}×{prob}={impact*prob}</span>
                    {risks.map(r=>(
                      <span key={r.id} style={{ fontSize:9, color:T.gray700, overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%", whiteSpace:"nowrap" }} title={r.name}>{r.id}</span>
                    ))}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, padding:"0 4px" }}>
            {[1,2,3,4].map(p=><span key={p} style={{ fontSize:10, color:T.gray400 }}>{p}</span>)}
          </div>
          <p style={{ fontSize:10, color:T.gray400, textAlign:"center", margin:"4px 0 0" }}>Probabilité →</p>
        </div>
      </Card>

      <Card title="Registre des risques">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <Th>ID</Th><Th>Risque</Th><Th center>I</Th><Th center>P</Th>
              <Th center>Score</Th><Th>Niveau</Th><Th>Traitement</Th><Th>Propriétaire</Th>
            </tr></thead>
            <tbody>
              {riskEntries.map(r=>(
                <TRow key={r.id}>
                  <Td mono color={T.gray400}>{r.id}</Td>
                  <Td bold color={T.black}>{r.name}</Td>
                  <Td center mono>{r.impact}</Td>
                  <Td center mono>{r.probability}</Td>
                  <Td center mono bold>{r.score}</Td>
                  <Td><Pill label={r.level} style={RISK_S[r.level]||RISK_S.Faible}/></Td>
                  <Td color={T.gray500}>{r.treatment}</Td>
                  <Td color={T.gray500}>{r.owner}</Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB: ACTIONS
───────────────────────────────────────────── */
function TabActions({ theme }) {
  const total=actionEntries.length;
  const done=actionEntries.filter(a=>a.status==="Terminé").length;
  const late=actionEntries.filter(a=>a.status==="En retard").length;
  const avg=Math.round(actionEntries.reduce((s,a)=>s+a.progress,0)/total);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Total actions",    value:total,    valueColor:T.black },
          { label:"Terminées",        value:done,     valueColor:"#0e9f4c" },
          { label:"En retard",        value:late,     valueColor:"#ef4444" },
          { label:"Avancement moyen", value:`${avg}%`,valueColor:"#2f63d9" },
        ].map(k=><StatCard key={k.label} {...k}/>)}
      </div>

      <Card title="Plan d'actions complet">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>
              <Th>ID</Th><Th>Action</Th><Th>Module</Th><Th>Responsable</Th>
              <Th>Échéance</Th><Th>Avancement</Th><Th>Statut</Th>
            </tr></thead>
            <tbody>
              {actionEntries.map(a=>(
                <TRow key={a.id}>
                  <Td mono color={T.gray400}>{a.id}</Td>
                  <Td bold color={T.black}>{a.title}</Td>
                  <Td color={T.gray500}>{a.module}</Td>
                  <Td color={T.gray500}>{a.responsible}</Td>
                  <Td mono color={T.gray500}>{a.deadline}</Td>
                  <Td>
                    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:100 }}>
                      <ProgressBar value={a.progress} height={5}/>
                      <span style={{ fontSize:T.sm, fontWeight:T.bold, width:32 }}>{a.progress}%</span>
                    </div>
                  </Td>
                  <Td><Pill label={a.status} style={ACT_S[a.status]||ACT_S["Planifié"]}/></Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB: INCIDENTS
───────────────────────────────────────────── */
function TabIncidents({ theme }) {
  const total=incidentEntries.length;
  const avg=Math.round(incidentEntries.reduce((s,i)=>s+i.resolutionTime,0)/total);
  const rate=Math.round((incidentEntries.filter(i=>i.resolved).length/total)*100);
  const byType=incidentEntries.reduce((acc,inc)=>{ acc[inc.type]=(acc[inc.type]||0)+1; return acc; },{});
  const typeData=Object.entries(byType).map(([name,value])=>({name,value}));
  const TC=["#4f46e5","#dc2626","#d97706","#059669","#0ea5e9","#9333ea"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Total incidents", value:total,   valueColor:T.black },
          { label:"MTTR moyen",      value:`${avg}h`,valueColor:"#0b9ad5" },
          { label:"Taux résolution", value:`${rate}%`,valueColor:"#0e9f4c" },
          { label:"Critiques",       value:incidentEntries.filter(i=>i.severity==="Critique").length, valueColor:"#ef4444" },
        ].map(k=><StatCard key={k.label} {...k}/>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Incidents par mois">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gray200}/>
                <XAxis dataKey="month" tick={{ fontSize:11 }} stroke={T.gray400}/>
                <YAxis tick={{ fontSize:11 }} stroke={T.gray400} allowDecimals={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="count" name="Incidents" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Répartition par type">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={84} paddingAngle={3} dataKey="value">
                  {typeData.map((_,i)=><Cell key={i} fill={TC[i%TC.length]}/>)}
                </Pie>
                <Tooltip {...TT}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10, marginTop:8 }}>
              {typeData.map((t,i)=>(
                <div key={t.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:TC[i%TC.length] }}/>
                  <span style={{ fontSize:T.sm, color:T.gray500 }}>{t.name} ({t.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Registre des incidents">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><Th>ID</Th><Th>Incident</Th><Th>Type</Th><Th>Date</Th><Th>Sévérité</Th><Th center>Résolu</Th><Th center>Temps</Th></tr></thead>
            <tbody>
              {incidentEntries.map(inc=>(
                <TRow key={inc.id}>
                  <Td mono color={T.gray400}>{inc.id}</Td>
                  <Td bold color={T.black}>{inc.title}</Td>
                  <Td color={T.gray500}>{inc.type}</Td>
                  <Td mono color={T.gray500}>{inc.date}</Td>
                  <Td><Pill label={inc.severity} style={SEV_S[inc.severity]||SEV_S.Mineur}/></Td>
                  <Td center color={inc.resolved?"#059669":"#dc2626"}>{inc.resolved?"Oui":"Non"}</Td>
                  <Td center mono color={T.gray500}>{inc.resolutionTime}h</Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB: AMÉLIORATION
───────────────────────────────────────────── */
function TabAmelioration({ theme }) {
  const total=nonConformities.length;
  const closed=nonConformities.filter(n=>n.status==="Clôturée").length;
  const rate=Math.round((closed/total)*100);
  const byClause=nonConformities.reduce((acc,nc)=>{ acc[nc.clause]=(acc[nc.clause]||0)+1; return acc; },{});
  const ncChart=Object.entries(byClause).map(([clause,count])=>({clause:`Cl. ${clause}`,count}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Non-conformités", value:total, color:T.black },
          { label:"Ouvertes",        value:nonConformities.filter(n=>n.status==="Ouverte").length, color:"#ef4444" },
          { label:"Taux clôture",    value:`${rate}%`, color:"#0e9f4c" },
          { label:"Audits réalisés", value:auditHistory.length, color:"#2f63d9" },
        ].map(k=><StatCard key={k.label} {...k}/>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card title="Non-conformités par clause">
          <div style={{ padding:"20px 24px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ncChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gray200}/>
                <XAxis dataKey="clause" tick={{ fontSize:11 }} stroke={T.gray400}/>
                <YAxis tick={{ fontSize:11 }} stroke={T.gray400} allowDecimals={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="count" name="NC" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Suivi des formations">
          <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>
            {trainingData.map(t=>{
              const c=t.actual>=t.target?"#059669":t.actual>=t.target*.8?"#d97706":"#dc2626";
              return (
                <div key={t.name}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                    <span style={{ fontSize:T.sm, color:T.gray500 }}>{t.name}</span>
                    <span style={{ fontSize:T.sm, fontWeight:T.bold, color:c }}>{t.actual}% / {t.target}%</span>
                  </div>
                  <div style={{ position:"relative" }}>
                    <ProgressBar value={t.actual} height={7}/>
                    <div style={{ position:"absolute", top:0, left:`${t.target}%`, width:2, height:7, background:"rgba(0,0,0,.25)", borderRadius:1 }} title={`Cible: ${t.target}%`}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Non-conformités">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><Th>ID</Th><Th>Clause</Th><Th>Description</Th><Th>Statut</Th><Th>Ouvert le</Th><Th>Clôturé le</Th></tr></thead>
            <tbody>
              {nonConformities.map(nc=>(
                <TRow key={nc.id}>
                  <Td mono color={T.gray400}>{nc.id}</Td>
                  <Td bold color={T.black}>{nc.clause}</Td>
                  <Td color={T.gray700}>{nc.description}</Td>
                  <Td><Pill label={nc.status} style={NC_S[nc.status]||NC_S["En cours"]}/></Td>
                  <Td mono color={T.gray500}>{nc.dateOpened}</Td>
                  <Td mono color={T.gray500}>{nc.dateClosed||"—"}</Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Historique des audits">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><Th>Date</Th><Th>Type</Th><Th>Périmètre</Th><Th center>Constats</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {auditHistory.map((a,i)=>(
                <TRow key={i}>
                  <Td mono color={T.gray500}>{a.date}</Td>
                  <Td bold color={T.black}>{a.type}</Td>
                  <Td color={T.gray500}>{a.scope}</Td>
                  <Td center mono>{a.findings}</Td>
                  <Td><Pill label={a.status} style={a.status==="Clôturé"
                    ?{color:"#059669",bg:"#f0fdf4",border:"#bbf7d0"}
                    :{color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe"}}/></Td>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function SmsiDashboard() {
  const [activeTab, setActiveTab] = useState("global");
  const theme = TAB_THEMES[activeTab] || TAB_THEMES.global;

  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      fontSize:T.base, color:T.gray900,
    }}>

      {/* ── HEADER ── */}
      <header style={{
        background:T.bg,
        padding:"22px 32px 12px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        <div style={{ width:50, height:50, borderRadius:16, background:"#dbe5f4", color:"#2f63d9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 style={{ fontSize:T.xl, fontWeight:T.bold, color:T.black, margin:0, letterSpacing:"-0.02em" }}>
            Tableau de bord SMSI
          </h1>
          <p style={{ fontSize:T.sm, color:T.gray500, margin:"4px 0 0", fontWeight:T.normal }}>
            ISO 27001:2022 — ALEXSYS Solutions · Dernière mise à jour : 18 mars 2026
          </p>
        </div>
      </header>

      <main style={{ maxWidth:1500, margin:"0 auto", padding:"8px 24px 32px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── TABS ── */}
        <div style={{
          background:T.gray50, border:`1px solid ${T.gray100}`,
          borderRadius:16, overflowX:"auto",
          padding:"10px 12px",
          display:"flex", justifyContent:"center", gap:6,
        }}>
          {TABS.map(t=>{
            const isActive=activeTab===t.value;
            return (
              <button key={t.value} onClick={()=>setActiveTab(t.value)} style={{
                padding:"10px 14px",
                fontSize:T.md, fontWeight:isActive?T.semibold:T.medium,
                cursor:"pointer", border:`1px solid ${isActive ? T.gray200 : "transparent"}`,
                borderRadius:12,
                background:isActive?T.white:"transparent",
                color:isActive?T.black:T.gray700,
                transition:"all 0.15s", whiteSpace:"nowrap",
                fontFamily:"inherit",
              }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        {activeTab==="global"       && <TabVueGlobale    theme={theme}/>}
        {activeTab==="conformite"   && <TabConformite    theme={theme}/>}
        {activeTab==="risques"      && <TabRisques       theme={theme}/>}
        {activeTab==="actions"      && <TabActions       theme={theme}/>}
        {activeTab==="incidents"    && <TabIncidents     theme={theme}/>}
        {activeTab==="amelioration" && <TabAmelioration  theme={theme}/>}
      </main>
    </div>
  );
}

