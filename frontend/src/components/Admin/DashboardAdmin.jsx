// components/Admin/DashboardAdmin.jsx - Version avec 4 cartes d'actions rapides
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Shield, Building2, Factory, 
  BarChart3, Activity, ArrowUpRight, 
  RefreshCw, X, ChevronRight, TrendingUp, Calendar,
  UserPlus, Clock, AlertCircle, CheckCircle, Key
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5006';

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

const ActivityItem = ({ activity, index, onClick }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };
  const Icon = activity.icon;
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg px-2 cursor-pointer"
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

// --- MODAL DE DÉTAIL ---
function DetailModal({ type, data, onClose }) {
  if (!data) return null;

  const getTitle = () => {
    switch(type) {
      case "admins": return "Liste des Administrateurs";
      case "holdings": return "Liste des Holdings";
      case "societes": return "Liste des Sociétés";
      default: return "Détails";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #1E40AF)" }}>
          <h3 className="text-base font-bold text-white">{getTitle()}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>
        <div className="p-6 overflow-auto max-h-[60vh]">
          {data.length === 0 ? (
            <p className="text-center text-slate-400">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                  <p className="font-medium text-slate-800">{item.nom || item.nomComplet || item.name || item.email}</p>
                  {item.email && <p className="text-xs text-slate-400">{item.email}</p>}
                  {item.code && <p className="text-xs text-slate-400">Code: {item.code}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end p-6 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function DashboardAdmin({ onTabChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    adminsActifs: 0,
    adminsInactifs: 0,
    holdingsCount: 0,
    societesCount: 0,
    tauxOccupation: 0
  });
  const [holdings, setHoldings] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedStat, setSelectedStat] = useState(null);
  const [holdingStats, setHoldingStats] = useState([]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Récupérer les holdings
  const fetchHoldings = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${API_BASE}/api/holding`, config);
      return response.data || [];
    } catch (error) {
      console.error("Erreur chargement holdings:", error);
      return [];
    }
  }, []);

  // Récupérer les sociétés
  const fetchSocietes = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${API_BASE}/api/societe`, config);
      return response.data || [];
    } catch (error) {
      console.error("Erreur chargement sociétés:", error);
      return [];
    }
  }, []);

  // Récupérer les utilisateurs (admins)
  const fetchUsers = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${API_BASE}/api/user`, config);
      const allUsers = response.data || [];
      const adminUsers = allUsers.filter(u => u.role === "Admin");
      return adminUsers;
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      return [];
    }
  }, []);

  // Générer les activités récentes à partir des données des admins
  const generateRecentActivities = (adminsData) => {
    const activities = [];
    
    adminsData.slice(0, 5).forEach((admin, index) => {
      activities.push({
        id: index + 1,
        type: "user",
        action: "Administrateur",
        user: admin.nomComplet || admin.email,
        time: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('fr-FR') : "Récemment",
        icon: UserPlus,
        color: "blue"
      });
    });
    
    return activities;
  };

  // Calculer les statistiques
  const calculateStats = (holdingsData, societesData, adminsData) => {
    const totalAdmins = adminsData.length;
    const adminsActifs = adminsData.filter(a => a.isActive === true).length;
    const adminsInactifs = adminsData.filter(a => a.isActive === false).length;
    const holdingsCount = holdingsData.length;
    const societesCount = societesData.length;
    
    const societesWithAdmin = new Set(adminsData.map(a => a.societeId).filter(id => id));
    const tauxOccupation = societesCount > 0 ? Math.round((societesWithAdmin.size / societesCount) * 100) : 0;
    
    return {
      totalAdmins,
      adminsActifs,
      adminsInactifs,
      holdingsCount,
      societesCount,
      tauxOccupation
    };
  };

  // Calculer les stats par holding
  const calculateHoldingStats = (holdingsData, societesData) => {
    return holdingsData.map(holding => ({
      name: holding.nom,
      count: societesData.filter(s => s.holdingId === holding.id).length
    }));
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [holdingsData, societesData, adminsData] = await Promise.all([
        fetchHoldings(),
        fetchSocietes(),
        fetchUsers()
      ]);
      
      setHoldings(holdingsData);
      setSocietes(societesData);
      setAdmins(adminsData);
      
      const calculatedStats = calculateStats(holdingsData, societesData, adminsData);
      setStats(calculatedStats);
      
      const holdingStatsData = calculateHoldingStats(holdingsData, societesData);
      setHoldingStats(holdingStatsData);
      
      const activities = generateRecentActivities(adminsData);
      setRecentActivities(activities);
      
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, [fetchHoldings, fetchSocietes, fetchUsers]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Gestionnaires de navigation - Utilisation du callback onTabChange
  const handleNavigateToUsers = () => {
    if (onTabChange) {
      onTabChange('users');
    }
  };

  const handleNavigateToHoldings = () => {
    if (onTabChange) {
      onTabChange('holdings');
    }
  };

  const handleNavigateToSocietes = () => {
    if (onTabChange) {
      onTabChange('societes');
    }
  };

  const handleNavigateToRoles = () => {
    if (onTabChange) {
      onTabChange('roles');
    }
  };

  const maxCount = Math.max(...holdingStats.map(d => d.count), 1);

  const statsCards = [
    { 
      label: "Administrateurs", 
      value: stats.totalAdmins, 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-100", 
      trend: null, 
      onClick: handleNavigateToUsers
    },
    { 
      label: "Holdings", 
      value: stats.holdingsCount, 
      icon: Building2, 
      color: "text-indigo-600", 
      bg: "bg-indigo-100", 
      trend: null, 
      onClick: handleNavigateToHoldings
    },
    { 
      label: "Sociétés", 
      value: stats.societesCount, 
      icon: Factory, 
      color: "text-amber-600", 
      bg: "bg-amber-100", 
      trend: null, 
      onClick: handleNavigateToSocietes
    },
    { 
      label: "Taux d'occupation", 
      value: `${stats.tauxOccupation}%`, 
      icon: TrendingUp, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100", 
      trend: null, 
      onClick: () => setSelectedStat("occupation")
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadAllData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE]" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <div className="mx-auto max-w-[1400px] px-9 py-9 pb-16 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: "-0.8px" }}>
            Console d'Administration
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500">Vue globale et gestion des accès</p>
          {user && (
            <p className="text-xs text-slate-400 mt-2">
              Connecté en tant que : <span className="font-semibold">{user.nomComplet || user.email}</span>
            </p>
          )}
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

            {holdingStats.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Building2 size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucune holding disponible</p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-48 gap-3 pt-2">
                  {holdingStats.map((item, i) => (
                    <div 
                      key={i} 
                      className="flex flex-col items-center flex-1 group cursor-pointer"
                      onClick={handleNavigateToSocietes}
                    >
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
                      {holdingStats.reduce((max, item) => item.count > max.count ? item : max, holdingStats[0])?.name || '-'}
                    </p>
                  </div>
                  <div className="w-[1px] bg-slate-100" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne</p>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {stats.holdingsCount > 0 ? (stats.societesCount / stats.holdingsCount).toFixed(1) : '0'} / holding
                    </p>
                  </div>
                  <div className="w-[1px] bg-slate-100" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Taux occ.</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{stats.tauxOccupation}%</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Activités Récentes */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" /> 
                Administrateurs récents
              </h3>
              <button 
                onClick={handleNavigateToUsers}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                Voir tout <ChevronRight size={12} />
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun administrateur trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.map((activity, i) => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    index={i} 
                    onClick={handleNavigateToUsers}
                  />
                ))}
              </div>
            )}

            {/* Stats rapides */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100">
              <div 
                className="text-center cursor-pointer hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                onClick={handleNavigateToUsers}
              >
                <div className="flex items-center justify-center gap-1 text-emerald-600">
                  <CheckCircle size={14} />
                  <span className="text-xs font-bold">{stats.adminsActifs} Actifs</span>
                </div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-rose-50 p-2 rounded-lg transition-colors"
                onClick={handleNavigateToUsers}
              >
                <div className="flex items-center justify-center gap-1 text-rose-500">
                  <AlertCircle size={14} />
                  <span className="text-xs font-bold">{stats.adminsInactifs} Inactifs</span>
                </div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors"
                onClick={handleNavigateToHoldings}
              >
                <div className="flex items-center justify-center gap-1 text-blue-600">
                  <Building2 size={14} />
                  <span className="text-xs font-bold">Holdings</span>
                </div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors"
                onClick={handleNavigateToRoles}
              >
                <div className="flex items-center justify-center gap-1 text-purple-600">
                  <Key size={14} />
                  <span className="text-xs font-bold">Rôles</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Actions Rapides - 4 cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div 
            onClick={handleNavigateToUsers}
            className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg shadow-blue-200 text-white group cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Gérer les Admins</h4>
                  <p className="text-blue-100 text-xs">Nouvel administrateur</p>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-70 group-hover:opacity-100 transition" />
            </div>
          </div>

          <div 
            onClick={handleNavigateToHoldings}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Gérer les Holdings</h4>
                  <p className="text-slate-400 text-xs">Gestion des holdings</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
          </div>

          <div 
            onClick={handleNavigateToSocietes}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                  <Factory size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Gérer les Sociétés</h4>
                  <p className="text-slate-400 text-xs">Gestion des sociétés</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
            </div>
          </div>

          <div 
            onClick={handleNavigateToRoles}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2.5 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Gérer les Rôles</h4>
                  <p className="text-slate-400 text-xs">Permissions et accès</p>
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
                onClick={loadAllData}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCw size={14} /> Rafraîchir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {selectedStat && (
        <DetailModal 
          type={selectedStat} 
          data={
            selectedStat === "admins" ? admins :
            selectedStat === "holdings" ? holdings :
            selectedStat === "societes" ? societes : []
          } 
          onClose={() => setSelectedStat(null)} 
        />
      )}

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