import { useState, useRef, useEffect } from "react";
import logoImage from "../assets/ISO.png"; 
import { LogIn, ChevronDown, ClipboardCheck, Database, ShieldAlert } from "lucide-react";

const mainAxes = [
  { id: "tableau-bord",  label: "Tableau de bord" },
  { id: "clauses",       label: "Clauses" },
  { id: "controles",     label: "Contrôles" },
  { id: "documentation", label: "Documentation" },
  { id: "risques",       label: "Gestion des risques" }
];

const moreAxes = [
  { id: "audits", label: "Audits", icon: <ClipboardCheck size={18} /> },
  { id: "actifs", label: "Actifs", icon: <Database size={18} /> },
];

export default function Header({ activeAxe = "tableau-bord", onAxeChange, onLoginClick, onRegisterClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isMoreActive = moreAxes.some((a) => a.id === activeAxe);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-[1920px] mx-auto px-4 md:px-10 h-[80px] flex items-center justify-between">

        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => onAxeChange("tableau-bord")}>
          <img src={logoImage} alt="Logo" className="h-12 w-auto object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-[19px] font-black text-[#1e3a5f] tracking-tight">
              SMSI <span className="text-blue-600">Manager</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">
              ISO 27001
            </span>
          </div>
        </div>

        {/* NAVIGATION CENTRALE */}
        <nav className="flex items-center gap-2 flex-1 justify-center mx-4">
          {mainAxes.map((axe) => (
            <NavButton
              key={axe.id}
              label={axe.label}
              isActive={activeAxe === axe.id}
              onClick={() => onAxeChange && onAxeChange(axe.id)}
            />
          ))}

          <div ref={dropdownRef} className="relative">
            <NavButton
              label="Plus"
              isActive={isMoreActive || dropdownOpen}
              onClick={() => setDropdownOpen((p) => !p)}
              suffix={
                <ChevronDown size={16} className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
              }
            />

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-3 w-56 bg-white rounded-2xl border border-blue-100 shadow-2xl overflow-hidden z-50 py-2">
                {moreAxes.map((axe) => (
                  <DropdownItem
                    key={axe.id}
                    axe={axe}
                    isActive={activeAxe === axe.id}
                    onClick={() => {
                      onAxeChange && onAxeChange(axe.id);
                      setDropdownOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4 flex-shrink-0 border-l border-slate-100 pl-8 ml-4">
          <LoginButton onClick={onLoginClick} />
          <RegisterButton onClick={onRegisterClick} />
        </div>
      </div>
    </header>
  );
}


function NavButton({ label, isActive, onClick, suffix }) {
    return (
      <button 
        onClick={onClick} 
        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[17px] font-bold transition-all duration-200 whitespace-nowrap 
        ${isActive 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" // Le bleu reste tant que isActive est vrai
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
        className={`w-full flex items-center gap-3 px-5 py-3 text-[15px] font-bold text-left transition-all 
        ${isActive 
          ? "bg-blue-50 text-blue-600" 
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
        }`}
      >
        <span className={isActive ? "text-blue-600" : "text-slate-400"}>{axe.icon}</span>
        {axe.label}
      </button>
    );
}

function LoginButton({ onClick }) {
    return <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-[15px] font-bold rounded-lg text-slate-700 hover:text-blue-600 transition-all"><LogIn size={18} /> Connexion</button>;
}

function RegisterButton({ onClick }) {
    return <button onClick={onClick} className="px-8 py-3 text-[15px] font-bold rounded-full bg-slate-900 text-white shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95">S'inscrire</button>;
}