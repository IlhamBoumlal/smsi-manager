// components/Admin/DashboardAdmin.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Building2, Factory, 
  BarChart3, Activity, ArrowUpRight, 
  Eye, Edit3, Trash2, RefreshCw, Check, X,
  ChevronRight, Layout, Server, TrendingUp, Calendar,
  UserPlus, Clock, AlertCircle, CheckCircle, FileText
} from 'lucide-react';

// --- DATA MOCKS ---
const MOCK_HOLDINGS = ["Groupe Nexalys", "AlphaCorp", "TechVentures", "Omega Holding"];
const MOCK_SOCIETES = [
  { id: 1, holding: "Groupe Nexalys", nom: "Nexalys Solutions", region: "Europe" },
  { id: 2, holding: "Groupe Nexalys", nom: "Nexalys Cloud", region: "Amérique" },
  { id: 3, holding: "AlphaCorp", nom: "Alpha Digital", region: "Asie" },
  { id: 4, holding: "TechVentures", nom: "Tech Innovate", region: "Europe" },
  { id: 5, holding: "Groupe Nexalys", nom: "Nexalys Consulting", region: "Europe" },
  { id: 6, holding: "AlphaCorp", nom: "Alpha Security", region: "Amérique" },
  { id: 7, holding: "Omega Holding", nom: "Omega Data", region: "Asie" },
];

const MOCK_RECENT_ACTIVITIES = [
  { id: 1, type: "user", action: "Nouvel admin ajouté", user: "Jean Dupont", time: "Il y a 2 heures", icon: UserPlus, color: "blue" },
  { id: 2, type: "role", action: "Permissions modifiées", user: "Role 'Admin Holding'", time: "Il y a 5 heures", icon: Shield, color: "purple" },
  { id: 3, type: "societe", action: "Nouvelle société créée", user: "Tech Innovate", time: "Il y a 1 jour", icon: Factory, color: "green" },
  { id: 4, type: "holding", action: "Holding mise à jour", user: "Omega Holding", time: "Il y a 2 jours", icon: Building2, color: "orange" },
];

const MOCK_STATS = {
  totalAdmins: 24,
  adminsActifs: 18,
  adminsInactifs: 6,
  holdingsCount: 4,
  societesCount: 7,
  tauxOccupation: 84,
};

// --- SOUS-COMPOSANTS ---

const StatCard = ({ label, value, icon: Icon, color, bg, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    style={{ animation: `slideUp .5s cubic-bezier(.4,0,.2,1) both` }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{label}</p>
        <h4 className="text-2xl font-black mt-1 text-slate-800">{value}</h4>
      </div>
      <div className={`${bg} ${color} p-2.5 rounded-xl`}>
        <Icon size={20} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
        <ArrowUpRight size={12} className="mr-1" /> {trend}
      </div>
    )}
  </div>
);

const ActivityItem = ({ activity, index }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };
  const Icon = activity.icon;
  return (
    <div 
      className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg px-2"
      style={{ animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${index * 80 + 300}ms both` }}
    >
      <div className={`p-2 rounded-xl ${colorMap[activity.color]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800">{activity.action}</p>
        <p className="text-xs text-slate-400">{activity.user}</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Clock size={12} />
        <span>{activity.time}</span>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function DashboardAdmin() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [recentActivities, setRecentActivities] = useState(MOCK_RECENT_ACTIVITIES);
  const [selectedStat, setSelectedStat] = useState(null);

  // Calcul des données pour les bars
  const holdingStats = MOCK_HOLDINGS.map(h => ({
    name: h,
    count: MOCK_SOCIETES.filter(s => s.holding === h).length
  }));

  const maxCount = Math.max(...holdingStats.map(d => d.count), 1);

  const statsCards = [
    { label: "Administrateurs", value: stats.totalAdmins, icon: Users, color: "text-blue-600", bg: "bg-blue-100", trend: "+12% ce mois", onClick: () => setSelectedStat("admins") },
    { label: "Holdings", value: stats.holdingsCount, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100", trend: null, onClick: () => setSelectedStat("holdings") },
    { label: "Sociétés", value: stats.societesCount, icon: Factory, color: "text-amber-600", bg: "bg-amber-100", trend: null, onClick: () => setSelectedStat("societes") },
    { label: "Taux d'occupation", value: `${stats.tauxOccupation}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100", trend: "+5%", onClick: () => setSelectedStat("occupation") },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FE]" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1400px] px-9 py-9 pb-16 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.8px" }}>
            Console d'Administration
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Vue globale et gestion des accès</p>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>

        {/* Section principale - Graphiques et Activités */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Graphique: Sociétés par Holding */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-500" /> 
                Sociétés par Holding
              </h3>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Total: {stats.societesCount}
              </div>
            </div>

            <div className="flex items-end justify-between h-48 gap-3 pt-2">
              {holdingStats.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center">
                    <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.count} société{item.count > 1 ? 's' : ''}
                    </div>
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-500 cursor-pointer"
                      style={{ height: `${(item.count / maxCount) * 140}px`, minHeight: item.count > 0 ? '8px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-3 text-center truncate w-full px-1">
                    {item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between">
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Holding Max</p>
                <p className="text-sm font-black text-slate-800 mt-1">
                  {holdingStats.reduce((max, item) => item.count > max.count ? item : max, holdingStats[0])?.name}
                </p>
              </div>
              <div className="w-[1px] bg-slate-100" />
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne</p>
                <p className="text-sm font-black text-slate-800 mt-1">
                  {(stats.societesCount / stats.holdingsCount).toFixed(1)} / holding
                </p>
              </div>
              <div className="w-[1px] bg-slate-100" />
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Taux occ.</p>
                <p className="text-sm font-black text-slate-800 mt-1">{stats.tauxOccupation}%</p>
              </div>
            </div>
          </div>

          {/* Activités Récentes */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" /> 
                Activités Récentes
              </h3>
              <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Voir tout <ChevronRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivities.map((activity, i) => (
                <ActivityItem key={activity.id} activity={activity} index={i} />
              ))}
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <CheckCircle size={14} />
                  <span className="text-xs font-bold">{stats.adminsActifs} Actifs</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-rose-500">
                  <AlertCircle size={14} />
                  <span className="text-xs font-bold">{stats.adminsInactifs} Inactifs</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600">
                  <Shield size={14} />
                  <span className="text-xs font-bold">3 Rôles</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Actions Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg shadow-blue-200 text-white group cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Ajouter un Admin</h4>
                  <p className="text-blue-100 text-xs">Nouvel administrateur</p>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-70 group-hover:opacity-100 transition" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Gérer les Rôles</h4>
                  <p className="text-slate-400 text-xs">Permissions et accès</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Rapports</h4>
                  <p className="text-slate-400 text-xs">Export des données</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
          </div>
        </div>

        {/* Section information - Stats complémentaires */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <Calendar size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Dernière mise à jour</p>
                <p className="text-sm font-semibold text-slate-700">Aujourd'hui, {new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Système</p>
                <p className="text-sm font-semibold text-slate-700">✅ Opérationnel</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw size={14} /> Rafraîchir
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}