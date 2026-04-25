// components/DashboardAdmin.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Building2, Factory, 
  BarChart3, PieChart, Activity, ArrowUpRight, 
  Eye, Edit3, Trash2, RefreshCw, Check, X,
  ChevronRight, Layout
} from 'lucide-react';

// --- DATA MOCKS ---
const MOCK_ROLES_PERMS = [
  { 
    id: 1, nom: "Super Admin", 
    modules: [
      { name: "Utilisateurs", r: true, w: true, u: true, d: true },
      { name: "Holdings", r: true, w: true, u: true, d: true },
      { name: "Sociétés", r: true, w: true, u: true, d: true },
      { name: "Audit", r: true, w: true, u: true, d: true },
    ]
  },
  { 
    id: 2, nom: "Admin Holding", 
    modules: [
      { name: "Utilisateurs", r: true, w: true, u: true, d: false },
      { name: "Holdings", r: true, w: false, u: true, d: false },
      { name: "Sociétés", r: true, w: true, u: true, d: true },
      { name: "Audit", r: true, w: false, u: false, d: false },
    ]
  },
  { 
    id: 3, nom: "Auditeur", 
    modules: [
      { name: "Utilisateurs", r: true, w: false, u: false, d: false },
      { name: "Holdings", r: true, w: false, u: false, d: false },
      { name: "Sociétés", r: true, w: false, u: false, d: false },
      { name: "Audit", r: true, w: true, u: false, d: false },
    ]
  }
];

const MOCK_SOCIETES = [
  { id: 1, holding: "Groupe Nexalys" }, { id: 2, holding: "Groupe Nexalys" },
  { id: 3, holding: "AlphaCorp" }, { id: 4, holding: "TechVentures" },
  { id: 5, holding: "Groupe Nexalys" }, { id: 6, holding: "AlphaCorp" },
];

const MOCK_HOLDINGS = ["Groupe Nexalys", "AlphaCorp", "TechVentures", "Omega Holding"];

// --- SOUS-COMPOSANTS ---

const PermissionIcon = ({ active, icon: Icon, color }) => (
  <div className={`p-1.5 rounded-md ${active ? color : 'bg-slate-50 text-slate-300'}`} title={active ? "Autorisé" : "Refusé"}>
    <Icon size={14} strokeWidth={active ? 3 : 2} />
  </div>
);

const HoldingBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end justify-between h-48 gap-2 pt-6">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center flex-1 group">
          <div className="relative w-full flex justify-center">
             {/* Tooltip */}
             <div className="absolute -top-10 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
               {item.count} soc.
             </div>
             <div 
                className="w-full max-w-[32px] bg-blue-500 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-400 cursor-pointer"
                style={{ height: `${(item.count / maxVal) * 140}px` }}
             />
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-3 rotate-[-45deg] origin-top-left whitespace-nowrap">
            {item.name.substring(0, 10)}...
          </span>
        </div>
      ))}
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function DashboardAdmin() {
  const [activeRoleTab, setActiveRoleTab] = useState(MOCK_ROLES_PERMS[0]);

  // Calcul des données pour les bars
  const holdingStats = MOCK_HOLDINGS.map(h => ({
    name: h,
    count: MOCK_SOCIETES.filter(s => s.holding === h).length
  }));

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-4 md:p-8 font-['Sora',sans-serif] text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Console d'Administration</h1>
          <p className="text-slate-500 text-sm font-medium">Vue globale et gestion des accès</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 px-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Système Live</span>
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Admins", value: "24", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Holdings", value: MOCK_HOLDINGS.length, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Sociétés", value: MOCK_SOCIETES.length, icon: Factory, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Nouveaux Roles", value: "3", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-100" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:translate-y-[-4px] transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{kpi.label}</p>
                <h4 className="text-2xl font-black mt-1">{kpi.value}</h4>
              </div>
              <div className={`${kpi.bg} ${kpi.color} p-2.5 rounded-xl`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
              <ArrowUpRight size={12} className="mr-1" /> +12% ce mois
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique en Barres: Sociétés par Holding */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" /> Sociétés par Holding
            </h3>
          </div>
          <HoldingBarChart data={holdingStats} />
          <div className="mt-12 pt-6 border-t border-slate-50 flex justify-between">
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Top Holding</p>
              <p className="text-sm font-black">Nexalys (3)</p>
            </div>
            <div className="w-[1px] bg-slate-100 mx-4" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Taux d'occupation</p>
              <p className="text-sm font-black">84%</p>
            </div>
          </div>
        </div>

        {/* Matrice de Permissions Dynamique */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <Shield size={18} className="text-indigo-500" /> Matrice des Permissions
            </h3>
            {/* Tabs Roles */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {MOCK_ROLES_PERMS.map(role => (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleTab(role)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeRoleTab.id === role.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {role.nom}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="text-left py-3 px-4 italic">Module</th>
                  <th className="py-3 px-2">Read (R)</th>
                  <th className="py-3 px-2">Write (W)</th>
                  <th className="py-3 px-2">Update (U)</th>
                  <th className="py-3 px-2">Delete (D)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeRoleTab.modules.map((mod, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-sm font-bold text-slate-700">{mod.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center">
                        <PermissionIcon active={mod.r} icon={Eye} color="bg-blue-100 text-blue-600" />
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center">
                        <PermissionIcon active={mod.w} icon={Edit3} color="bg-emerald-100 text-emerald-600" />
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center">
                        <PermissionIcon active={mod.u} icon={RefreshCw} color="bg-amber-100 text-amber-600" />
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center">
                        <PermissionIcon active={mod.d} icon={Trash2} color="bg-rose-100 text-rose-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 py-3 rounded-2xl">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Lecture</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Création</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Modification</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suppression</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Activities & Quick Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-rose-50 text-rose-500 p-3 rounded-2xl">
                    <Activity size={24} />
                </div>
                <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Journal de Sécurité</h4>
                    <p className="text-xs text-slate-500 font-medium">3 tentatives de connexion bloquées aujourd'hui</p>
                </div>
            </div>
            <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>

        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 flex items-center justify-between text-white group cursor-pointer hover:bg-indigo-700 transition-all">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl border border-white/10">
                    <Layout size={24} />
                </div>
                <div>
                    <h4 className="font-extrabold text-sm">Gestion des Modules</h4>
                    <p className="text-indigo-100 text-xs font-medium">Configurer les permissions par défaut</p>
                </div>
            </div>
            <div className="bg-white/10 group-hover:bg-white/20 p-2 rounded-xl">
                <ChevronRight size={20} />
            </div>
        </div>
      </div>
    </div>
  );
}