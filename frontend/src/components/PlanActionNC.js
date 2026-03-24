import React, { useState } from 'react';
import {
  AlertTriangle, Ban, ClipboardList, Zap, Search,
  Wrench, CheckCircle2, Lock, X, ChevronRight, ChevronLeft, Save
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   PLANS D'ACTION PERSONNALISÉS PAR CONTRÔLE
   Clé = code du contrôle (ex: "5.1", "8.7")
   Chaque plan contient les 6 étapes pré-remplies selon la nature du contrôle.
───────────────────────────────────────────────────────────────────────────── */
const PLANS_ACTION = {
  /* ── DOMAINE 5 : ORGANISATIONNEL ── */
  '5.1': {
    actionImmediate: "Suspendre toute diffusion de documentation non officialisée. Identifier les versions de politiques existantes.",
    causesRacines: "Absence de politique formelle de sécurité de l'information approuvée par la direction.",
    planCorrectif: "1. Rédiger la politique SMSI selon ISO 27001 §6.2\n2. Soumettre à validation de la direction\n3. Décliner en politiques thématiques (cloud, BYOD, télétravail)\n4. Publier sur l'intranet et intégrer dans le parcours d'onboarding",
    verification: "Preuve de signature de la direction. Accusés de réception de diffusion. Captures intranet.",
    responsable: "RSSI / DG",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '5.2': {
    actionImmediate: "Identifier les rôles existants ayant des responsabilités sécurité non formalisées.",
    causesRacines: "Manque de formalisation des rôles et responsabilités liés à la sécurité de l'information.",
    planCorrectif: "1. Désigner un RSSI ou responsable sécurité avec mandat écrit\n2. Mettre à jour les fiches de poste avec les responsabilités sécurité\n3. Créer une matrice RACI pour les actifs critiques\n4. Valider avec les RH et la direction",
    verification: "Organigramme sécurité signé. Fiches de poste mises à jour. Matrice RACI approuvée.",
    responsable: "DRH / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '5.9': {
    actionImmediate: "Lancer un inventaire d'urgence des actifs critiques (serveurs, bases de données, applications exposées).",
    causesRacines: "Absence d'inventaire formalisé et maintenu à jour des actifs informationnels.",
    planCorrectif: "1. Déployer un outil CMDB ou asset management (ex: Snipe-IT, Lansweeper)\n2. Classifier les actifs selon criticité et sensibilité\n3. Attribuer un propriétaire à chaque actif\n4. Réviser l'inventaire semestriellement",
    verification: "Export CMDB signé. Tableau de classification validé. Preuves de revues périodiques.",
    responsable: "DSI / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },
  '5.15': {
    actionImmediate: "Auditer immédiatement les comptes à privilèges. Révoquer les accès excessifs identifiés.",
    causesRacines: "Politique de contrôle d'accès insuffisante ou non appliquée. Absence de processus RBAC formalisé.",
    planCorrectif: "1. Définir et documenter la politique de contrôle d'accès (RBAC/ABAC)\n2. Déployer un IAM centralisé (Azure AD, Okta)\n3. Appliquer le principe du moindre privilège\n4. Planifier des campagnes de recertification trimestrielles",
    verification: "Rapport de revue des accès. Configuration IAM exportée. Preuves de recertification.",
    responsable: "DSI / Responsable IAM",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '5.17': {
    actionImmediate: "Forcer la réinitialisation des mots de passe pour tous les comptes à privilèges. Activer le MFA en urgence.",
    causesRacines: "Politique de gestion des informations d'authentification absente ou non respectée.",
    planCorrectif: "1. Définir et déployer la politique de mots de passe (12+ caractères, complexité)\n2. Déployer un gestionnaire de mots de passe d'entreprise (1Password, Bitwarden)\n3. Activer le MFA pour tous les accès (priorité : admin, VPN, email)\n4. Automatiser la rotation des secrets et clés API",
    verification: "Configuration de la politique de mots de passe exportée. Rapport de déploiement MFA. Screenshot gestionnaire de mots de passe.",
    responsable: "DSI / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split('T')[0]; })(),
  },
  '5.23': {
    actionImmediate: "Inventorier tous les services cloud utilisés (shadow IT inclus). Bloquer les accès non approuvés via CASB.",
    causesRacines: "Absence de politique cloud et de processus d'évaluation des services SaaS/IaaS/PaaS.",
    planCorrectif: "1. Rédiger et approuver la politique d'utilisation du cloud\n2. Évaluer chaque service cloud (questionnaire CAIQ/CSA STAR)\n3. Déployer un CASB (Zscaler, Netskope, MS Defender for Cloud Apps)\n4. Chiffrer les données sensibles avant tout stockage cloud",
    verification: "Politique cloud signée. Rapports d'évaluation fournisseurs. Tableau de bord CASB.",
    responsable: "RSSI / Architecte Cloud",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },
  '5.24': {
    actionImmediate: "Vérifier l'existence d'un plan de réponse aux incidents. Si absent, nommer un responsable de crise immédiatement.",
    causesRacines: "Absence de plan de réponse aux incidents documenté, testé et connu des équipes.",
    planCorrectif: "1. Rédiger le plan de réponse aux incidents (IRP) selon NIST SP 800-61\n2. Constituer l'équipe CSIRT avec rôles définis\n3. Définir les seuils de classification et procédures d'escalade\n4. Réaliser un exercice de simulation (tabletop) annuel",
    verification: "Document IRP signé par la direction. Composition CSIRT formalisée. Compte-rendu de simulation.",
    responsable: "RSSI / CSIRT",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '5.34': {
    actionImmediate: "Vérifier si un DPO est désigné. Contrôler l'existence d'un registre des traitements RGPD.",
    causesRacines: "Non-conformité RGPD : absence de registre des traitements, de DPO ou de mécanismes d'exercice des droits.",
    planCorrectif: "1. Désigner un DPO (interne ou externe) si obligatoire\n2. Constituer le registre des traitements (Art. 30 RGPD)\n3. Réaliser des AIPD pour les traitements à risque\n4. Implémenter les mécanismes d'exercice des droits (accès, effacement, portabilité)",
    verification: "Désignation DPO (CNIL). Registre des traitements à jour. Procédures de gestion des droits documentées.",
    responsable: "DPO / Juridique",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },

  /* ── DOMAINE 6 : PERSONNES ── */
  '6.3': {
    actionImmediate: "Identifier les collaborateurs n'ayant reçu aucune formation sécurité. Planifier une session de rattrapage urgente.",
    causesRacines: "Programme de sensibilisation sécurité absent, incomplet ou non adapté au secteur IT.",
    planCorrectif: "1. Concevoir un programme de sensibilisation annuel (e-learning, phishing simulé)\n2. Former les développeurs à l'OWASP Top 10 et au Secure Coding\n3. Certifier les équipes sécurité (CISSP, CEH, ISO 27001 LA)\n4. Mesurer l'efficacité via des quiz trimestriels",
    verification: "Plan de formation signé. Taux de complétion e-learning. Résultats des simulations de phishing.",
    responsable: "RSSI / DRH",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },
  '6.7': {
    actionImmediate: "Auditer les accès distants existants. Désactiver les connexions non sécurisées (RDP exposé, Telnet, FTP).",
    causesRacines: "Absence de politique de télétravail sécurisée. Manque de contrôles pour les accès distants.",
    planCorrectif: "1. Déployer un VPN ou une solution ZTNA (Zscaler Private Access, Cloudflare Access)\n2. Fournir des équipements chiffrés et managés aux télétravailleurs\n3. Activer le MFA pour tous les accès distants\n4. Documenter et diffuser la politique de télétravail",
    verification: "Configuration VPN/ZTNA exportée. Rapport de déploiement MDM. Politique signée et diffusée.",
    responsable: "DSI / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },

  /* ── DOMAINE 7 : PHYSIQUE ── */
  '7.14': {
    actionImmediate: "Suspendre immédiatement toute cession ou mise au rebut d'équipements en attente de vérification.",
    causesRacines: "Absence de procédure de sanitisation des supports de stockage avant mise au rebut ou réaffectation.",
    planCorrectif: "1. Définir la procédure de sanitisation (NIST 800-88, DoD 5220.22-M)\n2. Acquérir des outils d'effacement certifiés (DBAN, Blancco)\n3. Documenter et certifier chaque destruction d'équipement\n4. Former le personnel informatique à la procédure",
    verification: "Certificats de destruction. Rapport d'audit de procédure. Formation documentée.",
    responsable: "DSI / Responsable Infra",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split('T')[0]; })(),
  },

  /* ── DOMAINE 8 : TECHNOLOGIQUE ── */
  '8.1': {
    actionImmediate: "Déployer en urgence un EDR sur les postes non protégés identifiés. Isoler les postes compromis.",
    causesRacines: "Terminaux utilisateurs sans protection EDR, chiffrement de disque absent ou configuration non sécurisée.",
    planCorrectif: "1. Déployer un EDR (CrowdStrike, SentinelOne, Defender for Endpoint) sur tous les terminaux\n2. Activer le chiffrement intégral des disques (BitLocker, FileVault)\n3. Appliquer les benchmarks CIS pour la configuration\n4. Gérer les terminaux via MDM/UEM (Intune, Jamf)",
    verification: "Rapport de couverture EDR (100%). Rapport de chiffrement des disques. Conformité CIS Benchmark.",
    responsable: "DSI / Sécurité Endpoint",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '8.2': {
    actionImmediate: "Lister tous les comptes admin et privilégiés. Supprimer les droits admin locaux des postes standard immédiatement.",
    causesRacines: "Absence de solution PAM. Droits administrateur accordés sans contrôle ni traçabilité.",
    planCorrectif: "1. Déployer une solution PAM (CyberArk, BeyondTrust, Delinea)\n2. Supprimer les droits admin locaux de tous les utilisateurs standard\n3. Implémenter le Just-In-Time access pour les comptes admin\n4. Enregistrer et auditer toutes les sessions privilégiées",
    verification: "Console PAM opérationnelle. Rapport de droits avant/après. Enregistrements de sessions exportés.",
    responsable: "DSI / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '8.7': {
    actionImmediate: "Scanner immédiatement tous les systèmes exposés. Isoler les machines présentant des indicateurs de compromission.",
    causesRacines: "Protection anti-malware absente, obsolète ou mal configurée sur les terminaux et/ou serveurs.",
    planCorrectif: "1. Déployer un EDR nouvelle génération sur tous les terminaux et serveurs\n2. Activer la protection en temps réel et les analyses planifiées\n3. Mettre en place le filtrage email (anti-spam, anti-phishing, sandboxing)\n4. Bloquer l'exécution des macros Office non signées via GPO",
    verification: "Rapport de couverture EDR. Configuration email gateway. Rapport de blocage des macros.",
    responsable: "RSSI / SOC",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split('T')[0]; })(),
  },
  '8.8': {
    actionImmediate: "Lancer un scan de vulnérabilités complet sur les systèmes exposés à Internet. Patcher les vulnérabilités critiques (CVSS ≥9) sous 72h.",
    causesRacines: "Absence de programme de gestion des vulnérabilités ou SLA de correction non respectés.",
    planCorrectif: "1. Déployer un scanner de vulnérabilités en continu (Tenable, Qualys, OpenVAS)\n2. Définir les SLA : Critique ≤72h, Haute ≤7j, Moyenne ≤30j\n3. Mettre en place un Bug Bounty ou des pentests annuels\n4. Prioriser via CVSS + EPSS (exploitabilité réelle)",
    verification: "Rapport de scan initial. Tableau de suivi des remédiations. SLA de patch formalisé.",
    responsable: "DSI / RSSI / Équipe SecOps",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '8.12': {
    actionImmediate: "Identifier les canaux d'exfiltration non contrôlés (USB, email personnel, cloud non approuvé). Bloquer en urgence.",
    causesRacines: "Absence de solution DLP ou politiques DLP non configurées pour les données sensibles.",
    planCorrectif: "1. Déployer une solution DLP (Microsoft Purview, Symantec, Forcepoint)\n2. Définir les politiques DLP par classification de données\n3. Bloquer les transferts vers les services cloud non approuvés\n4. Analyser les alertes DLP et réduire les faux positifs",
    verification: "Rapport DLP de couverture. Politiques exportées. Dashboard d'alertes DLP.",
    responsable: "RSSI / Équipe Data",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },
  '8.13': {
    actionImmediate: "Vérifier que les sauvegardes des systèmes critiques existent et sont restaurables. Tester une restauration immédiatement.",
    causesRacines: "Absence de stratégie de sauvegarde ou sauvegardes non testées, non chiffrées ou non isolées.",
    planCorrectif: "1. Appliquer la règle 3-2-1 (3 copies, 2 supports différents, 1 hors site)\n2. Chiffrer toutes les sauvegardes (AES-256)\n3. Tester la restauration mensuellement et documenter les résultats\n4. Isoler les sauvegardes du réseau principal (air-gap anti-ransomware)",
    verification: "Rapport de test de restauration signé. Configuration de chiffrement. Architecture sauvegarde documentée.",
    responsable: "DSI / Responsable Infra",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split('T')[0]; })(),
  },
  '8.15': {
    actionImmediate: "Vérifier que les logs des systèmes critiques sont collectés et conservés. Activer la journalisation manquante.",
    causesRacines: "Journalisation insuffisante ou inexistante sur les systèmes critiques. Absence de centralisation SIEM.",
    planCorrectif: "1. Centraliser les logs dans un SIEM (Splunk, Microsoft Sentinel, Elastic)\n2. Définir les sources de logs obligatoires (AD, firewalls, serveurs, apps)\n3. Protéger les logs contre modification (WORM, stockage immuable)\n4. Conserver 12 mois minimum (90j en ligne + 9 mois archivés)",
    verification: "Configuration SIEM exportée. Liste des sources de logs actives. Politique de rétention approuvée.",
    responsable: "DSI / SOC / RSSI",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '8.24': {
    actionImmediate: "Auditer les certificats TLS expirés ou utilisant des algorithmes obsolètes (MD5, SHA1, TLS 1.0/1.1). Révoquer immédiatement.",
    causesRacines: "Politique cryptographique absente ou non appliquée. Utilisation d'algorithmes obsolètes ou de clés insuffisantes.",
    planCorrectif: "1. Définir la politique cryptographique (algorithmes approuvés, longueurs de clé minimales)\n2. Chiffrer les données au repos (AES-256) et en transit (TLS 1.2+ uniquement)\n3. Centraliser la gestion des certificats (PKI, Let's Encrypt automatisé)\n4. Bannir les algorithmes obsolètes (MD5, SHA1, DES, RC4, RSA<2048)",
    verification: "Politique cryptographique approuvée. Scan des certificats (ssllabs.com). Rapport d'audit des algorithmes.",
    responsable: "RSSI / Architecte Sécurité",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+2); return d.toISOString().split('T')[0]; })(),
  },
  '8.25': {
    actionImmediate: "Identifier les applications en production sans aucun test de sécurité. Planifier un audit de code urgent.",
    causesRacines: "Absence de cycle de développement sécurisé (SSDLC). Sécurité absente des pipelines CI/CD.",
    planCorrectif: "1. Adopter un framework SSDLC (OWASP SAMM, Microsoft SDL)\n2. Intégrer des outils SAST (SonarQube, Checkmarx) dans les pipelines CI/CD\n3. Former les développeurs à l'OWASP Top 10\n4. Réaliser des tests DAST et pentests avant chaque mise en production majeure",
    verification: "Pipeline CI/CD avec SAST intégré. Rapports de scan de code. Formation développeurs documentée.",
    responsable: "Lead Dev / RSSI / DevSecOps",
    delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
  },
};

/* Fallback si le contrôle n'a pas de plan spécifique */
const getDefaultPlan = (ctrl) => ({
  actionImmediate: `Mettre en place une mesure conservatoire immédiate pour limiter l'exposition liée au contrôle ${ctrl.code}.`,
  causesRacines: `Analyser les causes profondes de la non-conformité au contrôle ${ctrl.code} : ${ctrl.titre}.`,
  planCorrectif: `1. Définir les mesures correctives adaptées au contrôle ${ctrl.code}\n2. Allouer les ressources nécessaires\n3. Mettre en œuvre les actions correctives\n4. Vérifier l'efficacité des mesures`,
  verification: `Documenter les preuves de mise en conformité pour le contrôle ${ctrl.code}.`,
  responsable: "RSSI",
  delai: (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toISOString().split('T')[0]; })(),
});

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIGURATION DES ÉTAPES
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Identification',    icon: <Search size={14}/>,      color: '#4f46e5', desc: 'Nature et périmètre de la NC' },
  { id: 2, label: 'Action immédiate',  icon: <Zap size={14}/>,         color: '#dc2626', desc: 'Mesures conservatoires' },
  { id: 3, label: 'Causes racines',    icon: <Search size={14}/>,      color: '#d97706', desc: 'Analyse 5 pourquoi / Ishikawa' },
  { id: 4, label: 'Plan correctif',    icon: <Wrench size={14}/>,      color: '#2563eb', desc: 'Actions et responsables' },
  { id: 5, label: 'Vérification',      icon: <CheckCircle2 size={14}/>,color: '#059669', desc: 'Preuves de conformité' },
  { id: 6, label: 'Clôture',           icon: <Lock size={14}/>,        color: '#6b7280', desc: 'Validation et archivage' },
];

const T = {
  font: "'Sora', sans-serif",
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  shadow: '0 2px 8px rgba(0,0,0,0.06)',
};

/* ─────────────────────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL : PlanActionNC
   À utiliser dans EvaluationPanel quand isNC === true
   
   USAGE dans EvaluationPanel :
   {isNC && hasJustification && (
     <PlanActionNC ctrl={form} statut={form.statut} onChange={(planData) => setForm({...form, ...planData})} />
   )}
───────────────────────────────────────────────────────────────────────────── */
export function PlanActionNC({ ctrl, statut, onChange }) {
  const planDefaut = PLANS_ACTION[ctrl.code] || getDefaultPlan(ctrl);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [plan, setPlan] = useState({
    ncType:              statut === 'NCMajeure' ? 'majeure' : 'mineure',
    ncDescription:       ctrl.planAction || '',
    impact:              ctrl.impact || '',
    actionImmediate:     ctrl.actionImmediate || planDefaut.actionImmediate,
    delaiActionImm:      ctrl.delaiActionImm || '',
    responsableImm:      ctrl.responsableImm || '',
    causesRacines:       ctrl.causesRacines || planDefaut.causesRacines,
    methodeAnalyse:      ctrl.methodeAnalyse || '5-pourquoi',
    planCorrectif:       ctrl.planCorrectif || planDefaut.planCorrectif,
    responsable:         ctrl.responsable || planDefaut.responsable,
    dateEcheance:        ctrl.dateEcheance || planDefaut.delai,
    verification:        ctrl.verification || planDefaut.verification,
    indicateurs:         ctrl.indicateurs || '',
    dateVerification:    ctrl.dateVerification || '',
    commentaireCloture:  ctrl.commentaireCloture || '',
    cloturePar:          ctrl.cloturePar || '',
    dateCloture:         ctrl.dateCloture || '',
    statut:              ctrl.statutPlan || 'En cours',
  });

  const update = (key, val) => {
    const newPlan = { ...plan, [key]: val };
    setPlan(newPlan);
    if (onChange) onChange(newPlan);
  };

  const isNCMajeure = statut === 'NCMajeure';

  /* ── Rendu d'une étape ── */
  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FieldGroup label="Type de non-conformité">
            <div style={{ display:'flex', gap:10 }}>
              {['mineure','majeure'].map(t => (
                <button key={t} onClick={() => update('ncType', t)}
                  style={{ flex:1, padding:'10px 16px', borderRadius:10, border:`2px solid ${plan.ncType===t ? (t==='majeure'?'#dc2626':'#d97706') : T.gray200}`,
                    background: plan.ncType===t ? (t==='majeure'?'#fef2f2':'#fffbeb') : '#fff',
                    color: t==='majeure'?'#dc2626':'#d97706', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:T.font,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {t==='majeure' ? <Ban size={14}/> : <AlertTriangle size={14}/>}
                  NC {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="Description de la non-conformité" required>
            <textarea rows={3} style={inputStyle} placeholder="Décrire précisément la non-conformité observée..."
              value={plan.ncDescription} onChange={e => update('ncDescription', e.target.value)}/>
          </FieldGroup>
          <FieldGroup label="Impact sur l'organisation">
            <textarea rows={2} style={inputStyle} placeholder="Évaluer l'impact métier, opérationnel et réglementaire..."
              value={plan.impact} onChange={e => update('impact', e.target.value)}/>
          </FieldGroup>
          <InfoBox color="#fef2f2" border="#fecaca" text={`Contrôle concerné : ${ctrl.code} – ${ctrl.titre}`}
            icon={<ClipboardList size={14} color="#dc2626"/>} iconColor="#dc2626"/>
        </div>
      );

      case 2: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <InfoBox color="#fff7ed" border="#fed7aa" iconColor="#ea580c" icon={<Zap size={14} color="#ea580c"/>}
            text="Les actions immédiates doivent être prises dans les 24-72h pour limiter l'exposition."/>
          <FieldGroup label="Action immédiate à mettre en place" required>
            <textarea rows={4} style={inputStyle}
              value={plan.actionImmediate} onChange={e => update('actionImmediate', e.target.value)}/>
          </FieldGroup>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FieldGroup label="Responsable de l'action immédiate">
              <input style={inputStyle} placeholder="Nom / rôle" value={plan.responsableImm} onChange={e => update('responsableImm', e.target.value)}/>
            </FieldGroup>
            <FieldGroup label="Délai de réalisation">
              <input type="date" style={inputStyle} value={plan.delaiActionImm} onChange={e => update('delaiActionImm', e.target.value)}/>
            </FieldGroup>
          </div>
        </div>
      );

      case 3: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FieldGroup label="Méthode d'analyse">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['5-pourquoi','Ishikawa','AMDEC','Analyse ad-hoc'].map(m => (
                <button key={m} onClick={() => update('methodeAnalyse', m)}
                  style={{ padding:'7px 14px', borderRadius:8, border:`2px solid ${plan.methodeAnalyse===m?'#d97706':T.gray200}`,
                    background: plan.methodeAnalyse===m?'#fffbeb':'#fff', color: plan.methodeAnalyse===m?'#d97706':T.gray700,
                    fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:T.font }}>
                  {m}
                </button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="Causes racines identifiées" required>
            <textarea rows={5} style={inputStyle} placeholder="Documenter les causes profondes identifiées..."
              value={plan.causesRacines} onChange={e => update('causesRacines', e.target.value)}/>
          </FieldGroup>
        </div>
      );

      case 4: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FieldGroup label="Actions correctives détaillées" required>
            <textarea rows={6} style={inputStyle} placeholder="1. Action 1&#10;2. Action 2&#10;3. Action 3..."
              value={plan.planCorrectif} onChange={e => update('planCorrectif', e.target.value)}/>
          </FieldGroup>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FieldGroup label="Responsable principal">
              <input style={inputStyle} placeholder="Nom / rôle / équipe" value={plan.responsable} onChange={e => update('responsable', e.target.value)}/>
            </FieldGroup>
            <FieldGroup label="Date d'échéance cible">
              <input type="date" style={inputStyle} value={plan.dateEcheance} onChange={e => update('dateEcheance', e.target.value)}/>
            </FieldGroup>
          </div>
          <FieldGroup label="Statut d'avancement">
            <div style={{ display:'flex', gap:8 }}>
              {['En cours','En attente','Terminé','Annulé'].map(s => (
                <button key={s} onClick={() => update('statut', s)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:8,
                    border:`2px solid ${plan.statut===s?'#2563eb':T.gray200}`,
                    background: plan.statut===s?'#eff6ff':'#fff', color: plan.statut===s?'#2563eb':T.gray500,
                    fontWeight:600, fontSize:11, cursor:'pointer', fontFamily:T.font }}>
                  {s}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      );

      case 5: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <InfoBox color="#f0fdf4" border="#bbf7d0" iconColor="#059669" icon={<CheckCircle2 size={14} color="#059669"/>}
            text="Les preuves doivent démontrer concrètement que les actions correctives ont été mises en œuvre."/>
          <FieldGroup label="Preuves et critères de vérification" required>
            <textarea rows={4} style={inputStyle} placeholder="Ex: Rapport de scan, captures d'écran de configuration, attestation signée..."
              value={plan.verification} onChange={e => update('verification', e.target.value)}/>
          </FieldGroup>
          <FieldGroup label="Indicateurs de mesure de l'efficacité">
            <textarea rows={2} style={inputStyle} placeholder="KPIs, métriques, taux de conformité cible..."
              value={plan.indicateurs} onChange={e => update('indicateurs', e.target.value)}/>
          </FieldGroup>
          <FieldGroup label="Date de vérification prévue">
            <input type="date" style={inputStyle} value={plan.dateVerification} onChange={e => update('dateVerification', e.target.value)}/>
          </FieldGroup>
        </div>
      );

      case 6: return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <InfoBox color="#f8fafc" border="#e2e8f0" iconColor="#6b7280" icon={<Lock size={14} color="#6b7280"/>}
            text="La clôture ne peut être prononcée qu'après vérification des preuves de conformité."/>
          <FieldGroup label="Commentaire de clôture">
            <textarea rows={3} style={inputStyle} placeholder="Résumer les actions réalisées et confirmer la levée de la NC..."
              value={plan.commentaireCloture} onChange={e => update('commentaireCloture', e.target.value)}/>
          </FieldGroup>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FieldGroup label="Clôturé par">
              <input style={inputStyle} placeholder="Nom / rôle de l'auditeur" value={plan.cloturePar} onChange={e => update('cloturePar', e.target.value)}/>
            </FieldGroup>
            <FieldGroup label="Date de clôture">
              <input type="date" style={inputStyle} value={plan.dateCloture} onChange={e => update('dateCloture', e.target.value)}/>
            </FieldGroup>
          </div>
          {/* Résumé du plan */}
          <div style={{ marginTop:8, padding:16, background:'#f8fafc', borderRadius:12, border:`1px solid ${T.gray200}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.gray700, marginBottom:10 }}>Récapitulatif du plan d'action</div>
            {[
              { label:'Contrôle', val:`${ctrl.code} – ${ctrl.titre}` },
              { label:'Responsable', val: plan.responsable },
              { label:'Échéance', val: plan.dateEcheance },
              { label:'Statut', val: plan.statut },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0', borderBottom:`0.5px solid ${T.gray200}` }}>
                <span style={{ color:T.gray500 }}>{r.label}</span>
                <span style={{ fontWeight:600, color:T.gray900 }}>{r.val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <section style={{ animation:'fadeIn 0.3s', padding:20, background:'#fff2f2', borderRadius:16, border:'1.5px solid #fecaca' }}>
      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', gap:8, color:'#dc2626', fontWeight:800, fontSize:13, marginBottom:20 }}>
        {isNCMajeure ? <Ban size={18}/> : <AlertTriangle size={18}/>}
        PLAN D'ACTION — {isNCMajeure ? 'NC MAJEURE' : 'NC MINEURE'}
        <span style={{ marginLeft:'auto', fontSize:11, background:isNCMajeure?'#fecaca':'#fde68a', color:isNCMajeure?'#991b1b':'#92400e', padding:'2px 10px', borderRadius:99 }}>
          {ctrl.code}
        </span>
      </div>

      {/* Stepper horizontal */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button onClick={() => setCurrentStep(step.id)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'none', border:'none',
                cursor:'pointer', padding:'4px 6px', minWidth:64, fontFamily:T.font }}>
              <div style={{ width:30, height:30, borderRadius:'50%',
                background: currentStep===step.id ? step.color : currentStep>step.id ? '#10b981' : '#e5e7eb',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s',
                border: currentStep===step.id ? `2px solid ${step.color}` : '2px solid transparent' }}>
                {currentStep > step.id
                  ? <CheckCircle2 size={14} color="#fff"/>
                  : <span style={{ color: currentStep===step.id ? '#fff' : '#9ca3af', fontSize:11, fontWeight:700 }}>{step.id}</span>}
              </div>
              <span style={{ fontSize:10, fontWeight:currentStep===step.id?700:400,
                color: currentStep===step.id ? step.color : currentStep>step.id ? '#10b981' : T.gray500,
                textAlign:'center', lineHeight:1.2, maxWidth:56 }}>
                {step.label}
              </span>
            </button>
            {idx < STEPS.length-1 && (
              <div style={{ flex:1, height:2, background: currentStep>step.id?'#10b981':T.gray200, minWidth:8, transition:'background 0.3s' }}/>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Titre de l'étape courante */}
      <div style={{ marginBottom:16, padding:'10px 14px', background:'#fff', borderRadius:10, border:`1px solid ${T.gray200}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', background:STEPS[currentStep-1].color,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            {React.cloneElement(STEPS[currentStep-1].icon, { size:12, color:'#fff' })}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.gray900 }}>
              Étape {currentStep} — {STEPS[currentStep-1].label}
            </div>
            <div style={{ fontSize:11, color:T.gray500 }}>{STEPS[currentStep-1].desc}</div>
          </div>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div style={{ minHeight:220 }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button onClick={() => setCurrentStep(s => Math.max(1, s-1))} disabled={currentStep===1}
          style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${T.gray200}`,
            background:'#fff', color:T.gray700, fontWeight:600, fontSize:13,
            cursor:currentStep===1?'not-allowed':'pointer', opacity:currentStep===1?0.4:1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:T.font }}>
          <ChevronLeft size={16}/> Précédent
        </button>
        {currentStep < 6
          ? <button onClick={() => setCurrentStep(s => Math.min(6, s+1))}
              style={{ flex:2, padding:'11px', borderRadius:10, border:'none',
                background:`linear-gradient(135deg, ${STEPS[currentStep-1].color}, ${STEPS[currentStep].color})`,
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:T.font }}>
              Étape suivante <ChevronRight size={16}/>
            </button>
          : <button onClick={() => onChange && onChange({ ...plan, completed: true })}
              style={{ flex:2, padding:'11px', borderRadius:10, border:'none',
                background:'linear-gradient(135deg, #059669, #10b981)',
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:T.font }}>
              <Save size={16}/> Valider le plan d'action
            </button>}
      </div>
    </section>
  );
}

/* ─── Composants internes utilitaires ─── */
const FieldGroup = ({ label, children, required }) => (
  <div>
    <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>
      {label}{required && <span style={{ color:'#dc2626', marginLeft:4 }}>*</span>}
    </label>
    {children}
  </div>
);

const InfoBox = ({ color, border, icon, iconColor, text }) => (
  <div style={{ padding:'10px 14px', background:color, borderRadius:10, border:`1px solid ${border}`,
    display:'flex', alignItems:'flex-start', gap:8 }}>
    <span style={{ marginTop:1 }}>{icon}</span>
    <span style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{text}</span>
  </div>
);

const inputStyle = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  border:`1px solid #e5e7eb`, fontSize:13, outline:'none',
  fontFamily:"'Sora', sans-serif", boxSizing:'border-box',
  background:'#fff', color:'#111827', resize:'vertical',
};

export default PlanActionNC;