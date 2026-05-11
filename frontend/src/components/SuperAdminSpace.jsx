import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ChevronDown, BarChart3, Users, Building2, Layers, Key,
  ShieldCheck
} from "lucide-react";
import { useAuth } from '../context/AuthContext';
import GestionHoldings from "./Admin/GestionHoldings";
import GestionSocietes from "./Admin/GestionSocietes";
import GestionUtilisateursAdmins from "./Admin/GestionUtilisateursAdmins";
import GestionRoles from "./Admin/GestionRoles";
import DashboardAdmin from "./Admin/DashboardAdmin";

const GRAD_BLUE = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const FONT = "'Sora', 'Segoe UI', sans-serif";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
  { key: "holdings", label: "Holdings", icon: <Layers size={16} /> },
  { key: "societes", label: "Sociétés", icon: <Building2 size={16} /> },
  { key: "users", label: "Utilisateurs Admins", icon: <Users size={16} /> },
//  { key: "roles", label: "Rôles", icon: <Key size={16} /> },
];

function Header({ activeTab, onTabChange, onLogout, userEmail, userName }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handler = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return 'SA';
  };

  return (
    <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-md" style={{ fontFamily: FONT }}>
      <div className="max-w-[1920px] mx-auto px-6 h-[85px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: GRAD_BLUE }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-black text-[#1e3a5f] tracking-tight">
              SMSI <span className="text-blue-600">Manager</span>
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">ISO 27001</span>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 flex-1 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center flex-shrink-0 border-l border-slate-100 pl-6">
          <div ref={userMenuRef} className="relative">
            <button onClick={() => setUserMenuOpen(p => !p)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-lg shrink-0" style={{ background: GRAD_BLUE }}>
                {getInitials()}
              </div>
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-[15px] font-bold text-slate-800">{userName || 'Super Admin'}</span>
                <span className="text-xs text-slate-400">{userEmail || 'admin@alexsys.com'}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50">
                <div className="px-5 py-5" style={{ background: GRAD_BLUE }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-base font-bold shrink-0">
                      {getInitials()}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[15px] font-bold text-white">{userName || 'Super Admin'}</span>
                      <span className="text-xs text-blue-200">{userEmail || 'admin@alexsys.com'}</span>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-5 py-3 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <LogOut size={18} className="text-red-500" />
                    </span>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function SuperAdminSpace() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const userEmail = user?.email || user?.userName || 'admin@alexsys.com';
  const userName = user?.nomComplet || user?.fullName || 'Super Admin';

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const renderContent = () => {
    switch(activeTab) {
      case "dashboard": return <DashboardAdmin onTabChange={setActiveTab} />;
      case "holdings": return <GestionHoldings />;
      case "societes": return <GestionSocietes />;
      case "users": return <GestionUtilisateursAdmins />;
      case "roles": return <GestionRoles isAdminSocieteMode={false} />;
      default: return <DashboardAdmin />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa]" style={{ fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        button { outline: none; }
      `}</style>
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
        userEmail={userEmail}
        userName={userName}
      />
      <main className="w-full">{renderContent()}</main>
    </div>
  );
}