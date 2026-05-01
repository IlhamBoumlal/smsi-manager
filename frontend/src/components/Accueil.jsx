import React from 'react';
import logoIso from "../assets/ISO.png"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Lightbulb, Play, Search, RotateCcw, 
  Zap, BarChart3, Users, LogIn
} from 'lucide-react';

// Données statiques pour les étapes PDCA (Plan-Do-Check-Act)
const pdcaSteps = [
  { id: "plan", title: "PLAN", icon: <Lightbulb size={32} />, desc: "Planification stratégique et définition des objectifs de sécurité." },
  { id: "do", title: "DO", icon: <Play size={32} fill="currentColor" />, desc: "Mise en œuvre opérationnelle des mesures de sécurité." },
  { id: "check", title: "CHECK", icon: <Search size={32} />, desc: "Surveillance et évaluation continue de l'efficacité." },
  { id: "act", title: "ACT", icon: <RotateCcw size={32} />, desc: "Amélioration continue et actions correctives." }
];

// Données statiques pour les fonctionnalités clés
const features = [
  { title: "Centralisation Intelligente", desc: "Regroupez votre gouvernance dans un espace unique.", icon: <Zap size={28} />, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Pilotage en Temps Réel", desc: "Visualisez votre maturité ISO 27001 instantanément.", icon: <BarChart3 size={28} />, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Collaboration Transverse", desc: "Impliquez vos équipes avec des flux automatisés.", icon: <Users size={28} />, color: "text-emerald-600", bg: "bg-emerald-50" }
];

export default function Accueil() {
   const navigate = useNavigate();
   const { user } = useAuth();
   
   // Logique pour déterminer le logo à afficher (défaut ou personnalisé selon l'utilisateur connecté)
   let logoImage = logoIso;
   if (user) {
     let logoPath = null;
     if (user.logoUrl) logoPath = user.logoUrl;
     else if (user.logo) logoPath = user.logo;
     else if (user.societeLogo) logoPath = user.societeLogo;
     else if (user.societe?.logoUrl) logoPath = user.societe.logoUrl;
     else if (user.societe?.logo) logoPath = user.societe.logo;
     
     if (logoPath) {
       if (logoPath.startsWith('/')) {
         logoImage = `http://localhost:5001${logoPath}`;
       } else if (!logoPath.startsWith('http')) {
         logoImage = `http://localhost:5001/${logoPath}`;
       } else {
         logoImage = logoPath;
       }
     }
   }
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER : Barre de navigation avec logo et bouton de connexion */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-10 h-[80px] flex items-center justify-between">
          
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer">
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

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Bouton Connexion avec le design du s'inscrire */}
            <button
             onClick={() => navigate("/login") } className="flex items-center gap-2 px-8 py-3 text-[16px] font-bold rounded-full bg-slate-900 text-white shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95">
              <LogIn size={20} />
              Connexion
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION : Section principale avec titre, description et bouton d'action */}
      <section style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[13px] font-bold uppercase tracking-widest mb-8">
            <ShieldCheck size={16} /> Conforme ISO 27001 : 2022
          </div>
          <h1 className="text-white text-5xl md:text-7xl font-black leading-tight mb-5">
            Bienvenue sur <br /> <span className="text-blue-300">SMSI Manager</span>
          </h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12">
            L'excellence opérationnelle au service de votre cyber-résilience. Gérez votre conformité avec une précision d'expert.
          </p>
          <div className="flex justify-center">
            {/* Bouton Se connecter avec le design "Solid" blanc */}
            <button 
             onClick={() => navigate("/login") } 
            className="px-12 py-4 bg-white text-[#1e3a5f] rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
               <LogIn size={22}/> Se connecter
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-[1450px] mx-auto px-8 mt-12 space-y-16 pb-20">
        
        {/* PDCA STEPS : Section expliquant les 4 étapes du cycle PDCA pour la gestion de la sécurité */}
        <section className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {pdcaSteps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-[#2563eb] rounded-full flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-4 tracking-wider uppercase">{step.title}</h3>
                <p className="text-slate-500 text-sm max-w-[240px] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES : Section présentant les fonctionnalités clés de l'application */}
        <section className="bg-[#f8fafc] rounded-[3rem] p-10 lg:p-16 text-center border border-slate-100">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Une approche 360° de votre sécurité</h2>
          <div className="h-1.5 w-20 bg-blue-600 rounded-full mx-auto mb-6"></div>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg mb-12 font-medium">Nous transformons la complexité de la norme ISO 27001 en un parcours fluide.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col items-center">
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      {/* FOOTER : Pied de page avec informations de contact et copyright */}
      <footer style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }} className="text-white py-12 mt-12 text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 mx-auto mb-6">
            <ShieldCheck size={28} />
          </div>
          <h4 className="text-3xl font-black mb-3 tracking-tight">SMSI <span className="text-blue-200">Manager</span></h4>
          <p className="text-blue-100/70 mb-8 max-w-xl mx-auto font-medium">Alexsys Solutions | Designed for Excellence & Cybersecurity</p>
          
          <div className="h-[1px] w-full bg-white/10 my-8"></div>
          
          <div className="flex flex-wrap justify-center gap-8 text-blue-100 font-bold uppercase tracking-widest text-[11px] mb-8">
              <span className="cursor-pointer hover:text-white transition-colors">Politique de sécurité</span>
              <span className="cursor-pointer hover:text-white transition-colors">Documentation</span>
              <span className="cursor-pointer hover:text-white transition-colors">Contact</span>
          </div>
          
          <p className="text-[11px] font-black tracking-[0.2em] text-blue-200/40 uppercase">
              © {new Date().getFullYear()} Alexsys. All rights reserved.
          </p>
      </footer>
    </div>
  );
}
