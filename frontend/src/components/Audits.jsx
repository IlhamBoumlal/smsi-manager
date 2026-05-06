import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Search, ChevronDown, ChevronUp,
  Edit3, Trash2, Download, BarChart3, Check, X,
  CheckCircle2, AlertCircle, AlertTriangle, Clock, Loader2, Flag,
  FileText, Tag, Target, Briefcase, FileCheck, Scale,
  Users, UserCheck, Signature, CalendarDays,
  Activity, Info, Building2,
  User, MapPin, Cpu, RefreshCw, Sparkles, Link2,
  GitBranch, BookOpen, AlertOctagon, CircleDot, Eye,
  ChevronRight as ArrowRight, Save, History, FolderOpen,
} from 'lucide-react';
import {
  getAllAudits,
  getAuditById,
  createAudit,
  updateAudit,
  deleteAudit,
  getAllNCs,
  createNC,
  updateNC,
  deleteNC,
  getAllSimulations,
  createSimulation,
  deleteSimulation,
} from '../api/audits';
import { useAuth } from '../context/AuthContext';

// ─── ISO 27001:2022 — 93 contrôles ───────────────────────────────────────────
const ISO_THEMES = [
  {
    id: '5', name: 'Contrôles Organisationnels', shortName: 'Org.', colorHex: '#4F46E5', bgHex: '#EEF2FF',
    controls: [
      { id:'5.1',  name:'Politiques de sécurité',               question:'Votre organisation dispose-t-elle de politiques de sécurité de l\'information formalisées et approuvées par la direction ?' },
      { id:'5.2',  name:'Rôles et responsabilités',             question:'Les rôles et responsabilités en matière de sécurité sont-ils clairement définis et attribués ?' },
      { id:'5.3',  name:'Séparation des tâches',                question:'La séparation des tâches est-elle appliquée pour éviter les conflits d\'intérêts ?' },
      { id:'5.4',  name:'Responsabilités de la direction',      question:'La direction s\'engage-t-elle activement dans le soutien à la sécurité de l\'information ?' },
      { id:'5.5',  name:'Contact avec les autorités',           question:'Des contacts appropriés sont-ils maintenus avec les autorités compétentes ?' },
      { id:'5.6',  name:'Contact avec groupes spécialisés',     question:'Des contacts sont-ils maintenus avec des groupes d\'intérêt spéciaux en sécurité ?' },
      { id:'5.7',  name:'Renseignement sur les menaces',        question:'Votre organisation collecte-t-elle et analyse-t-elle des renseignements sur les cybermenaces ?' },
      { id:'5.8',  name:'Sécurité dans les projets',            question:'La sécurité de l\'information est-elle intégrée dans la gestion de projet ?' },
      { id:'5.9',  name:'Inventaire des actifs',                question:'Un inventaire complet et à jour des actifs informationnels est-il maintenu ?' },
      { id:'5.10', name:'Utilisation acceptable des actifs',    question:'Des règles d\'utilisation acceptable des actifs sont-elles définies et communiquées ?' },
      { id:'5.11', name:'Retour des actifs',                    question:'Des procédures de restitution des actifs existent-elles lors des départs ?' },
      { id:'5.12', name:'Classification de l\'information',     question:'L\'information est-elle classifiée selon des niveaux de sensibilité définis ?' },
      { id:'5.13', name:'Marquage de l\'information',           question:'Des marquages appropriés sont-ils apposés sur les informations sensibles ?' },
      { id:'5.14', name:'Transfert d\'information',             question:'Des règles encadrent-elles le transfert d\'information avec des tiers ?' },
      { id:'5.15', name:'Contrôle d\'accès',                    question:'L\'accès aux systèmes et données est-il restreint selon le principe du moindre privilège ?' },
      { id:'5.16', name:'Gestion des identités',               question:'Un processus de gestion du cycle de vie des identités est-il en place ?' },
      { id:'5.17', name:'Informations d\'authentification',     question:'Les informations d\'authentification sont-elles gérées de manière sécurisée ?' },
      { id:'5.18', name:'Droits d\'accès',                      question:'Les droits d\'accès sont-ils revus et mis à jour régulièrement ?' },
      { id:'5.19', name:'Sécurité fournisseurs',                question:'Les risques de sécurité liés aux fournisseurs sont-ils évalués et gérés ?' },
      { id:'5.20', name:'Sécurité dans les accords',            question:'Les exigences de sécurité sont-elles incluses dans les contrats fournisseurs ?' },
      { id:'5.21', name:'Chaîne d\'approvisionnement TIC',      question:'La sécurité de la chaîne d\'approvisionnement TIC est-elle gérée ?' },
      { id:'5.22', name:'Surveillance des fournisseurs',        question:'Les services fournis par les tiers sont-ils surveillés et audités régulièrement ?' },
      { id:'5.23', name:'Sécurité services cloud',              question:'La sécurité des services cloud est-elle gérée conformément à une politique définie ?' },
      { id:'5.24', name:'Gestion des incidents — préparation',  question:'Des procédures de gestion des incidents de sécurité sont-elles définies et testées ?' },
      { id:'5.25', name:'Évaluation des événements',            question:'Un processus d\'évaluation et de catégorisation des événements de sécurité est-il en place ?' },
      { id:'5.26', name:'Réponse aux incidents',                question:'Un plan de réponse aux incidents est-il opérationnel ?' },
      { id:'5.27', name:'Apprentissage des incidents',          question:'Les leçons tirées des incidents sont-elles documentées et intégrées ?' },
      { id:'5.28', name:'Collecte de preuves',                  question:'Des procédures de collecte et préservation des preuves numériques existent-elles ?' },
      { id:'5.29', name:'Sécurité en cas de perturbation',      question:'La sécurité de l\'information est-elle maintenue lors des perturbations opérationnelles ?' },
      { id:'5.30', name:'Préparation TIC pour la continuité',   question:'La continuité des systèmes TIC est-elle planifiée et testée ?' },
      { id:'5.31', name:'Exigences légales',                    question:'Les obligations légales, réglementaires et contractuelles sont-elles identifiées et respectées ?' },
      { id:'5.32', name:'Propriété intellectuelle',             question:'Les droits de propriété intellectuelle sont-ils protégés et respectés ?' },
      { id:'5.33', name:'Protection des enregistrements',       question:'Les enregistrements importants sont-ils protégés contre la perte ou la falsification ?' },
      { id:'5.34', name:'Confidentialité et données personnelles', question:'La protection des données personnelles est-elle assurée conformément à la réglementation ?' },
      { id:'5.35', name:'Examen indépendant',                   question:'Des revues indépendantes de la sécurité de l\'information sont-elles réalisées régulièrement ?' },
      { id:'5.36', name:'Conformité aux politiques',            question:'La conformité aux politiques de sécurité est-elle vérifiée régulièrement ?' },
      { id:'5.37', name:'Procédures documentées',               question:'Les procédures d\'exploitation de sécurité sont-elles documentées et tenues à jour ?' },
    ],
  },
  {
    id: '6', name: 'Contrôles liés aux Personnes', shortName: 'RH', colorHex: '#059669', bgHex: '#ECFDF5',
    controls: [
      { id:'6.1', name:'Vérifications préalables à l\'embauche', question:'Des vérifications d\'antécédents sont-elles effectuées avant l\'embauche des collaborateurs ?' },
      { id:'6.2', name:'Conditions d\'emploi',                   question:'Les contrats de travail incluent-ils des clauses de sécurité de l\'information ?' },
      { id:'6.3', name:'Sensibilisation et formation',            question:'Le personnel reçoit-il une formation régulière à la sécurité de l\'information ?' },
      { id:'6.4', name:'Processus disciplinaire',                question:'Un processus disciplinaire est-il appliqué en cas de violation de la politique de sécurité ?' },
      { id:'6.5', name:'Responsabilités après l\'emploi',        question:'Les obligations de sécurité sont-elles maintenues après le départ des collaborateurs ?' },
      { id:'6.6', name:'Accords de confidentialité',             question:'Des accords de confidentialité (NDA) sont-ils signés par les collaborateurs et prestataires ?' },
      { id:'6.7', name:'Télétravail',                            question:'Des mesures de sécurité spécifiques au télétravail sont-elles appliquées ?' },
      { id:'6.8', name:'Signalement des événements',             question:'Un canal de signalement des incidents de sécurité est-il accessible à tous les collaborateurs ?' },
    ],
  },
  {
    id: '7', name: 'Contrôles Physiques', shortName: 'Phys.', colorHex: '#D97706', bgHex: '#FFFBEB',
    controls: [
      { id:'7.1',  name:'Périmètres de sécurité physique',      question:'Des périmètres de sécurité physique sont-ils définis et contrôlés ?' },
      { id:'7.2',  name:'Contrôle des entrées physiques',       question:'L\'accès aux zones sécurisées est-il contrôlé et journalisé ?' },
      { id:'7.3',  name:'Sécurisation des bureaux',             question:'Les bureaux et locaux sensibles sont-ils protégés contre les accès non autorisés ?' },
      { id:'7.4',  name:'Surveillance physique',                question:'Une surveillance continue (CCTV, badges) des zones sensibles est-elle en place ?' },
      { id:'7.5',  name:'Protection environnementale',          question:'Les équipements sont-ils protégés contre les menaces physiques et environnementales ?' },
      { id:'7.6',  name:'Travail en zones sécurisées',          question:'Des règles de travail dans les zones sécurisées sont-elles définies et appliquées ?' },
      { id:'7.7',  name:'Bureau propre et écran clair',         question:'Une politique de bureau propre et d\'écran verrouillé est-elle appliquée ?' },
      { id:'7.8',  name:'Emplacement des équipements',          question:'Les équipements critiques sont-ils positionnés de manière à minimiser les risques ?' },
      { id:'7.9',  name:'Actifs hors site',                     question:'La sécurité des équipements utilisés hors des locaux est-elle assurée ?' },
      { id:'7.10', name:'Supports de stockage',                 question:'Les supports amovibles sont-ils gérés et sécurisés conformément à une politique définie ?' },
      { id:'7.11', name:'Services utilitaires',                 question:'Les services essentiels (énergie, climatisation) sont-ils protégés et surveillés ?' },
      { id:'7.12', name:'Câblage de sécurité',                  question:'Les infrastructures de câblage réseau sont-elles protégées contre les interceptions ?' },
      { id:'7.13', name:'Maintenance des équipements',          question:'Les équipements font-ils l\'objet d\'une maintenance régulière et documentée ?' },
      { id:'7.14', name:'Élimination sécurisée des supports',   question:'Les supports en fin de vie sont-ils détruits de manière sécurisée avant élimination ?' },
    ],
  },
  {
    id: '8', name: 'Contrôles Technologiques', shortName: 'Tech.', colorHex: '#2563EB', bgHex: '#EFF6FF',
    controls: [
      { id:'8.1',  name:'Authentification utilisateur',         question:'Des mécanismes d\'authentification robustes (MFA) sont-ils déployés sur les systèmes critiques ?' },
      { id:'8.2',  name:'Gestion des accès privilégiés',        question:'Les comptes à privilèges élevés sont-ils strictement contrôlés et journalisés ?' },
      { id:'8.3',  name:'Gestion des mots de passe',            question:'Une politique de mots de passe robuste est-elle appliquée sur tous les systèmes ?' },
      { id:'8.4',  name:'Accès aux systèmes',                   question:'L\'accès aux systèmes d\'information est-il contrôlé selon une politique définie ?' },
      { id:'8.5',  name:'Identifiants sécurisés',               question:'Les identifiants de service et techniques sont-ils gérés de manière sécurisée ?' },
      { id:'8.6',  name:'Gestion de capacité',                  question:'La capacité des systèmes est-elle surveillée et planifiée pour éviter les saturations ?' },
      { id:'8.7',  name:'Protection antimalware',               question:'Des solutions de protection contre les malwares sont-elles déployées et mises à jour ?' },
      { id:'8.8',  name:'Gestion des vulnérabilités',           question:'Un processus de gestion des vulnérabilités techniques est-il opérationnel ?' },
      { id:'8.9',  name:'Gestion de la configuration',          question:'Des configurations de sécurité standardisées sont-elles appliquées sur tous les systèmes ?' },
      { id:'8.10', name:'Suppression de l\'information',        question:'Des procédures de suppression sécurisée des données sont-elles appliquées ?' },
      { id:'8.11', name:'Masquage des données',                 question:'Le masquage des données est-il utilisé pour protéger les informations sensibles en non-production ?' },
      { id:'8.12', name:'Prévention fuite de données (DLP)',    question:'Des outils DLP sont-ils en place pour prévenir les fuites de données ?' },
      { id:'8.13', name:'Sauvegarde des informations',          question:'Des sauvegardes régulières sont-elles effectuées, testées et stockées hors site ?' },
      { id:'8.14', name:'Journalisation',                       question:'Les événements de sécurité sont-ils journalisés de manière complète et protégée ?' },
      { id:'8.15', name:'Surveillance des activités',           question:'Les activités des utilisateurs et systèmes sont-elles surveillées pour détecter des anomalies ?' },
      { id:'8.16', name:'Surveillance du réseau',               question:'Le réseau est-il surveillé en continu pour détecter les comportements anormaux ?' },
      { id:'8.17', name:'Synchronisation des horloges',         question:'Les horloges de tous les systèmes sont-elles synchronisées avec une source de temps fiable ?' },
      { id:'8.18', name:'Utilisation des outils privilégiés',  question:'L\'utilisation des outils d\'administration à privilèges est-elle restreinte et journalisée ?' },
      { id:'8.19', name:'Installation de logiciels',           question:'L\'installation de logiciels par les utilisateurs est-elle encadrée par une politique technique ?' },
      { id:'8.20', name:'Sécurité des réseaux',                question:'Les réseaux informatiques sont-ils sécurisés et segmentés de manière appropriée ?' },
      { id:'8.21', name:'Sécurité des services réseau',        question:'Les services réseau sont-ils sécurisés, documentés et font-ils l\'objet d\'une revue régulière ?' },
      { id:'8.22', name:'Séparation des réseaux',              question:'Des segmentations réseau (VLAN, DMZ) sont-elles mises en place pour isoler les environnements sensibles ?' },
      { id:'8.23', name:'Filtrage web',                         question:'Le filtrage du trafic web entrant et sortant est-il en place ?' },
      { id:'8.24', name:'Cryptographie',                        question:'Des mécanismes de chiffrement sont-ils appliqués sur les données sensibles au repos et en transit ?' },
      { id:'8.25', name:'Gestion des clés cryptographiques',   question:'Un processus de gestion du cycle de vie des clés cryptographiques est-il en place ?' },
      { id:'8.26', name:'Développement sécurisé',              question:'Des pratiques de développement sécurisé sont-elles appliquées tout au long du cycle de vie ?' },
      { id:'8.27', name:'Ingénierie sécurisée',                question:'Les principes de sécurité by design sont-ils intégrés dans l\'architecture des systèmes ?' },
      { id:'8.28', name:'Codage sécurisé',                     question:'Des standards de codage sécurisé sont-ils définis et respectés par les développeurs ?' },
      { id:'8.29', name:'Tests de sécurité',                   question:'Des tests de sécurité sont-ils réalisés avant toute mise en production ?' },
      { id:'8.30', name:'Développement externalisé',           question:'La sécurité est-elle contrôlée dans les développements externalisés ?' },
      { id:'8.31', name:'Séparation des environnements',       question:'Les environnements de développement, test et production sont-ils strictement séparés ?' },
      { id:'8.32', name:'Gestion des changements',             question:'Tout changement en production est-il soumis à un processus d\'approbation et de test ?' },
      { id:'8.33', name:'Données de test',                     question:'Les données utilisées pour les tests sont-elles anonymisées ou fictives ?' },
      { id:'8.34', name:'Protection pendant les audits',       question:'Les systèmes d\'information sont-ils protégés lors des audits pour éviter toute perturbation ?' },
    ],
  },
];

const ALL_CONTROLS = ISO_THEMES.flatMap(t => t.controls.map(c => ({ ...c, theme: t })));
const TOTAL_CONTROLS = ALL_CONTROLS.length;

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  planned:      { label:'Planifié',  color:'text-amber-600',   bg:'bg-amber-50',   border:'border-amber-200',  icon:Clock },
  'in-progress':{ label:'En cours',  color:'text-blue-600',    bg:'bg-blue-50',    border:'border-blue-200',   icon:Activity },
  completed:    { label:'Terminé',   color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200', icon:CheckCircle2 },
};

const TYPE_CFG = {
  external_cert:{ label:'Certification', icon:FileCheck, color:'text-indigo-700', bg:'bg-indigo-50', border:'border-indigo-200' },
  external_surv:{ label:'Surveillance',  icon:Eye,       color:'text-blue-700',   bg:'bg-blue-50',   border:'border-blue-200' },
  supplier:     { label:'Fournisseur',   icon:Briefcase, color:'text-amber-700',  bg:'bg-amber-50',  border:'border-amber-200' },
};

const NC_STATUS_CFG = {
  open:         { label:'Ouverte',   color:'text-red-600',    bg:'bg-red-50',    border:'border-red-200',   leftBorder:'border-l-red-400' },
  'in-progress':{ label:'En cours',  color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-200', leftBorder:'border-l-amber-400' },
  resolved:     { label:'Résolue',   color:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-200',leftBorder:'border-l-emerald-400' },
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const PBar = ({ value, max=100 }) => {
  const pct = max ? Math.min(100, Math.round((value/max)*100)) : 0;
  const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-400' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden h-2">
        <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{width:`${pct}%`}}/>
      </div>
      <div className="flex justify-between text-xs text-gray-400 font-medium">
        <span>{value}/{max}</span>
        <span className="font-bold text-gray-600">{pct}%</span>
      </div>
    </div>
  );
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Card = ({ children, className='', padding=true, onClick }) => (
  <div onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${onClick?'cursor-pointer hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200':''} ${padding?'p-5':''} ${className}`}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant='primary', size='md', disabled=false, loading=false, icon:Icon, className='' }) => {
  const V = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700',
    outline: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400',
    danger:  'bg-red-600 hover:bg-red-700 text-white border-red-700',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
    ghost:   'bg-transparent border-transparent text-gray-500 hover:bg-gray-100',
    save:    'bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-800',
  };
  const S = { xs:'px-2.5 py-1.5 text-xs gap-1', sm:'px-3.5 py-2 text-xs gap-1.5', md:'px-5 py-2.5 text-sm gap-2', lg:'px-6 py-3 text-sm gap-2' };
  return (
    <button onClick={disabled||loading?undefined:onClick} disabled={disabled||loading}
      className={`inline-flex items-center justify-center font-semibold rounded-xl border-2 transition-all duration-200 focus:outline-none ${V[variant]||V.primary} ${S[size]} ${disabled||loading?'opacity-50 cursor-not-allowed':'active:scale-[0.98]'} ${className}`}>
      {loading?<Loader2 className="w-4 h-4 animate-spin"/>:Icon&&<Icon className={size==='xs'?'w-3.5 h-3.5':'w-4 h-4'}/>}
      {children}
    </button>
  );
};

const Inp = ({ label, error, icon:Icon, required, hint, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">{Icon&&<Icon className="w-3.5 h-3.5 text-gray-400"/>}{label}{required&&<span className="text-red-500">*</span>}</label>}
    <input className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all ${error?'border-red-400':'border-gray-200'}`} {...props}/>
    {(hint||error) && <p className={`text-xs ${error?'text-red-600':'text-gray-400'}`}>{error||hint}</p>}
  </div>
);

const Sel = ({ label, options, value, onChange, placeholder='Sélectionner...', icon:Icon, required, hint }) => (
  <div className="space-y-1.5">
    {label && <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">{Icon&&<Icon className="w-3.5 h-3.5 text-gray-400"/>}{label}{required&&<span className="text-red-500">*</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer">
      <option value="">{placeholder}</option>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Tex = ({ label, required, rows=3, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold text-gray-700">{label}{required&&<span className="text-red-500 ml-1">*</span>}</label>}
    <textarea rows={rows} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" {...props}/>
  </div>
);

const StatusBadge = ({ cfg }) => {
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {Icon && <Icon className="w-3 h-3"/>}{cfg.label}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || TYPE_CFG.external_cert;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <Icon className="w-3 h-3"/>{cfg.label}
    </span>
  );
};

const Toast = ({ msg, type, onClose }) => {
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${type==='error'?'bg-red-50 border-red-200 text-red-700':'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      {type==='error'?<AlertCircle className="w-5 h-5"/>:<CheckCircle2 className="w-5 h-5"/>}
      <span className="text-sm font-medium">{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100"/></button>
    </div>
  );
};

// ─── ACTION BAR ───────────────────────────────────────────────────────────────
const MODULES = [
  { id:'plan',     label:'Planifier',   icon:CalendarDays,  accent:'indigo', desc:'Audits : certification / surveillance / fournisseur' },
  { id:'simulate', label:'Simuler',     icon:Sparkles,      accent:'indigo', desc:'Auto-évaluation Oui/Non des 93 contrôles — entraînement uniquement' },
  { id:'post',     label:'Post-Audit',  icon:BarChart3,     accent:'indigo', desc:'Vérifier chaque contrôle : Conforme (C) ou Non-Conforme (NC)' },
  { id:'nc',       label:'NC',          icon:AlertTriangle, accent:'indigo', desc:'Suivi et traitement des non-conformités avec actions correctives' },
  { id:'gap',      label:'Écart / SoA', icon:GitBranch,     accent:'indigo', desc:'Statement of Applicability et analyse comparative simulation vs audit' },
];

const ACC_ACTIVE = {
  indigo:  'bg-blue-700 text-white border-blue-800',
  purple:  'bg-purple-600 text-white border-purple-700',
  emerald: 'bg-emerald-600 text-white border-emerald-700',
  red:     'bg-red-600 text-white border-red-700',
  amber:   'bg-amber-500 text-white border-amber-600',
};

function ActionBar({ active, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {MODULES.map(m => {
          const Icon = m.icon;
          const isActive = active === m.id;
          return (
            <button key={m.id} onClick={()=>onChange(m.id)} title={m.desc}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${isActive ? ACC_ACTIVE[m.accent] : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4"/>{m.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2.5 pl-1 italic">{MODULES.find(m=>m.id===active)?.desc}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — PLANIFIER
// ═══════════════════════════════════════════════════════════════════════════════
function PlanModule({ audits, saving, onSave, onDelete, canWrite, canEdit, canDelete }) {
  const EMPTY = { title:'', type:'external_cert', startDate:'', endDate:'', auditor:'', org:'', scope:'Tous les contrôles ISO 27001:2022', objectives:'', rssi:'', approver:'', status:'planned' };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); if(errors[k]) setErrors(e=>({...e,[k]:null})); };

  const validate = () => {
    const e = {};
    if(!form.title?.trim()) e.title = 'Requis';
    if(!form.startDate) e.startDate = 'Requis';
    if(!form.auditor?.trim()) e.auditor = 'Requis';
    if(!form.org?.trim()) e.org = 'Requis';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if(!validate()) return;
    onSave(form, editId);
    setShowForm(false); setForm(EMPTY); setEditId(null);
  };

  const openEdit = (a) => { setForm({...a}); setEditId(a.id); setShowForm(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
        <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"/>
        <p className="text-xs text-gray-600">Ce module est réservé aux <strong>audits</strong> externes.</p>
      </div>

      <div className="flex justify-end">
        {canWrite && !showForm && <Btn icon={CalendarDays} onClick={()=>{ setForm(EMPTY); setEditId(null); setShowForm(true); }}>Planifier un audit</Btn>}
      </div>

      {showForm && (
        <Card className="border border-indigo-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileCheck className="w-5 h-5 text-indigo-500"/>{editId?'Modifier l\'audit':'Planifier un audit externe'}</h3>
            <button onClick={()=>{ setShowForm(false); setEditId(null); }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-400"/></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Inp label="Titre de l'audit" placeholder="Ex : Audit de certification ISO 27001 — 2026" value={form.title} onChange={e=>set('title',e.target.value)} error={errors.title} required icon={Tag}/>
              </div>
              <Sel label="Type d'audit externe" value={form.type} onChange={v=>set('type',v)} icon={Briefcase} required
                options={[{value:'external_cert',label:'Certification — Organisme accrédité'},{value:'external_surv',label:'Surveillance — Suivi post-certification'},{value:'supplier',label:'Fournisseur — Évaluation prestataire'}]}/>
              <Sel label="Statut" value={form.status} onChange={v=>set('status',v)} icon={Activity}
                options={Object.entries(STATUS_CFG).map(([k,v])=>({value:k,label:v.label}))}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Inp label="Date de début" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} error={errors.startDate} required/>
              <Inp label="Date de fin" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} hint="Optionnelle"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Inp label="Auditeur / Responsable" placeholder="Nom de l'auditeur principal" value={form.auditor} onChange={e=>set('auditor',e.target.value)} error={errors.auditor} required icon={UserCheck}/>
              <Inp label="Organisme certificateur" placeholder="Ex : Bureau Veritas, SGS, AFNOR…" value={form.org} onChange={e=>set('org',e.target.value)} error={errors.org} required icon={Building2}/>
              <Inp label="RSSI" value={form.rssi} onChange={e=>set('rssi',e.target.value)} icon={Shield}/>
              <Inp label="Approbateur" value={form.approver} onChange={e=>set('approver',e.target.value)} icon={Signature}/>
            </div>
            <Inp label="Périmètre / Scope" value={form.scope} onChange={e=>set('scope',e.target.value)} icon={Target}/>
            <Tex label="Objectifs de l'audit" rows={3} placeholder="Décrire les objectifs, critères et livrables attendus…" value={form.objectives} onChange={e=>set('objectives',e.target.value)}/>
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <Btn variant="outline" icon={X} onClick={()=>{ setShowForm(false); setEditId(null); }}>Annuler</Btn>
            <Btn icon={CheckCircle2} onClick={handleSave} loading={saving}>{editId?'Enregistrer':'Planifier'}</Btn>
          </div>
        </Card>
      )}

      {!showForm && (
        <div className="space-y-3">
          {audits.length===0 && (
            <Card className="text-center py-14 border border-dashed border-gray-300">
              <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
              <p className="font-semibold text-gray-500">Aucun audit externe planifié</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur « Planifier un audit externe » pour commencer</p>
            </Card>
          )}
          {audits.map(a => {
            const sc = STATUS_CFG[a.status] || STATUS_CFG.planned;
            return (
              <Card key={a.id} className="border border-gray-200">
                <div className="flex items-start gap-4">
                  <TypeBadge type={a.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge cfg={sc}/>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{a.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3"/>{a.auditor}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/>{a.org}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>{a.startDate}{a.endDate&&a.endDate!==a.startDate?` → ${a.endDate}`:''}</span>
                    </div>
                    {a.scope && <p className="text-xs text-gray-400 mt-1">{a.scope}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {canEdit && <button onClick={()=>openEdit(a)} className="p-2 hover:bg-indigo-50 rounded-xl transition-colors"><Edit3 className="w-4 h-4 text-gray-400 hover:text-indigo-600"/></button>}
                    {canDelete && <button onClick={()=>onDelete(a.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500"/></button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — SIMULER
// ═══════════════════════════════════════════════════════════════════════════════
function SimulateModule({ simHistory, onSaveSimulation, canWrite }) {
  const [view, setView] = useState('list');
  const [simName, setSimName] = useState('');
  const [simAuthor, setSimAuthor] = useState('');
  const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);
  const [themeFilter, setThemeFilter] = useState(null);
  const [answers, setAnswers] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [comments, setComments] = useState({});
  const [savedToast, setSavedToast] = useState(false);
  const [viewingSim, setViewingSim] = useState(null);

  const filtered = themeFilter ? ALL_CONTROLS.filter(c=>c.theme.id===themeFilter) : ALL_CONTROLS;
  const totalAnswered = Object.keys(answers).length;
  const totalOui = Object.values(answers).filter(v=>v==='yes').length;
  const totalNon = Object.values(answers).filter(v=>v==='no').length;
  const score = totalAnswered > 0 ? Math.round((totalOui / totalAnswered) * 100) : 0;

  const handleSave = () => {
    if (!canWrite) return;
    const sim = { id:`sim-${Date.now()}`, name:simName, author:simAuthor, date:simDate, answers:{...answers}, comments:{...comments}, score, totalAnswered, oui:totalOui, non:totalNon };
    onSaveSimulation(sim);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleReset = () => {
    setAnswers({}); setComments({}); setSimName(''); setSimAuthor('');
    setThemeFilter(null); setExpandedId(null); setView('list'); setSavedToast(false);
  };

  if (view === 'history-detail' && viewingSim) {
    return (
      <div className="space-y-4">
        <button onClick={()=>setView('list')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">
          <ArrowRight className="w-3.5 h-3.5 rotate-180"/>Retour à l'historique
        </button>
        <Card className="border border-gray-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{viewingSim.name}</h3>
              <p className="text-xs text-gray-400">{viewingSim.author} · {viewingSim.date}</p>
            </div>
            <div className="text-2xl font-extrabold text-indigo-600">{viewingSim.score}%</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-gray-700">{viewingSim.totalAnswered}</div><div className="text-xs text-gray-500 mt-1">Répondus</div></div>
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-emerald-600">{viewingSim.oui}</div><div className="text-xs text-gray-500 mt-1">Oui ✓</div></div>
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-red-500">{viewingSim.non}</div><div className="text-xs text-gray-500 mt-1">Non ✗</div></div>
          </div>
          <PBar value={viewingSim.oui} max={TOTAL_CONTROLS}/>
          {viewingSim.non > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-700 mb-2">Points à améliorer ({viewingSim.non}) :</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {ALL_CONTROLS.filter(c=>viewingSim.answers[c.id]==='no').map(c=>(
                  <div key={c.id} className="flex items-center gap-2.5 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[11px] font-extrabold font-mono flex-shrink-0" style={{color:c.theme.colorHex}}>{c.id}</span>
                    <span className="text-xs text-gray-700">{c.name}</span>
                    {viewingSim.comments[c.id] && <span className="text-[10px] text-gray-400 ml-auto italic truncate max-w-32">{viewingSim.comments[c.id]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (view === 'list') return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400"/>
          <h3 className="font-bold text-gray-900">Historique des simulations</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">{simHistory.length}</span>
        </div>
        {canWrite && <Btn icon={Plus} onClick={()=>setView('setup')}>Nouvelle simulation</Btn>}
      </div>

      {simHistory.length === 0 && (
        <Card className="text-center py-14 border border-dashed border-gray-300">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
          <p className="font-semibold text-gray-500">Aucune simulation enregistrée</p>
          <p className="text-sm text-gray-400 mt-1">Lancez votre première simulation pour alimenter l'historique</p>
        </Card>
      )}

      <div className="space-y-3">
        {simHistory.map(sim => {
          const scoreColor = sim.score >= 70 ? 'text-emerald-600' : sim.score >= 40 ? 'text-amber-500' : 'text-red-500';
          return (
            <Card key={sim.id} onClick={()=>{ setViewingSim(sim); setView('history-detail'); }} className="border border-gray-200 hover:border-indigo-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-gray-200 bg-gray-50 flex-shrink-0">
                  <span className={`text-xl font-extrabold leading-none ${scoreColor}`}>{sim.score}%</span>
                  <span className="text-[9px] font-semibold text-gray-400 mt-0.5">Score</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm">{sim.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                    {sim.author && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3"/>{sim.author}</span>}
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>{sim.date}</span>
                    <span className="text-emerald-600 font-semibold">{sim.oui} Oui</span>
                    <span className="text-red-500 font-semibold">{sim.non} Non</span>
                    <span className="text-gray-300">{sim.totalAnswered}/{TOTAL_CONTROLS} répondus</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{width:`${(sim.oui/TOTAL_CONTROLS)*100}%`}}/>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0"/>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  if (view === 'setup') return (
    <div className="space-y-4">
      <button onClick={()=>setView('list')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">
        <ArrowRight className="w-3.5 h-3.5 rotate-180"/>Retour
      </button>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-bold text-gray-800">Mode entraînement — Simulation ISO 27001:2022</p>
          <p className="text-xs text-gray-500 mt-1">Répondez par <strong>Oui</strong> ou <strong>Non</strong> à chaque question. Les résultats sont sauvegardés dans l'historique.</p>
        </div>
      </div>
      <Card className="border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/>Nouvelle simulation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Inp label="Nom de la simulation" placeholder="Ex : Entraînement pré-certification" value={simName} onChange={e=>setSimName(e.target.value)} required/>
          <Inp label="Auteur" placeholder="Votre nom" value={simAuthor} onChange={e=>setSimAuthor(e.target.value)}/>
          <Inp label="Date" type="date" value={simDate} onChange={e=>setSimDate(e.target.value)}/>
        </div>
        <div className="flex justify-end mt-5">
          <Btn disabled={!simName.trim()} onClick={()=>setView('quiz')}>
            <Sparkles className="w-4 h-4"/>Démarrer la simulation
          </Btn>
        </div>
      </Card>
    </div>
  );

  if (view === 'results') return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div><h3 className="font-bold text-gray-900 text-lg">{simName}</h3><p className="text-xs text-gray-400">{simAuthor} · {simDate}</p></div>
          <div className="flex gap-2">
            {savedToast && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5"/>Simulation enregistrée !
              </span>
            )}
            {canWrite && <Btn variant="save" icon={Save} size="sm" onClick={handleSave} disabled={savedToast}>{savedToast ? 'Enregistré ✓' : 'Enregistrer'}</Btn>}
            <Btn variant="outline" icon={RefreshCw} size="sm" onClick={handleReset}>Nouvelle simulation</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-indigo-200">
            <div className="text-3xl font-extrabold text-indigo-600">{score}%</div>
            <div className="text-xs text-gray-500 mt-1">Score de conformité</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-3xl font-extrabold text-emerald-600">{totalOui}</div>
            <div className="text-xs text-gray-500 mt-1">Réponses Oui ✓</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-3xl font-extrabold text-red-500">{totalNon}</div>
            <div className="text-xs text-gray-500 mt-1">Réponses Non ✗</div>
          </div>
        </div>
        <PBar value={totalOui} max={TOTAL_CONTROLS}/>
        {totalNon>0 && (
          <div className="mt-5">
            <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500"/>Points à travailler ({totalNon} contrôles) :</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {ALL_CONTROLS.filter(c=>answers[c.id]==='no').map(c=>(
                <div key={c.id} className="flex items-center gap-2.5 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-[11px] font-extrabold font-mono flex-shrink-0" style={{color:c.theme.colorHex}}>{c.id}</span>
                  <span className="text-xs text-gray-700">{c.name}</span>
                  {comments[c.id] && <span className="text-[10px] text-gray-400 ml-auto italic truncate max-w-32">{comments[c.id]}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mt-4">
          <p className="text-xs text-gray-500 flex items-start gap-2"><Info className="w-4 h-4 flex-shrink-0"/>Les contrôles répondus <strong>Non</strong> doivent être documentés lors du vrai audit. Utilisez le module <strong>Post-Audit</strong> pour la vérification officielle C/NC.</p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div><span className="font-bold text-gray-900">{simName}</span>{simAuthor&&<span className="text-xs text-gray-400 ml-2">{simAuthor}</span>}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-3 text-xs font-bold">
              <span className="text-emerald-600">{totalOui} Oui</span>
              <span className="text-red-500">{totalNon} Non</span>
              <span className="text-gray-300">{TOTAL_CONTROLS-totalAnswered} sans réponse</span>
            </div>
            {totalAnswered > 0 && canWrite && (
              <Btn size="sm" variant="save" icon={Save} onClick={handleSave} disabled={savedToast}>{savedToast ? '✓ Enregistré' : 'Enregistrer'}</Btn>
            )}
            {totalAnswered===TOTAL_CONTROLS && (
              <Btn size="sm" icon={BarChart3} onClick={()=>setView('results')}>Résultats</Btn>
            )}
          </div>
        </div>
        <PBar value={totalAnswered} max={TOTAL_CONTROLS}/>
        {savedToast && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5"/>Simulation sauvegardée !</div>
        )}
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setThemeFilter(null)} className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${!themeFilter?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
          Tout ({TOTAL_CONTROLS})
        </button>
        {ISO_THEMES.map(t=>{
          const cnt = Object.keys(answers).filter(id=>id.startsWith(t.id+'.')).length;
          const isSel = themeFilter===t.id;
          return (
            <button key={t.id} onClick={()=>setThemeFilter(isSel?null:t.id)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap"
              style={isSel?{background:t.colorHex,borderColor:t.colorHex,color:'white'}:{background:'white',color:t.colorHex,borderColor:t.colorHex+'60'}}>
              {t.shortName} {cnt}/{t.controls.length}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map(ctrl=>{
          const ans = answers[ctrl.id];
          const isExp = expandedId===ctrl.id;
          return (
            <div key={ctrl.id} className={`rounded-2xl border overflow-hidden transition-all duration-200 ${ans==='yes'?'border-emerald-300 bg-emerald-50/30':ans==='no'?'border-red-300 bg-red-50/30':'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border" style={{background:ctrl.theme.bgHex,borderColor:ctrl.theme.colorHex+'40'}}>
                  <span className="text-[10px] font-extrabold leading-none text-center" style={{color:ctrl.theme.colorHex}}>{ctrl.id}</span>
                </div>
                <button className="flex-1 text-left min-w-0" onClick={()=>setExpandedId(isExp?null:ctrl.id)}>
                  <p className="text-sm font-semibold text-gray-800">{ctrl.name}</p>
                  <p className="text-xs text-gray-400">{ctrl.theme.shortName}</p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>{ setAnswers(p=>({...p,[ctrl.id]:'yes'})); setExpandedId(null); }}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${ans==='yes'?'bg-emerald-600 text-white border-emerald-600':'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400'}`}>
                    ✓ Oui
                  </button>
                  <button onClick={()=>{ setAnswers(p=>({...p,[ctrl.id]:'no'})); setExpandedId(ctrl.id); }}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${ans==='no'?'bg-red-600 text-white border-red-600':'bg-white text-red-700 border-red-200 hover:border-red-400'}`}>
                    ✗ Non
                  </button>
                  <button onClick={()=>setExpandedId(isExp?null:ctrl.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    {isExp?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
                  </button>
                </div>
              </div>
              {isExp && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed italic bg-gray-50 rounded-xl p-3 border border-gray-100">«&nbsp;{ctrl.question}&nbsp;»</p>
                  <Tex rows={2} placeholder="Commentaire facultatif (justification, preuves…)" value={comments[ctrl.id]||''} onChange={e=>setComments(p=>({...p,[ctrl.id]:e.target.value}))}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalAnswered > 0 && canWrite && (
        <div className="sticky bottom-4 z-20">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
            <div className="text-sm text-white font-medium">
              <span className="font-bold">{totalAnswered}/{TOTAL_CONTROLS}</span> répondus · <span className="text-gray-300">{score}% conforme</span>
            </div>
            <div className="flex gap-2">
              <Btn size="sm" variant="save" icon={Save} onClick={handleSave} disabled={savedToast}>{savedToast ? '✓ Enregistré' : 'Enregistrer'}</Btn>
              {totalAnswered === TOTAL_CONTROLS && (
                <Btn size="sm" variant="outline" icon={BarChart3} onClick={()=>setView('results')}>Résultats</Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — POST-AUDIT
// ═══════════════════════════════════════════════════════════════════════════════
function PostAuditModule({ onToast, onNCCreated, allAudits, canWrite }) {
  const [view, setView] = useState('list');
  const [localAudits, setLocalAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [themeFilter, setThemeFilter] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [comments, setComments] = useState({});
  const [ncForms, setNcForms] = useState({});
  const [soaGenerated, setSoaGenerated] = useState(false);

  const EMPTY_AUDIT = {
    name: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    auditor: '',
    scope: 'Tous les contrôles',
    status: 'in-progress',
    type: 'external_cert'
  };

  const [auditForm, setAuditForm] = useState(EMPTY_AUDIT);
  const [auditErrors, setAuditErrors] = useState({});
  const setAF = (k,v) => { setAuditForm(f=>({...f,[k]:v})); if(auditErrors[k]) setAuditErrors(e=>({...e,[k]:null})); };

  const validateAudit = () => {
    const e={};
    if(!auditForm.name?.trim()) e.name='Requis';
    if(!auditForm.auditor?.trim()) e.auditor='Requis';
    if(!auditForm.date) e.date='Requis';
    setAuditErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreateAudit = () => {
    if(!validateAudit()) return;
    const a = { id: `local-${Date.now()}`, ...auditForm, type: auditForm.type || 'external_cert' };
    setLocalAudits(p=>[a,...p]);
    setAuditForm(EMPTY_AUDIT);
    setView('list');
  };

  const mergedAudits = useMemo(() => {
    const baseAudits = allAudits || [];
    const localWithType = localAudits.map(a => ({ ...a, type: a.type || 'external_cert' }));
    return [...baseAudits, ...localWithType.filter(a=>!baseAudits.find(m=>m.id===a.id))];
  }, [localAudits, allAudits]);

  const openVerify = (a) => {
    setSelectedAudit(a);
    setStatuses(a.controlStatuses||{});
    setComments(a.controlComments||{});
    setNcForms({}); setSoaGenerated(false); setThemeFilter(null); setExpandedId(null);
    setView('verify');
  };

  const setNcField = (id,field,val) => setNcForms(p=>({...p,[id]:{...(p[id]||{}),[field]:val}}));

  const auditedCount = Object.keys(statuses).length;
  const conformeCount = Object.values(statuses).filter(v=>v==='C').length;
  const ncCount = Object.values(statuses).filter(v=>v==='NC').length;

  const handleGenerateSoA = () => {
    const auditName = selectedAudit.title || selectedAudit.name || '';
    const isLocalId = !selectedAudit.id || String(selectedAudit.id).startsWith('local-');
    const auditId   = isLocalId ? null : selectedAudit.id;
    ALL_CONTROLS.filter(c=>statuses[c.id]==='NC').forEach(c=>{
      const f = ncForms[c.id]||{};
      onNCCreated({
        controlId: c.id, title: f.title || c.name, description: f.desc || comments[c.id] || '',
        correctiveAction: f.action || '', responsible: f.resp || '', deadline: f.deadline || '',
        auditName, auditId,
      });
    });
    setSoaGenerated(true);
    onToast(`SoA généré — ${conformeCount} conformes, ${ncCount} NC enregistrées`,'success');
  };

  const filtered = themeFilter ? ALL_CONTROLS.filter(c=>c.theme.id===themeFilter) : ALL_CONTROLS;

  if(view==='list') return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs text-gray-600 flex items-start gap-2"><Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400"/> Evaluez chaque contrôle ISO 27001:2022 comme <strong>Conforme (C)</strong> ou <strong>Non-Conforme (NC)</strong>.</p>
        </div>
      </div>
      <div className="flex justify-end">
        {canWrite && <Btn icon={Plus} onClick={()=>setView('create')}>Créer un audit</Btn>}
      </div>
      {mergedAudits.length===0 && (
        <Card className="text-center py-14 border border-dashed border-gray-300">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
          <p className="font-semibold text-gray-500">Aucun audit créé</p>
        </Card>
      )}
      {mergedAudits.map(a=>{
        const sc = STATUS_CFG[a.status]||STATUS_CFG['in-progress'];
        return (
          <Card key={a.id} onClick={()=>openVerify(a)} className="border border-gray-200 hover:border-emerald-400 cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge cfg={sc}/>
                  <TypeBadge type={a.type} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{a.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3"/>{a.auditor}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>{a.date}</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3"/>{a.scope}</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 flex-shrink-0"><ArrowRight className="w-4 h-4"/>Vérifier C / NC</span>
            </div>
          </Card>
        );
      })}
    </div>
  );

  if(view==='create') return (
    <Card className="border border-gray-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/>Créer un audit</h3>
        <button onClick={()=>setView('list')} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-400"/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Inp label="Nom de l'audit" placeholder="Ex : Audit interne Q1 2026" value={auditForm.name} onChange={e=>setAF('name',e.target.value)} error={auditErrors.name} required icon={FileText}/>
        <Inp label="Auteur / Organisation" placeholder="Ex : Équipe SSI" value={auditForm.author} onChange={e=>setAF('author',e.target.value)} icon={Building2}/>
        <Inp label="Date" type="date" value={auditForm.date} onChange={e=>setAF('date',e.target.value)} error={auditErrors.date} required/>
        <Inp label="Auditeur principal" placeholder="Nom de l'auditeur" value={auditForm.auditor} onChange={e=>setAF('auditor',e.target.value)} error={auditErrors.auditor} required icon={UserCheck}/>
        <Inp label="Périmètre / Scope" placeholder="Ex : Contrôles A.5 à A.8" value={auditForm.scope} onChange={e=>setAF('scope',e.target.value)} icon={Target}/>
        <Sel label="Type d'audit" value={auditForm.type} onChange={v=>setAF('type',v)} icon={Briefcase}
          options={[
            {value:'external_cert', label:'Certification — Organisme accrédité'},
            {value:'external_surv', label:'Surveillance — Suivi post-certification'},
            {value:'supplier', label:'Fournisseur — Évaluation prestataire'}
          ]}/>
        <Sel label="Statut" value={auditForm.status} onChange={v=>setAF('status',v)} options={Object.entries(STATUS_CFG).map(([k,v])=>({value:k,label:v.label}))}/>
      </div>
      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <Btn variant="outline" icon={X} onClick={()=>setView('list')}>Annuler</Btn>
        <Btn variant="success" icon={CheckCircle2} onClick={handleCreateAudit}>Créer et démarrer</Btn>
      </div>
    </Card>
  );

  if(view==='verify') return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <button onClick={()=>setView('list')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors mb-3">
          <ArrowRight className="w-3.5 h-3.5 rotate-180"/>Retour à la liste
        </button>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{selectedAudit?.name}</h3>
            <p className="text-xs text-gray-400">{selectedAudit?.auditor} · {selectedAudit?.date} · {selectedAudit?.scope}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-4 text-sm font-bold">
              <span className="text-gray-600">{auditedCount}/{TOTAL_CONTROLS}</span>
              <span className="text-emerald-600">{conformeCount} C</span>
              <span className="text-red-500">{ncCount} NC</span>
            </div>
            <Btn size="sm" icon={BookOpen} variant="success" disabled={auditedCount===0||soaGenerated} onClick={handleGenerateSoA}>{soaGenerated?'SoA généré ✓':'Générer SoA'}</Btn>
          </div>
        </div>
        <PBar value={auditedCount} max={TOTAL_CONTROLS}/>
        {soaGenerated && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0"/>
            <p className="text-xs font-semibold text-emerald-700">SoA généré — {conformeCount} conformes, {ncCount} non-conformité(s) transférées dans le module NC</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[{label:'Audités',value:auditedCount,val:'text-gray-700'},{label:'Conformes (C)',value:conformeCount,val:'text-emerald-600'},{label:'Non-conformes (NC)',value:ncCount,val:'text-red-500'}].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.val}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setThemeFilter(null)} className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${!themeFilter?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
          Tous ({TOTAL_CONTROLS})
        </button>
        {ISO_THEMES.map(t=>{
          const cnt = Object.keys(statuses).filter(id=>id.startsWith(t.id+'.')).length;
          const isSel = themeFilter===t.id;
          return (
            <button key={t.id} onClick={()=>setThemeFilter(isSel?null:t.id)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap"
              style={isSel?{background:t.colorHex,borderColor:t.colorHex,color:'white'}:{background:'white',color:t.colorHex,borderColor:t.colorHex+'60'}}>
              {t.shortName} {cnt}/{t.controls.length}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map(ctrl=>{
          const st = statuses[ctrl.id];
          const isExp = expandedId===ctrl.id;
          const nc = ncForms[ctrl.id]||{};
          return (
            <div key={ctrl.id} className={`rounded-2xl border overflow-hidden transition-all duration-200 ${st==='C'?'border-emerald-300 bg-emerald-50/20':st==='NC'?'border-red-300 bg-red-50/20':'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border" style={{background:ctrl.theme.bgHex,borderColor:ctrl.theme.colorHex+'40'}}>
                  <span className="text-[10px] font-extrabold" style={{color:ctrl.theme.colorHex}}>{ctrl.id}</span>
                </div>
                <button className="flex-1 text-left min-w-0" onClick={()=>setExpandedId(isExp?null:ctrl.id)}>
                  <p className="text-sm font-semibold text-gray-800">{ctrl.name}</p>
                  <p className="text-xs text-gray-400">{ctrl.theme.shortName}</p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={()=>{ setStatuses(p=>({...p,[ctrl.id]:'C'})); if(expandedId===ctrl.id) setExpandedId(null); }}
                    className={`px-5 py-2.5 rounded-xl border-2 font-extrabold text-sm transition-all ${st==='C'?'bg-emerald-600 text-white border-emerald-600':'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400'}`}>
                    ✓ C
                  </button>
                  <button onClick={()=>{ setStatuses(p=>({...p,[ctrl.id]:'NC'})); setExpandedId(ctrl.id); }}
                    className={`px-4 py-2.5 rounded-xl border-2 font-extrabold text-sm transition-all ${st==='NC'?'bg-red-600 text-white border-red-600':'bg-white text-red-700 border-red-200 hover:border-red-400'}`}>
                    ✗ NC
                  </button>
                  <button onClick={()=>setExpandedId(isExp?null:ctrl.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    {isExp?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
                  </button>
                </div>
              </div>
              {isExp && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600 italic bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">«&nbsp;{ctrl.question}&nbsp;»</p>
                  <Tex rows={2} placeholder="Commentaire d'audit (constat, preuves observées…)" value={comments[ctrl.id]||''} onChange={e=>setComments(p=>({...p,[ctrl.id]:e.target.value}))}/>
                  {st==='NC' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>Fiche de non-conformité</p>
                      <Inp label="Titre de la NC" placeholder="Ex : Absence de politique MDP formalisée" value={nc.title||''} onChange={e=>setNcField(ctrl.id,'title',e.target.value)} required/>
                      <Tex label="Description de l'écart" rows={2} placeholder="Décrire factuellement l'écart observé…" value={nc.desc||''} onChange={e=>setNcField(ctrl.id,'desc',e.target.value)}/>
                      <Tex label="Action corrective proposée" rows={2} placeholder="Action à mettre en œuvre…" value={nc.action||''} onChange={e=>setNcField(ctrl.id,'action',e.target.value)}/>
                      <div className="grid grid-cols-2 gap-3">
                        <Inp label="Responsable" placeholder="Nom ou équipe" value={nc.resp||''} onChange={e=>setNcField(ctrl.id,'resp',e.target.value)}/>
                        <Inp label="Échéance" type="date" value={nc.deadline||''} onChange={e=>setNcField(ctrl.id,'deadline',e.target.value)}/>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {soaGenerated && (
        <Card className="border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500"/>SoA Post-Audit — {selectedAudit?.name}</h4>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">{conformeCount}/{TOTAL_CONTROLS} conformes</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">Contrôle</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {ALL_CONTROLS.map((c,i)=>(
                  <tr key={c.id} className={`border-b border-gray-50 ${statuses[c.id]==='NC'?'bg-red-50/60':statuses[c.id]==='C'?'bg-emerald-50/30':i%2===0?'bg-white':'bg-gray-50/30'}`}>
                    <td className="px-3 py-2.5 font-mono font-extrabold" style={{color:c.theme.colorHex}}>{c.id}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-3 py-2.5 text-center">
                      {statuses[c.id]==='C'  && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-full"><Check className="w-3 h-3"/>Conforme</span>}
                      {statuses[c.id]==='NC' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 font-bold border border-red-200 rounded-full"><X className="w-3 h-3"/>NC</span>}
                      {!statuses[c.id]       && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 max-w-xs">{comments[c.id]||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — NC
// ═══════════════════════════════════════════════════════════════════════════════
function NCModule({ ncs, saving, onAdd, onUpdate, onDelete, allAudits, canWrite, canEdit, canDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAudit, setFilterAudit] = useState('');
  const [search, setSearch] = useState('');
  const [expandedNC, setExpandedNC] = useState(null);
  const [showActionFor, setShowActionFor] = useState(null);
  const [newAction, setNewAction] = useState({ description:'', responsible:'', deadline:'' });
  const EMPTY = { title:'', description:'', controlId:'', actor:'', correctiveAction:'', responsible:'', deadline:'', status:'open' };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const set = (k,v) => { setForm(f=>({...f,[k]:v})); if(errors[k]) setErrors(e=>({...e,[k]:null})); };

  const validate = () => {
    const e={};
    if(!form.title?.trim()) e.title='Requis';
    if(!form.description?.trim()) e.description='Requis';
    setErrors(e); return !Object.keys(e).length;
  };
  const handleSave = () => { if(validate()){ onAdd(form); setShowForm(false); setForm(EMPTY); } };

  const filtered = useMemo(()=>ncs.filter(n=>{
    if(filterStatus && n.status!==filterStatus) return false;
    if(filterAudit && n.auditId!==filterAudit && n.auditName!==filterAudit) return false;
    if(search){ const q=search.toLowerCase(); return n.title?.toLowerCase().includes(q)||n.controlId?.toLowerCase().includes(q)||n.auditName?.toLowerCase().includes(q); }
    return true;
  }),[ncs,filterStatus,filterAudit,search]);

  const openCount=filtered.filter(n=>n.status==='open').length;
  const inProgCount=filtered.filter(n=>n.status==='in-progress').length;
  const resolvedCount=filtered.filter(n=>n.status==='resolved').length;

  const auditOptions = useMemo(()=>{
    const unique = (allAudits||[]).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
    return [{value:'',label:'Tous les audits'},...unique.map(a=>({value:a.id,label:a.name || a.title}))];
  },[allAudits]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Ouvertes',value:openCount,val:'text-red-500'},{label:'En cours',value:inProgCount,val:'text-amber-500'},{label:'Résolues',value:resolvedCount,val:'text-emerald-600'}].map(s=>(
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.val}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
          <input className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Rechercher NC…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-600" value={filterAudit} onChange={e=>setFilterAudit(e.target.value)}>
          {auditOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select className="text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-600" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(NC_STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        {canWrite && <Btn icon={Plus} variant="danger" onClick={()=>setShowForm(true)}>Nouvelle NC</Btn>}
      </div>

      {showForm && (
        <Card className="border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/>Nouvelle non-conformité</h3>
            <button onClick={()=>{setShowForm(false);setForm(EMPTY);}} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-400"/></button>
          </div>
          <div className="space-y-4">
            <Inp label="Titre" placeholder="Ex : Absence de politique de sécurité formalisée" value={form.title} onChange={e=>set('title',e.target.value)} error={errors.title} required icon={AlertTriangle}/>
            <Tex label="Description" rows={3} placeholder="Décrivez la non-conformité…" value={form.description} onChange={e=>set('description',e.target.value)} required/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Sel label="Contrôle ISO concerné" value={form.controlId} onChange={v=>set('controlId',v)} options={ALL_CONTROLS.map(c=>({value:c.id,label:`${c.id} — ${c.name}`}))} placeholder="Sélectionner un contrôle"/>
              <Sel label="Audit associé" value={form.auditId} onChange={v=>{ const aud=auditOptions.find(a=>a.value===v); set('auditId',v); set('auditName',aud?.label||''); }} options={auditOptions.filter(o=>o.value)} placeholder="Sélectionner un audit"/>
              <Inp label="Responsable / Acteur" placeholder="Nom du responsable" value={form.actor} onChange={e=>set('actor',e.target.value)} icon={UserCheck}/>
            </div>
            <Tex label="Action corrective initiale" rows={2} placeholder="Décrire l'action à mener…" value={form.correctiveAction} onChange={e=>set('correctiveAction',e.target.value)}/>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Responsable de l'action" placeholder="Nom" value={form.responsible} onChange={e=>set('responsible',e.target.value)}/>
              <Inp label="Échéance" type="date" value={form.deadline} onChange={e=>set('deadline',e.target.value)}/>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Btn variant="outline" icon={X} onClick={()=>{setShowForm(false);setForm(EMPTY);}}>Annuler</Btn>
            <Btn variant="danger" icon={Plus} onClick={handleSave} loading={saving}>Créer la NC</Btn>
          </div>
        </Card>
      )}

      {filtered.length===0 && !showForm && (
        <Card className="text-center py-12 border border-dashed border-gray-300">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
          <p className="font-semibold text-gray-500">Aucune non-conformité</p>
          <p className="text-sm text-gray-400 mt-1">Les NC créées depuis le Post-Audit ou ici apparaîtront dans cette liste</p>
        </Card>
      )}

      {filtered.map(nc=>{
        const sm = NC_STATUS_CFG[nc.status]||NC_STATUS_CFG.open;
        const ctrl = nc.controlId ? ALL_CONTROLS.find(c=>c.id===nc.controlId) : null;
        const isExp = expandedNC===nc.id;
        const actions = nc.correctiveActions||[];
        const doneActions = actions.filter(a=>a.status==='completed').length;
        return (
          <div key={nc.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm border-l-4 ${sm.leftBorder} p-5`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {nc.auditName && <span className="text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-medium">{nc.auditName}</span>}
                      {ctrl && <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-md border" style={{color:ctrl.theme.colorHex,background:ctrl.theme.bgHex,borderColor:ctrl.theme.colorHex+'40'}}>{ctrl.id}</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${sm.bg} ${sm.border} ${sm.color}`}>{sm.label}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{nc.title}</h4>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>setExpandedNC(isExp?null:nc.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      {isExp?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
                    </button>
                    {canDelete && <button onClick={()=>onDelete(nc.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500"/></button>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{nc.description}</p>
                {(nc.actor||nc.deadline) && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    {nc.actor && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3"/>{nc.actor}</span>}
                    {nc.deadline && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>Échéance : {nc.deadline}</span>}
                    {actions.length>0 && <span className="flex items-center gap-1 text-indigo-600 font-semibold"><CheckCircle2 className="w-3 h-3"/>{doneActions}/{actions.length} actions</span>}
                  </div>
                )}
                {isExp && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(NC_STATUS_CFG).map(([k,v])=>(
                        <button key={k} onClick={()=>onUpdate(nc.id,{...nc,status:k})}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${nc.status===k?`${v.bg} ${v.border} ${v.color}`:'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                    {nc.correctiveAction && <p className="text-sm text-gray-600"><span className="font-semibold">Action corrective :</span> {nc.correctiveAction}</p>}
                    {actions.map(act=>(
                      <div key={act.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                        <button onClick={()=>onUpdate(nc.id,{...nc,correctiveActions:actions.map(a=>a.id===act.id?{...a,status:a.status==='completed'?'pending':'completed'}:a)})} className="mt-0.5 flex-shrink-0">
                          {act.status==='completed'?<CheckCircle2 className="w-4 h-4 text-emerald-500"/>:<CircleIcon className="w-4 h-4 text-gray-400 hover:text-indigo-400"/>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${act.status==='completed'?'line-through text-gray-400':'text-gray-800'}`}>{act.description}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            {act.responsible&&<span>{act.responsible}</span>}
                            {act.deadline&&<span>→ {act.deadline}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {showActionFor===nc.id ? (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <Tex rows={2} placeholder="Décrire l'action corrective…" value={newAction.description} onChange={e=>setNewAction(p=>({...p,description:e.target.value}))}/>
                        <div className="grid grid-cols-2 gap-2">
                          <Inp placeholder="Responsable" value={newAction.responsible} onChange={e=>setNewAction(p=>({...p,responsible:e.target.value}))}/>
                          <Inp type="date" value={newAction.deadline} onChange={e=>setNewAction(p=>({...p,deadline:e.target.value}))}/>
                        </div>
                        <div className="flex gap-2">
                          <Btn size="xs" variant="outline" icon={X} onClick={()=>{ setShowActionFor(null); setNewAction({description:'',responsible:'',deadline:''}); }}>Annuler</Btn>
                          <Btn size="xs" disabled={!newAction.description.trim()} onClick={()=>{
                            const action={ id:`act-${Date.now()}`, description:newAction.description, responsible:newAction.responsible, deadline:newAction.deadline, status:'pending' };
                            onUpdate(nc.id,{...nc,correctiveActions:[...actions,action]});
                            setShowActionFor(null); setNewAction({description:'',responsible:'',deadline:''});
                          }}><Plus className="w-3.5 h-3.5"/>Ajouter</Btn>
                        </div>
                      </div>
                    ) : (canEdit && (
                      <button onClick={()=>setShowActionFor(nc.id)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-indigo-50 border border-indigo-100 transition-colors w-fit">
                        <Plus className="w-3.5 h-3.5"/>Ajouter une action corrective
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CircleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — GAP / SOA
// ═══════════════════════════════════════════════════════════════════════════════
function GapSoAModule({ ncs, onToast, allAudits, canExport }) {
  const [activeTab, setActiveTab] = useState('soa');
  const [themeFilter, setThemeFilter] = useState(null);
  const [filterAudit, setFilterAudit] = useState('');

  const filteredNCs = useMemo(() => {
    if (!filterAudit) return ncs;
    return ncs.filter(nc => nc.auditId===filterAudit || nc.auditName===filterAudit);
  }, [ncs, filterAudit]);

  const soaData = useMemo(()=>
    ALL_CONTROLS.map(c=>{ const nc=filteredNCs.find(n=>n.controlId===c.id); return {...c,status:nc?'non_conforme':'conforme',nc}; })
  ,[filteredNCs]);

  const conformes=soaData.filter(c=>c.status==='conforme').length;
  const nonConformes=soaData.filter(c=>c.status==='non_conforme').length;
  const filtered=themeFilter?soaData.filter(c=>c.theme.id===themeFilter):soaData;
  const gaps=filteredNCs.map(nc=>({...nc,ctrl:ALL_CONTROLS.find(c=>c.id===nc.controlId)}));

  const auditOptions = useMemo(()=>{
    const unique = (allAudits||[]).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
    return [{value:'',label:'Tous les audits'},...unique.map(a=>({value:a.id,label:a.name || a.title}))];
  },[allAudits]);

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500"/>Statement of Applicability (SoA)</h3>
            <p className="text-xs text-gray-400 mt-0.5">ISO/IEC 27001:2022 · Clause 6.1.3d · Mis à jour depuis les NC enregistrées</p>
          </div>
          {canExport && <Btn variant="outline" size="sm" icon={Download} onClick={()=>onToast('Export SoA CSV en cours…','success')}>Exporter SoA</Btn>}
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Filtrer par audit</label>
          <select className="text-sm px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-600" value={filterAudit} onChange={e=>setFilterAudit(e.target.value)}>
            {auditOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-gray-700">{TOTAL_CONTROLS}</div><div className="text-xs text-gray-500 mt-1">Total</div></div>
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-emerald-600">{conformes}</div><div className="text-xs text-gray-500 mt-1">Conformes</div></div>
          <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-2xl font-extrabold text-red-500">{nonConformes}</div><div className="text-xs text-gray-500 mt-1">Non-conformes</div></div>
        </div>
        <PBar value={conformes} max={TOTAL_CONTROLS}/>
      </Card>

      <div className="flex border-b border-gray-200">
        {[{id:'soa',label:'SoA — Tableau d\'applicabilité',icon:BookOpen},{id:'gaps',label:`Analyse des écarts (${gaps.length})`,icon:GitBranch}].map(t=>{
          const TI=t.icon;
          return <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab===t.id?'border-indigo-500 text-indigo-600':'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}><TI className="w-4 h-4"/>{t.label}</button>;
        })}
      </div>

      {activeTab==='soa' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={()=>setThemeFilter(null)} className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${!themeFilter?'bg-gray-800 text-white border-gray-800':'bg-white text-gray-600 border-gray-200'}`}>Tous</button>
            {ISO_THEMES.map(t=>{
              const isSel=themeFilter===t.id;
              return <button key={t.id} onClick={()=>setThemeFilter(isSel?null:t.id)} className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap" style={isSel?{background:t.colorHex,borderColor:t.colorHex,color:'white'}:{background:'white',color:t.colorHex,borderColor:t.colorHex+'60'}}>{t.shortName}</button>;
            })}
          </div>
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">Contrôle</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-500 uppercase">Applicable</th>
                  <th className="text-center px-3 py-3 font-bold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-3 py-3 font-bold text-gray-500 uppercase">NC liée</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c,i)=>(
                  <tr key={c.id} className={`border-b border-gray-50 ${c.status==='non_conforme'?'bg-red-50/50':i%2===0?'bg-white':'bg-gray-50/30'}`}>
                    <td className="px-3 py-2.5 font-mono font-extrabold" style={{color:c.theme.colorHex}}>{c.id}</td>
                    <td className="px-3 py-2.5"><p className="font-semibold text-gray-800">{c.name}</p><p className="text-gray-400">{c.theme.shortName}</p></td>
                    <td className="px-3 py-2.5 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto"/></td>
                    <td className="px-3 py-2.5 text-center">
                      {c.status==='conforme'
                        ?<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-full"><Check className="w-3 h-3"/>Conforme</span>
                        :<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 font-bold border border-red-200 rounded-full"><X className="w-3 h-3"/>NC</span>}
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">{c.nc?<p className="text-red-500 font-medium truncate">{c.nc.title}</p>:<span className="text-gray-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab==='gaps' && (
        <div className="space-y-3">
          {gaps.length===0 && (
            <Card className="text-center py-12 border border-dashed border-gray-300">
              <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
              <p className="font-semibold text-gray-500">Aucun écart enregistré</p>
              <p className="text-sm text-gray-400 mt-1">Les NC créées dans le Post-Audit alimentent automatiquement cette analyse</p>
            </Card>
          )}
          {gaps.length>0 && (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-3 font-bold text-gray-500">Contrôle</th>
                    <th className="text-left px-3 py-3 font-bold text-gray-500">Non-conformité</th>
                    <th className="text-center px-3 py-3 font-bold text-gray-500">Statut NC</th>
                    <th className="text-left px-3 py-3 font-bold text-gray-500">Responsable</th>
                    <th className="text-left px-3 py-3 font-bold text-gray-500">Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {gaps.map((g,i)=>{
                    const sm=NC_STATUS_CFG[g.status]||NC_STATUS_CFG.open;
                    return (
                      <tr key={g.id||i} className={`border-b border-gray-50 ${i%2===0?'bg-white':'bg-gray-50/30'}`}>
                        <td className="px-3 py-2.5">
                          {g.ctrl?<><span className="font-mono font-extrabold" style={{color:g.ctrl.theme.colorHex}}>{g.ctrl.id}</span><span className="ml-1.5 text-gray-600 font-medium">{g.ctrl.name}</span></>:<span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 max-w-xs"><span className="truncate block">{g.title}</span></td>
                        <td className="px-3 py-2.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-bold ${sm.bg} ${sm.border} ${sm.color}`}>{sm.label}</span></td>
                        <td className="px-3 py-2.5 text-gray-500">{g.actor||g.responsible||'—'}</td>
                        <td className="px-3 py-2.5 text-gray-500">{g.deadline||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export function Audits() {
  const { canRead, canWrite, canEdit, canDelete, canExport } = useAuth();
  const moduleCode = "audits";
  const hasAccess = canRead(moduleCode);

  const [audits,     setAudits]     = useState([]);
  const [ncs,        setNcs]        = useState([]);
  const [simHistory, setSimHistory] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [module,     setModule]     = useState('plan');

  const showToast = useCallback((msg, type='error')=>setToast({msg,type}),[]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ad, nc, sims] = await Promise.all([
        getAllAudits().catch(() => []),
        getAllNCs().catch(() => []),
        getAllSimulations().catch(() => []),
      ]);
      setAudits(ad);
      setNcs(nc);
      setSimHistory(sims);
    } catch (err) {
      showToast('Erreur de connexion au serveur — vérifiez que le backend est démarré', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(()=>{ load(); },[load]);

  const handleSaveSimulation = useCallback(async (sim) => {
    if (!canWrite(moduleCode)) {
      showToast('Vous n\'avez pas la permission de créer des simulations', 'error');
      return;
    }
    try {
      const saved = await createSimulation({
        name: sim.name, author: sim.author, date: sim.date,
        score: sim.score, totalAnswered: sim.totalAnswered,
        oui: sim.oui, non: sim.non,
        answers: sim.answers, comments: sim.comments,
      });
      setSimHistory(prev => [saved, ...prev.filter(s => s.id !== saved.id)]);
      showToast('Simulation enregistrée dans l\'historique', 'success');
    } catch {
      showToast('Erreur lors de la sauvegarde de la simulation');
    }
  }, [showToast, canWrite, moduleCode]);

  const stats = useMemo(()=>({
    total:     audits.length,
    planned:   audits.filter(a=>a.status==='planned').length,
    inProg:    audits.filter(a=>a.status==='in-progress').length,
    completed: audits.filter(a=>a.status==='completed').length,
    openNCs:   ncs.filter(n=>n.status==='open').length,
    sims:      simHistory.length,
  }),[audits,ncs,simHistory]);

  const handleSavePlan = async (data, editId) => {
    if (!canWrite(moduleCode)) { showToast('Vous n\'avez pas la permission de créer des audits', 'error'); return; }
    setSaving(true);
    try {
      if (editId) {
        const u = await updateAudit(editId, data);
        setAudits(p => p.map(a => a.id === editId ? u : a));
        showToast('Audit mis à jour', 'success');
      } else {
        const c = await createAudit(data);
        setAudits(p => [...p, c]);
        showToast('Audit planifié', 'success');
      }
    } catch { showToast('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDeletePlan = async (id) => {
    if (!canDelete(moduleCode)) { showToast('Vous n\'avez pas la permission de supprimer des audits', 'error'); return; }
    if (!window.confirm('Supprimer cet audit ?')) return;
    try { await deleteAudit(id); setAudits(p => p.filter(a => a.id !== id)); showToast('Audit supprimé', 'success'); }
    catch { showToast('Erreur'); }
  };

  const handleAddNC = async (data) => {
    if (!canWrite(moduleCode)) { showToast('Vous n\'avez pas la permission de créer des NC', 'error'); return; }
    setSaving(true);
    try { const c = await createNC({ ...data, correctiveActions: [] }); setNcs(p => [...p, c]); showToast('NC créée', 'success'); }
    catch { showToast('Erreur'); }
    finally { setSaving(false); }
  };

  const handleUpdateNC = async (id, data) => {
    if (!canEdit(moduleCode)) { showToast('Vous n\'avez pas la permission de modifier des NC', 'error'); return; }
    try { const u = await updateNC(id, data); setNcs(p => p.map(n => n.id === id ? u : n)); }
    catch { showToast('Erreur mise à jour NC'); }
  };

  const handleDeleteNC = async (id) => {
    if (!canDelete(moduleCode)) { showToast('Vous n\'avez pas la permission de supprimer des NC', 'error'); return; }
    if (!window.confirm('Supprimer cette NC ?')) return;
    try { await deleteNC(id); setNcs(p => p.filter(n => n.id !== id)); showToast('NC supprimée', 'success'); }
    catch { showToast('Erreur'); }
  };

  const handleNCFromPostAudit = async (ncData) => {
    const localId = `local-nc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const localNc = {
      id: localId, ...ncData, status: 'open',
      correctiveActions: ncData.correctiveAction
        ? [{ id:`act-${Date.now()}`, description:ncData.correctiveAction, responsible:ncData.responsible||null, deadline:ncData.deadline||null, status:'pending' }]
        : [],
    };
    setNcs(p => [...p, localNc]);
    const dto = {
      title: ncData.title||'', description: ncData.description||'', controlId: ncData.controlId||'',
      actor: ncData.actor||null, correctiveAction: ncData.correctiveAction||null,
      responsible: ncData.responsible||null, deadline: ncData.deadline||null,
      status: 'open', auditName: ncData.auditName||null, auditId: ncData.auditId||null,
      correctiveActions: ncData.correctiveAction
        ? [{ description:ncData.correctiveAction, responsible:ncData.responsible||null, deadline:ncData.deadline||null, status:'pending' }]
        : [],
    };
    try {
      const saved = await createNC(dto);
      setNcs(p => p.map(n => n.id === localId ? saved : n));
    } catch {
      showToast('Erreur lors de la création de la NC', 'error');
      setNcs(p => p.filter(n => n.id !== localId));
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder aux audits.</p>
        </div>
      </div>
    );
  }

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-200"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>
        <p className="font-semibold text-gray-700">Chargement…</p>
        <p className="text-sm text-gray-400 mt-1">ISO 27001:2022 · SMSI</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50" style={{fontFamily:"'Inter','DM Sans',system-ui,sans-serif"}}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 36px 60px', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.8px' }}>
                Audit ISO 27001:2022
              </h1>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                4 thèmes · {TOTAL_CONTROLS} contrôles · SMSI
              </p>
            </div>
            <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all" title="Rafraîchir">
              <RefreshCw className="w-4 h-4 text-gray-400"/>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {[
              { label: 'Audits planifiés', value: stats.total,     sub: `${stats.completed} terminés`,                   highlight: true },
              { label: 'Planifiés',        value: stats.planned,   sub: 'À venir' },
              { label: 'En cours',         value: stats.inProg,    sub: stats.inProg > 0 ? 'Actifs' : 'Aucun' },
              { label: 'Terminés',         value: stats.completed, sub: 'Archivés' },
              { label: 'NC Ouvertes',      value: stats.openNCs,   sub: stats.openNCs > 0 ? 'Action requise' : 'RAS' },
              { label: 'Simulations',      value: stats.sims,      sub: 'Historique' },
            ].map((k, i) => (
              <div key={i} style={{
                background: k.highlight ? 'linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%)' : '#fff',
                borderRadius: 14, padding: '18px 20px',
                boxShadow: k.highlight ? '0 8px 24px rgba(29,78,216,.35)' : '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)',
                animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 60}ms both`,
              }}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: k.highlight ? '#fff' : '#111827', fontFamily: "'Sora','Inter',sans-serif", letterSpacing: '-1.5px' }}>{k.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: k.highlight ? 'rgba(255,255,255,.9)' : '#374151' }}>{k.label}</div>
                <div style={{ fontSize: 11, marginTop: 2, color: k.highlight ? 'rgba(255,255,255,.6)' : '#9CA3AF' }}>{k.sub}</div>
                {k.highlight && (
                  <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`, background: 'rgba(255,255,255,.8)', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.4,0,.2,1) .3s' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <ActionBar active={module} onChange={setModule}/>

          {module==='plan'     && <PlanModule audits={audits} saving={saving} onSave={handleSavePlan} onDelete={handleDeletePlan} canWrite={canWrite(moduleCode)} canEdit={canEdit(moduleCode)} canDelete={canDelete(moduleCode)}/>}
          {module==='simulate' && <SimulateModule simHistory={simHistory} onSaveSimulation={handleSaveSimulation} canWrite={canWrite(moduleCode)}/>}
          {module==='post'     && <PostAuditModule onToast={showToast} onNCCreated={handleNCFromPostAudit} allAudits={audits} canWrite={canWrite(moduleCode)}/>}
          {module==='nc'       && <NCModule ncs={ncs} saving={saving} onAdd={handleAddNC} onUpdate={handleUpdateNC} onDelete={handleDeleteNC} allAudits={audits} canWrite={canWrite(moduleCode)} canEdit={canEdit(moduleCode)} canDelete={canDelete(moduleCode)}/>}
          {module==='gap'      && <GapSoAModule ncs={ncs} onToast={showToast} allAudits={audits} canExport={canExport(moduleCode)}/>}
        </div>
      </main>

      <style>{`
        body,html{margin:0;padding:0;width:100%;overflow-x:hidden}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#f9fafb;border-radius:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#d1d5db}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

export default Audits;