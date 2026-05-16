import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import isoLogo from "../assets/ISO.png";
import { resolveAssetUrl } from "../api/url";
import {
  ShieldCheck,
  Lightbulb,
  Play,
  Search,
  RotateCcw,
  Zap,
  BarChart3,
  Users,
  LogIn,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";

const pdcaSteps = [
  {
    id: "plan",
    title: "PLAN",
    icon: <Lightbulb size={28} />,
    desc: "Planification stratégique et définition des objectifs de sécurité.",
    gradient: "from-amber-500 to-orange-500",
    stats: "Objectifs SMART",
  },
  {
    id: "do",
    title: "DO",
    icon: <Play size={28} fill="currentColor" />,
    desc: "Mise en œuvre opérationnelle des mesures de sécurité.",
    gradient: "from-blue-500 to-cyan-500",
    stats: "Actions concrètes",
  },
  {
    id: "check",
    title: "CHECK",
    icon: <Search size={28} />,
    desc: "Surveillance et évaluation continue de l'efficacité.",
    gradient: "from-emerald-500 to-teal-500",
    stats: "Suivi en temps réel",
  },
  {
    id: "act",
    title: "ACT",
    icon: <RotateCcw size={28} />,
    desc: "Amélioration continue et actions correctives.",
    gradient: "from-purple-500 to-pink-500",
    stats: "Optimisation continue",
  },
];

const features = [
  {
    title: "Centralisation Intelligente",
    desc: "Regroupez votre gouvernance dans un espace unique et sécurisé.",
    icon: <Zap size={24} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    highlight: "Gagnez 40% de temps",
  },
  {
    title: "Pilotage en Temps Réel",
    desc: "Visualisez votre maturité ISO 27001 avec des dashboards dynamiques.",
    icon: <BarChart3 size={24} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    highlight: "Indicateurs clés",
  },
  {
    title: "Collaboration Transverse",
    desc: "Impliquez vos équipes avec des workflows automatisés et intuitifs.",
    icon: <Users size={24} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    highlight: "+75% d'efficacité",
  },
];

const stats = [
  { value: "99.9%", label: "DISPONIBILITÉ", icon: <Award size={16} /> },
  { value: "< 2min", label: "CONFIGURATION", icon: <Clock size={16} /> },
  { value: "ISO 27001", label: "CERTIFIÉ", icon: <ShieldCheck size={16} /> },
  { value: "24/7", label: "SUPPORT", icon: <TrendingUp size={16} /> },
];

export default function Accueil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const approachSectionRef = useRef(null);
  const featuresSectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasSociete = Boolean(user?.societeId || user?.societe?.id || user?.societe?.Id);
  const societeLogoPath = hasSociete
    ? user?.societeLogo ||
      user?.societe?.logoUrl ||
      user?.societe?.logo ||
      user?.logoUrl ||
      user?.logo
    : null;
  const logoImage = resolveAssetUrl(societeLogoPath, isoLogo);

  const handleLearnMoreClick = () => {
    approachSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openSupportEmail = (subject) => {
    window.location.href = `mailto:support@alexsys.solutions?subject=${encodeURIComponent(subject)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200/70 bg-white/95 shadow-lg backdrop-blur-md"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-[72px] w-full max-w-[1920px] items-center justify-between px-6 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex flex-shrink-0 items-center gap-3 text-left transition-transform hover:scale-105"
          >
            <div className="relative">
              <img src={logoImage} alt="Logo" className="h-11 w-auto object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="bg-gradient-to-r from-[#17335f] to-blue-600 bg-clip-text text-xl font-black tracking-tight text-transparent">
                SMSI <span className="text-blue-600">Manager</span>
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                ISO 27001
              </span>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                <LogIn size={18} />
                Connexion
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-blue-600 to-blue-700 transition-transform duration-300 group-hover:translate-x-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3a] via-[#1a3a6a] to-[#2a5a9a]" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-[1400px] items-center px-6 py-20 md:px-10 lg:px-16">
          <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  <ShieldCheck size={16} />
                  Conforme ISO 27001 : 2022
                </div>

                <h1 className="text-5xl font-black leading-[1.08] text-white md:text-6xl lg:text-7xl">
                  Bienvenue sur
                  <span className="mt-2 block pb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    SMSI Manager
                  </span>
                </h1>

                <p className="text-lg text-blue-100/90 md:text-xl">
                  L'excellence opérationnelle au service de votre cyber-résilience.
                  Pilotez votre conformité ISO 27001 avec précision et simplicité.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="group relative overflow-hidden rounded-xl bg-white px-8 py-3.5 text-base font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Commencer maintenant
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-blue-50 to-cyan-50 transition-transform duration-300 group-hover:translate-x-0" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLearnMoreClick}
                    className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    En savoir plus
                  </button>
                </div>
              </div>

              {/* Stats section corrigée */}
              <div className="border-t border-white/20 pt-8">
                <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="text-center md:min-w-[140px]">
                      <div className="flex min-h-[48px] items-center justify-center gap-2">
                        <span className="whitespace-nowrap text-3xl font-black text-white">
                          {stat.value}
                        </span>
                        <span className="flex-shrink-0 text-blue-300">{stat.icon}</span>
                      </div>
                      <p className="mt-2 whitespace-nowrap text-xs font-bold tracking-wider text-blue-200">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-96 w-96">
                  <div className="absolute inset-0 animate-spin-slow rounded-full border-4 border-dashed border-blue-400/30" />
                  <div className="absolute inset-8 animate-pulse rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={120} className="text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce lg:block">
          <div className="h-10 w-6 rounded-full border-2 border-white/30">
            <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="relative z-10 bg-white">
        {/* PDCA Section corrigée */}
        <div
          id="notre-approche"
          ref={approachSectionRef}
          className="mx-auto max-w-[1400px] scroll-mt-24 px-6 pb-20 pt-14 md:px-10 md:pt-16 lg:px-16"
        >
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              <Target size={16} />
              MÉTHODOLOGIE PDCA
            </div>
            <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
              Notre approche pour votre réussite
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Une méthodologie éprouvée pour une amélioration continue de votre{" "}
              <span className="font-bold text-blue-600">SMSI</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pdcaSteps.map((step) => (
              <div
                key={step.id}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                {/* Badge de statistique */}
                <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {step.stats}
                </div>

                <div className={`relative mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-lg`}>
                  <div className="text-white">{step.icon}</div>
                </div>
                
                <h3 className="mb-2 text-2xl font-black text-slate-900">
                  {step.title}
                </h3>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div id="fonctionnalites" ref={featuresSectionRef} className="bg-gradient-to-b from-slate-100 to-white py-20">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
                <Sparkles size={16} />
                FONCTIONNALITÉS CLÉS
              </div>
              <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
                Une approche 360° de votre sécurité
              </h2>
              <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" />
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
                Nous transformons la complexité de la norme ISO 27001 en un parcours
                clair, pilotable et collaboratif.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent transition-all duration-300 group-hover:scale-150" />
                  
                  <div className={`relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${feature.bg} ${feature.color} transition-transform group-hover:scale-110`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="relative mb-3 text-2xl font-black text-slate-900">
                    {feature.title}
                  </h3>
                  
                  <p className="relative mb-4 text-slate-600">
                    {feature.desc}
                  </p>
                  
                  <div className="relative mt-4 flex items-center gap-2 text-sm font-bold text-blue-600">
                    <TrendingUp size={16} />
                    {feature.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <div className="relative mx-6 my-16 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 shadow-2xl md:mx-10 lg:mx-16">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-8 py-16 text-center md:px-16 md:py-20">
          <h3 className="mb-4 text-3xl font-black text-white md:text-4xl">
            Prêt à transformer votre sécurité ?
          </h3>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            Rejoignez les entreprises qui nous font confiance pour leur conformité ISO 27001
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Commencer maintenant
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <span className="text-xl font-black text-slate-900">
                  SMSI <span className="text-blue-600">Manager</span>
                </span>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Solution complète de gestion de la sécurité de l'information,
                certifiée ISO 27001.
              </p>
              <p className="text-sm font-medium text-slate-600">
                Conforme ISO/IEC 27001:2022
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                Acces rapide
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button type="button" onClick={scrollToTop} className="transition-colors hover:text-blue-600">
                    Accueil
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection(featuresSectionRef)}
                    className="transition-colors hover:text-blue-600"
                  >
                    Fonctionnalites cles
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="transition-colors hover:text-blue-600"
                  >
                    Connexion
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection(approachSectionRef)}
                    className="transition-colors hover:text-blue-600"
                  >
                    Methodologie PDCA
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection(approachSectionRef)}
                    className="transition-colors hover:text-blue-600"
                  >
                    Documentation interne
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openSupportEmail("Support technique SMSI Manager")}
                    className="transition-colors hover:text-blue-600"
                  >
                    Support technique
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openSupportEmail("Assistance administrateur SMSI Manager")}
                    className="transition-colors hover:text-blue-600"
                  >
                    Assistance administrateur
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection(featuresSectionRef)}
                    className="transition-colors hover:text-blue-600"
                  >
                    Mises a jour continues
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-slate-200 pt-8 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Alexsys Solutions. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
