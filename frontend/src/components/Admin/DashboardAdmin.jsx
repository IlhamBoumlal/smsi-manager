import React, { useEffect, useState, useRef } from 'react';
import { Users, UserCheck, UserX, Building2, Factory, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5006/api';

// Fonction pour obtenir les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Hook pour animer les chiffres
function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

// Composant carte stat animée
function StatCard({ icon: Icon, label, value, color, bg, delay = 0, badge, subtitle }) {
  const animated = useCountUp(value, 1000, delay);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.2s ease` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={color} size={22} />
        </div>
        {badge !== undefined && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bg} ${color}`}>{badge}%</span>
        )}
      </div>
      <div className={`text-4xl font-black ${color} mb-1 tabular-nums`}>{animated}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}

// Barre de progression animée
function ProgressBar({ label, value, max, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// Mini graphique en cercle (donut)
function DonutChart({ active, inactive, size = 120 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 400); }, []);

  const total = active + inactive;
  if (total === 0) return null;

  const r = 45;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const activePct = active / total;
  const activeLen = animated ? activePct * circumference : 0;
  const inactiveLen = animated ? (1 - activePct) * circumference : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {/* Inactifs */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fca5a5" strokeWidth="14"
          strokeDasharray={`${inactiveLen} ${circumference}`}
          strokeDashoffset={-activeLen}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease 0.6s', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
        {/* Actifs */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth="14"
          strokeDasharray={`${activeLen} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease 0.4s', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fill="#1e293b" fontWeight="800" fontSize="18">{active}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="10">actifs</text>
      </svg>
    </div>
  );
}

export default function DashboardAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const headers = getAuthHeaders();
      const [usersRes, societesRes, holdingsRes] = await Promise.all([
        axios.get(`${API}/user`, headers),
        axios.get(`${API}/societe`, headers),
        axios.get(`${API}/holding`, headers),
      ]);
      
      const users = usersRes.data;
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const recentUsers = users.filter(u => {
        const parts = u.dateCreation?.split('/');
        if (!parts || parts.length !== 3) return false;
        const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return date >= thirtyDaysAgo;
      }).length;

      // Répartition par rôle
      const roleMap = {};
      users.forEach(u => {
        const r = u.role || 'Inconnu';
        roleMap[r] = (roleMap[r] || 0) + 1;
      });
      const roles = Object.entries(roleMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      // Répartition par société
      const societeMap = {};
      users.forEach(u => {
        const s = u.societe || '—';
        societeMap[s] = (societeMap[s] || 0) + 1;
      });
      const societes = Object.entries(societeMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      setData({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        inactiveUsers: users.filter(u => !u.isActive).length,
        totalSocietes: societesRes.data.length,
        totalHoldings: holdingsRes.data.length,
        recentUsers,
        roles,
        societes,
      });
    } catch (e) {
      console.error('Erreur stats:', e);
      if (e.response?.status === 401) {
        alert('Session expirée, veuillez vous reconnecter');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
              <div className="h-9 bg-slate-200 rounded w-16 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const roleColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

  return (
    <div className="p-8 overflow-y-auto">

      {/* Titre */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={22} className="text-blue-600" /> Vue d'ensemble
        </h3>
        <p className="text-sm text-slate-500 mt-1">Statistiques en temps réel de votre plateforme</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Total utilisateurs" value={data.totalUsers}
          color="text-blue-600" bg="bg-blue-50" delay={0} subtitle="Tous comptes confondus" />
        <StatCard icon={UserCheck} label="Comptes actifs" value={data.activeUsers}
          color="text-emerald-600" bg="bg-emerald-50" delay={100}
          badge={data.totalUsers > 0 ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0} />
        <StatCard icon={UserX} label="Comptes inactifs" value={data.inactiveUsers}
          color="text-red-500" bg="bg-red-50" delay={200}
          badge={data.totalUsers > 0 ? Math.round((data.inactiveUsers / data.totalUsers) * 100) : 0} />
        <StatCard icon={TrendingUp} label="Nouveaux (30 jours)" value={data.recentUsers}
          color="text-violet-600" bg="bg-violet-50" delay={300} subtitle="Comptes créés récemment" />
        <StatCard icon={Factory} label="Sociétés" value={data.totalSocietes}
          color="text-amber-600" bg="bg-amber-50" delay={400} />
        <StatCard icon={Building2} label="Holdings" value={data.totalHoldings}
          color="text-slate-600" bg="bg-slate-100" delay={500} />
      </div>

      {/* Ligne du bas : Donut + Répartitions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Donut actifs/inactifs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChart size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Statut des comptes</span>
          </div>
          <div className="flex items-center justify-around">
            <DonutChart active={data.activeUsers} inactive={data.inactiveUsers} size={130} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-xs text-slate-600">Actifs <strong className="text-slate-900">{data.activeUsers}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-300 inline-block"></span>
                <span className="text-xs text-slate-600">Inactifs <strong className="text-slate-900">{data.inactiveUsers}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Répartition par rôle */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Répartition par rôle</span>
          </div>
          {data.roles.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée</p>
          ) : (
            data.roles.map(([role, count], i) => (
              <ProgressBar key={role} label={role} value={count} max={data.totalUsers}
                color={roleColors[i % roleColors.length]} delay={i * 100} />
            ))
          )}
        </div>

        {/* Répartition par société */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Factory size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Utilisateurs par société</span>
          </div>
          {data.societes.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée</p>
          ) : (
            data.societes.map(([societe, count], i) => (
              <ProgressBar key={societe} label={societe === '—' ? 'Sans société' : societe}
                value={count} max={data.totalUsers}
                color={roleColors[i % roleColors.length]} delay={i * 100} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}