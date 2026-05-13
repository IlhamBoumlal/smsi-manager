import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ClipboardCheck,
  Database,
  History,
  LogIn,
  LogOut,
  Network,
  Shield,
  Users,
} from "lucide-react";
import isoLogo from "../assets/ISO.png";
import { resolveAssetUrl } from "../api/url";
import { useAuth } from "../context/AuthContext";

const mainAxesCatalog = [
  { id: "cartographie", label: "Cartographie", path: "/cartographie", moduleCode: "cartographie" },
  { id: "tableau-bord", label: "Tableau de bord", path: "/tableau-bord", moduleCode: "dashboard" },
  { id: "pdca", label: "PDCA", path: "/pdca", moduleCode: "pdca" },
  { id: "clauses", label: "Clauses", path: "/clauses", moduleCode: "clauses" },
  { id: "controles", label: "Controles", path: "/controles", moduleCode: "controles" },
  { id: "documentation", label: "Documentation", path: "/documentation", moduleCode: "documentation" },
  { id: "risques", label: "Risques", path: "/risques", moduleCode: "risques" },
];

const moreAxesCatalog = [
  { id: "audits", label: "Audits", path: "/audits", moduleCode: "audit", icon: <ClipboardCheck size={20} /> },
  { id: "actifs", label: "Actifs", path: "/actifs", moduleCode: "actifs", icon: <Database size={20} /> },
  { id: "sensibilisation", label: "Sensibilisation", path: "/sensibilisation", moduleCode: "sensibilisation", icon: <Network size={20} /> },
  { id: "incidents", label: "Gestion Incidents", path: "/incidents", moduleCode: "incidents", icon: <Network size={20} /> },
];

const adminMenuCatalog = [
  { label: "Utilisateurs", Icon: Users, path: "/admin/utilisateurs", moduleCode: "users" },
  { label: "Roles", Icon: Shield, path: "/admin/roles", moduleCode: "roles" },
  { label: "Tracabilite", Icon: History, path: "/admin/tracabilite", moduleCode: "tracabilite" },
];

export default function Header({ activeAxe: activeAxeProp, onAxeChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser, canRead, permissionsLoaded, isAdminSociete } = useAuth();

  const mainAxes = mainAxesCatalog.filter((item) => canRead(item.moduleCode));
  const moreAxes = moreAxesCatalog.filter((item) => canRead(item.moduleCode));
  const adminMenuItems = adminMenuCatalog.filter((item) => canRead(item.moduleCode));

  const hasSmsiNavigation = mainAxes.length > 0 || moreAxes.length > 0;
  const hasAdminNavigation = isAdminSociete && adminMenuItems.length > 0;
  const allAxes = [...mainAxes, ...moreAxes];
  const homePath = mainAxes[0]?.path || moreAxes[0]?.path || adminMenuItems[0]?.path || "/accueil";

  const activeAxe =
    activeAxeProp ??
    allAxes.find((item) => item.path === location.pathname)?.id ??
    mainAxes[0]?.id ??
    moreAxes[0]?.id ??
    "tableau-bord";

  const isMoreActive = moreAxes.some((item) => item.id === activeAxe);
  const nom = user?.nomComplet || user?.NomComplet || "";
  const email = user?.email || user?.Email || "";
  const initiales = nom
    ? nom
        .split(" ")
        .map((segment) => segment[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : email?.charAt(0).toUpperCase() || "?";

  const hasSociete = Boolean(user?.societeId || user?.societe?.id || user?.societe?.Id);
  const societeLogoPath = hasSociete
    ? (user?.societeLogo || user?.societe?.logoUrl || user?.societe?.logo || user?.logoUrl || user?.logo)
    : null;
  const logoImage = resolveAssetUrl(societeLogoPath, isoLogo);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAxeChange = (axe) => {
    if (onAxeChange) onAxeChange(axe.id);
    if (axe.path) navigate(axe.path);
  };

  if (!permissionsLoaded) {
    return (
      <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-md font-sans">
        <div className="max-w-[1920px] mx-auto px-6 h-[85px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src={logoImage} alt="Logo" className="h-12 w-auto object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black text-[#1e3a5f] tracking-tight">
                SMSI <span className="text-blue-600">Manager</span>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">ISO 27001</span>
            </div>
          </div>
          <div className="animate-pulse text-slate-400">Chargement...</div>
        </div>
      </header>
    );
  }

  if (!hasSmsiNavigation && !hasAdminNavigation) {
    return (
      <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-md font-sans">
        <div className="max-w-[1920px] mx-auto px-6 h-[85px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate("/accueil")}>
            <img src={logoImage} alt="Logo" className="h-12 w-auto object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black text-[#1e3a5f] tracking-tight">
                SMSI <span className="text-blue-600">Manager</span>
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">ISO 27001</span>
            </div>
          </div>
          <button
            onClick={() => {
              logoutUser();
              navigate("/");
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Deconnexion
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-md font-sans">
      <div className="max-w-[1920px] mx-auto px-6 h-[85px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate(homePath)}>
          <img src={logoImage} alt="Logo" className="h-12 w-auto object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-black text-[#1e3a5f] tracking-tight">
              SMSI <span className="text-blue-600">Manager</span>
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">ISO 27001</span>
          </div>
        </div>

        {mainAxes.length > 0 && (
          <nav className="flex items-center gap-2 flex-1 justify-center">
            {mainAxes.map((axe) => (
              <NavButton
                key={axe.id}
                label={axe.label}
                isActive={activeAxe === axe.id}
                onClick={() => handleAxeChange(axe)}
              />
            ))}

            {moreAxes.length > 0 && (
              <div ref={dropdownRef} className="relative">
                <NavButton
                  label="Plus"
                  isActive={isMoreActive || dropdownOpen}
                  onClick={() => setDropdownOpen((value) => !value)}
                  suffix={
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  }
                />

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-4 w-60 bg-white rounded-2xl border border-blue-100 shadow-2xl overflow-hidden z-50 py-2">
                    {moreAxes.map((axe) => (
                      <DropdownItem
                        key={axe.id}
                        axe={axe}
                        isActive={activeAxe === axe.id}
                        onClick={() => {
                          handleAxeChange(axe);
                          setDropdownOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        <div className="flex items-center flex-shrink-0 border-l border-slate-100 pl-6">
          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center text-sm font-bold shadow-lg shrink-0">
                  {initiales}
                </div>
                <div className="flex flex-col items-start leading-tight text-left hidden xl:flex">
                  <span className="text-[15px] font-bold text-slate-800 max-w-[150px] truncate">{nom}</span>
                  <span className="text-xs text-slate-400 max-w-[150px] truncate">{email}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-50">
                  <div className="px-5 py-5 bg-[#1e3a5f]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-base font-bold shrink-0">
                        {initiales}
                      </div>
                      <div className="flex flex-col leading-tight overflow-hidden">
                        <span className="text-[15px] font-bold text-white truncate">{nom}</span>
                        <span className="text-xs text-blue-200 truncate">{email}</span>
                      </div>
                    </div>
                  </div>

                  {isAdminSociete && adminMenuItems.length > 0 && (
                    <div className="py-2 border-b border-slate-100">
                      {adminMenuItems.map(({ label, Icon, path }) => (
                        <button
                          key={path}
                          onClick={() => {
                            navigate(path);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-4 px-5 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Icon size={18} className="text-blue-600" />
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="py-2">
                    <button
                      onClick={() => {
                        logoutUser();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-4 px-5 py-3 text-[15px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <LogOut size={18} className="text-red-500" />
                      </span>
                      Deconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-8 py-3 text-[15px] font-bold rounded-full bg-slate-900 text-white shadow-xl hover:bg-blue-700 transition-all active:scale-95"
            >
              <LogIn size={18} /> Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavButton({ label, isActive, onClick, suffix }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-200 whitespace-nowrap ${
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {label} {suffix}
    </button>
  );
}

function DropdownItem({ axe, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 text-[15px] font-bold text-left transition-all ${
        isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      <span className={isActive ? "text-blue-600" : "text-slate-400"}>{axe.icon}</span>
      {axe.label}
    </button>
  );
}
