import React, { useState } from 'react';
import { 
  X, CheckCircle2, Lightbulb, ClipboardList, 
  Save 
} from 'lucide-react';

// Configuration complÃƒÂ¨te pour TOUS les contrÃƒÂ´les avec 5 recommandations chacun
const PLAN_CONFIGS = {
  // ==================== DOMAINE ORGANISATIONNEL (A.5.1 ÃƒÂ  A.5.37) ====================
  'A.5.1': {
    recommendations: [
      "RÃƒÂ©diger une politique de sÃƒÂ©curitÃƒÂ© de l'information formelle et complÃƒÂ¨te",
      "Faire approuver formellement la politique par la Direction GÃƒÂ©nÃƒÂ©rale (DG)",
      "Diffuser la politique ÃƒÂ  l'ensemble du personnel via l'intranet et email",
      "Inclure la signature de la politique dans le processus d'onboarding RH",
      "Planifier une rÃƒÂ©vision annuelle et tracer les versions dans un registre"
    ],
    defaultSteps: [
      { title: "RÃƒÂ©daction", desc: "Ãƒâ€°laborer la version complÃƒÂ¨te de la politique", completed: false },
      { title: "Validation lÃƒÂ©gale", desc: "VÃƒÂ©rifier la conformitÃƒÂ© avec les obligations lÃƒÂ©gales", completed: false },
      { title: "Approbation DG", desc: "Signature officielle par la direction", completed: false },
      { title: "Diffusion", desc: "Publier sur l'intranet et communiquer par email", completed: false },
      { title: "Formation", desc: "Former tous les employÃƒÂ©s sur la politique", completed: false }
    ]
  },
  'A.5.2': {
    recommendations: [
      "CrÃƒÂ©er une matrice RACI dÃƒÂ©taillÃƒÂ©e pour tous les rÃƒÂ´les sÃƒÂ©curitÃƒÂ©",
      "Nommer officiellement un RSSI (Responsable SÃƒÂ©curitÃƒÂ© des SystÃƒÂ¨mes d'Information)",
      "DÃƒÂ©finir les responsabilitÃƒÂ©s sÃƒÂ©curitÃƒÂ© dans chaque fiche de poste",
      "Ãƒâ€°tablir une chaÃƒÂ®ne de remplacement pour les absences critiques",
      "Communiquer les rÃƒÂ´les et responsabilitÃƒÂ©s lors des revues annuelles"
    ],
    defaultSteps: [
      { title: "Inventaire des rÃƒÂ´les", desc: "Lister toutes les fonctions sensibles", completed: false },
      { title: "RÃƒÂ©daction matrice", desc: "CrÃƒÂ©er la matrice RACI sÃƒÂ©curitÃƒÂ©", completed: false },
      { title: "Validation RH", desc: "IntÃƒÂ©grer dans les fiches de poste", completed: false },
      { title: "Communication", desc: "PrÃƒÂ©senter en rÃƒÂ©union gÃƒÂ©nÃƒÂ©rale", completed: false }
    ]
  },
  'A.5.3': {
    recommendations: [
      "Identifier toutes les taches conflictuelles (developpement/production, admin/utilisateur)",
      "Mettre en place des controles de supervision pour les taches critiques",
      "Implementer le principe du '4 yeux' pour les operations sensibles",
      "Separer les comptes d'administration des comptes utilisateurs",
      "Auditer annuellement la separation des taches effective"
    ],
    defaultSteps: [
      { title: "Analyse des conflits", desc: "Identifier les zones de conflit d'interets", completed: false },
      { title: "Redefinition", desc: "Modifier l'organisation des taches", completed: false },
      { title: "Controles techniques", desc: "Mettre en place les separations dans les systemes", completed: false },
      { title: "Audit", desc: "Verifier l'efficacite des separations", completed: false }
    ]
  },
  'A.5.4': {
    recommendations: [
      "Former les managers ÃƒÂ  leurs responsabilitÃƒÂ©s sÃƒÂ©curitÃƒÂ©",
      "Inclure des objectifs sÃƒÂ©curitÃƒÂ© dans les OKR des managers",
      "Organiser des comitÃƒÂ©s de direction sÃƒÂ©curitÃƒÂ© trimestriels",
      "Mettre en place un reporting sÃƒÂ©curitÃƒÂ© mensuel pour la direction",
      "Sanctionner le non-respect des politiques par les ÃƒÂ©quipes"
    ],
    defaultSteps: [
      { title: "Sensibilisation", desc: "Former les managers ÃƒÂ  la sÃƒÂ©curitÃƒÂ©", completed: false },
      { title: "Objectifs", desc: "DÃƒÂ©finir des KPI sÃƒÂ©curitÃƒÂ© pour chaque manager", completed: false },
      { title: "Reporting", desc: "Mettre en place les tableaux de bord", completed: false },
      { title: "Suivi", desc: "Revue trimestrielle des rÃƒÂ©sultats", completed: false }
    ]
  },
  'A.5.5': {
    recommendations: [
      "Ãƒâ€°tablir une liste des autoritÃƒÂ©s compÃƒÂ©tentes (CNIL, ANSSI, police, etc.)",
      "DÃƒÂ©signer un correspondant officiel pour les contacts avec les autoritÃƒÂ©s",
      "Documenter les procÃƒÂ©dures de signalement d'incidents aux autoritÃƒÂ©s",
      "Maintenir ÃƒÂ  jour les coordonnÃƒÂ©es et les obligations de signalement",
      "Organiser une rÃƒÂ©union annuelle avec les autoritÃƒÂ©s locales"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les autoritÃƒÂ©s pertinentes", completed: false },
      { title: "Nomination", desc: "DÃƒÂ©signer le correspondant autoritÃƒÂ©s", completed: false },
      { title: "ProcÃƒÂ©dure", desc: "RÃƒÂ©diger les procÃƒÂ©dures de contact", completed: false },
      { title: "Test", desc: "Simuler un signalement d'incident", completed: false }
    ]
  },
  'A.5.6': {
    recommendations: [
      "Identifier les groupes d'intÃƒÂ©rÃƒÂªt spÃƒÂ©ciaux (Clusir, FIRST, etc.)",
      "AdhÃƒÂ©rer ÃƒÂ  au moins un forum professionnel sÃƒÂ©curitÃƒÂ©",
      "DÃƒÂ©signer des reprÃƒÂ©sentants pour participer aux rÃƒÂ©unions",
      "Diffuser les bonnes pratiques issues des groupes ÃƒÂ  l'organisation",
      "Participer activement aux groupes de travail sectoriels"
    ],
    defaultSteps: [
      { title: "Recherche", desc: "Identifier les groupes pertinents", completed: false },
      { title: "AdhÃƒÂ©sion", desc: "Soumettre les demandes d'adhÃƒÂ©sion", completed: false },
      { title: "Participation", desc: "Assister aux premiÃƒÂ¨res rÃƒÂ©unions", completed: false },
      { title: "Retour", desc: "SynthÃƒÂ©tiser et diffuser les informations", completed: false }
    ]
  },
  'A.5.7': {
    recommendations: [
      "Mettre en place une veille sur les menaces (flux RSS, CERT, newsletters)",
      "Abonner ÃƒÂ  des services de renseignement sur les menaces (ISAC)",
      "Analyser mensuellement les menaces pertinentes pour l'activitÃƒÂ©",
      "Partager les renseignements avec les ÃƒÂ©quipes concernÃƒÂ©es",
      "Ãƒâ€°tablir un tableau de bord des menaces actives"
    ],
    defaultSteps: [
      { title: "Sources", desc: "Identifier les sources de renseignement", completed: false },
      { title: "Abonnements", desc: "S'abonner aux services", completed: false },
      { title: "Processus", desc: "DÃƒÂ©finir le cycle d'analyse", completed: false },
      { title: "Dashboard", desc: "CrÃƒÂ©er le tableau de bord", completed: false }
    ]
  },
  'A.5.8': {
    recommendations: [
      "IntÃƒÂ©grer un rÃƒÂ©fÃƒÂ©rent sÃƒÂ©curitÃƒÂ© dans chaque projet",
      "RÃƒÂ©aliser une analyse des risques sÃƒÂ©curitÃƒÂ© en phase d'initiation",
      "Inclure des critÃƒÂ¨res sÃƒÂ©curitÃƒÂ© dans les livrables de projet",
      "Planifier des revues sÃƒÂ©curitÃƒÂ© aux jalons clÃƒÂ©s du projet",
      "BudgÃƒÂ©ter les actions sÃƒÂ©curitÃƒÂ© dÃƒÂ¨s le lancement du projet"
    ],
    defaultSteps: [
      { title: "Template", desc: "CrÃƒÂ©er un modÃƒÂ¨le d'analyse sÃƒÂ©curitÃƒÂ© projet", completed: false },
      { title: "Formation", desc: "Former les chefs de projet", completed: false },
      { title: "Processus", desc: "IntÃƒÂ©grer dans la mÃƒÂ©thodologie projet", completed: false },
      { title: "Pilote", desc: "Tester sur un projet existant", completed: false }
    ]
  },
  'A.5.9': {
    recommendations: [
      "DÃƒÂ©ployer un outil CMDB pour l'inventaire automatisÃƒÂ©",
      "Nommer un propriÃƒÂ©taire pour chaque actif inventoriÃƒÂ©",
      "Scanner le rÃƒÂ©seau mensuellement pour dÃƒÂ©tecter les actifs non rÃƒÂ©fÃƒÂ©rencÃƒÂ©s",
      "Inclure les actifs cloud et SaaS dans l'inventaire",
      "Lier l'inventaire au processus d'onboarding/offboarding"
    ],
    defaultSteps: [
      { title: "Outil", desc: "SÃƒÂ©lectionner et dÃƒÂ©ployer un CMDB", completed: false },
      { title: "DÃƒÂ©couverte", desc: "Scanner l'existant", completed: false },
      { title: "Attribution", desc: "Nommer les propriÃƒÂ©taires", completed: false },
      { title: "Maintenance", desc: "Mettre en place la mise ÃƒÂ  jour continue", completed: false }
    ]
  },
  'A.5.10': {
    recommendations: [
      "RÃƒÂ©diger une charte d'utilisation acceptable des moyens informatiques",
      "Faire signer la charte par tous les employÃƒÂ©s annuellement",
      "Interdire explicitement les usages personnels abusifs",
      "Former les utilisateurs sur les rÃƒÂ¨gles d'utilisation",
      "Mettre en place des contrÃƒÂ´les techniques (filtrage web, DLP)"
    ],
    defaultSteps: [
      { title: "RÃƒÂ©daction", desc: "Ãƒâ€°crire la charte d'utilisation", completed: false },
      { title: "Validation", desc: "Faire valider par le juridique", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "ContrÃƒÂ´les", desc: "Mettre en place les filtrages", completed: false }
    ]
  },
  'A.5.11': {
    recommendations: [
      "Formaliser une procÃƒÂ©dure de retour d'actifs dans le manuel RH",
      "CrÃƒÂ©er une checklist de dÃƒÂ©part ÃƒÂ  remplir par le manager",
      "Verrouiller les comptes le jour du dÃƒÂ©part",
      "Utiliser un systÃƒÂ¨me de gestion des actifs pour tracer les retours",
      "PrÃƒÂ©voir des pÃƒÂ©nalitÃƒÂ©s pour non-retour dans les contrats"
    ],
    defaultSteps: [
      { title: "ProcÃƒÂ©dure", desc: "RÃƒÂ©diger la procÃƒÂ©dure de retour", completed: false },
      { title: "Checklist", desc: "CrÃƒÂ©er la checklist dÃƒÂ©part", completed: false },
      { title: "Formation", desc: "Former les managers", completed: false },
      { title: "Audit", desc: "VÃƒÂ©rifier l'application sur les derniers dÃƒÂ©parts", completed: false }
    ]
  },
  'A.5.12': {
    recommendations: [
      "DÃƒÂ©finir un schÃƒÂ©ma de classification ÃƒÂ  3 ou 4 niveaux (Public, Interne, Confidentiel, Secret)",
      "Nommer des responsables de classification par dÃƒÂ©partement",
      "Documenter les critÃƒÂ¨res de classification pour chaque niveau",
      "Former tous les employÃƒÂ©s ÃƒÂ  la classification",
      "RÃƒÂ©viser la classification annuellement"
    ],
    defaultSteps: [
      { title: "SchÃƒÂ©ma", desc: "DÃƒÂ©finir les niveaux et critÃƒÂ¨res", completed: false },
      { title: "Validation", desc: "Valider avec la direction", completed: false },
      { title: "Formation", desc: "Former tous les employÃƒÂ©s", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Classifier les actifs existants", completed: false }
    ]
  },
  'A.5.13': {
    recommendations: [
      "DÃƒÂ©finir des rÃƒÂ¨gles d'ÃƒÂ©tiquetage pour chaque niveau de classification",
      "Utiliser des mÃƒÂ©tadonnÃƒÂ©es dans les fichiers Office pour l'ÃƒÂ©tiquetage",
      "Apposer des mentions de confidentialitÃƒÂ© sur les documents papier",
      "Automatiser l'ÃƒÂ©tiquetage via des solutions DLP",
      "VÃƒÂ©rifier la cohÃƒÂ©rence de l'ÃƒÂ©tiquetage lors des audits"
    ],
    defaultSteps: [
      { title: "RÃƒÂ¨gles", desc: "DÃƒÂ©finir les rÃƒÂ¨gles d'ÃƒÂ©tiquetage", completed: false },
      { title: "Outil", desc: "SÃƒÂ©lectionner une solution d'ÃƒÂ©tiquetage", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Configurer l'ÃƒÂ©tiquetage automatique", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Auditer la conformitÃƒÂ©", completed: false }
    ]
  },
  'A.5.14': {
    recommendations: [
      "Chiffrer systÃƒÂ©matiquement les emails contenant des donnÃƒÂ©es sensibles",
      "Utiliser un outil de transfert sÃƒÂ©curisÃƒÂ© (SFTP, Kiteworks)",
      "Signer des accords de confidentialitÃƒÂ© avec les partenaires",
      "Interdire le transfert de donnÃƒÂ©es sensibles via clÃƒÂ©s USB",
      "Journaliser tous les transferts de donnÃƒÂ©es externes"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier tous les flux de transfert", completed: false },
      { title: "SÃƒÂ©curisation", desc: "Mettre en place les solutions de transfert sÃƒÂ©curisÃƒÂ©", completed: false },
      { title: "Accords", desc: "Faire signer les NDA", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Mettre en place la journalisation", completed: false }
    ]
  },
  'A.5.15': {
    recommendations: [
      "Appliquer strictement le principe du moindre privilÃƒÂ¨ge (Need-to-know)",
      "RÃƒÂ©viser les droits d'accÃƒÂ¨s de tous les utilisateurs chaque trimestre",
      "DÃƒÂ©sactiver systÃƒÂ©matiquement les comptes des sortants le jour J",
      "GÃƒÂ©nÃƒÂ©raliser l'authentification multi-facteurs (MFA) pour tous les accÃƒÂ¨s",
      "Tenir un registre d'inventaire ÃƒÂ  jour de tous les privilÃƒÂ¨ges admin"
    ],
    defaultSteps: [
      { title: "Audit initial", desc: "Lister tous les accÃƒÂ¨s actifs", completed: false },
      { title: "Nettoyage", desc: "Supprimer les comptes inutilisÃƒÂ©s", completed: false },
      { title: "MFA", desc: "DÃƒÂ©ployer l'authentification multi-facteurs", completed: false },
      { title: "Revue pÃƒÂ©riodique", desc: "Mettre en place la rÃƒÂ©vision trimestrielle", completed: false }
    ]
  },
  'A.5.16': {
    recommendations: [
      "Centraliser la gestion des identitÃƒÂ©s dans un annuaire (AD, LDAP)",
      "Automatiser la crÃƒÂ©ation/suppression des comptes via le SIRH",
      "ImplÃƒÂ©menter un processus de revue des identitÃƒÂ©s dormantes",
      "Lier l'identitÃƒÂ© numÃƒÂ©rique ÃƒÂ  l'identitÃƒÂ© rÃƒÂ©elle (carte de visite)",
      "Mettre en place un SSO pour simplifier la gestion"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Inventorier toutes les identitÃƒÂ©s", completed: false },
      { title: "Centralisation", desc: "Choisir un annuaire central", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "SSO", desc: "DÃƒÂ©ployer l'authentification unique", completed: false }
    ]
  },
  'A.5.17': {
    recommendations: [
      "Imposer des mots de passe robustes (12+ caractÃƒÂ¨res, complexitÃƒÂ©)",
      "Activer la politique d'expiration des mots de passe (90 jours max)",
      "Proscrire la rÃƒÂ©utilisation des 5 derniers mots de passe",
      "DÃƒÂ©ployer un gestionnaire d'entreprise pour les comptes partagÃƒÂ©s",
      "Verrouiller le compte aprÃƒÂ¨s 5 ÃƒÂ©checs consÃƒÂ©cutifs"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir la politique MDP", completed: false },
      { title: "Configuration", desc: "Configurer l'AD/GPO", completed: false },
      { title: "Formation", desc: "Former les utilisateurs", completed: false },
      { title: "ContrÃƒÂ´le", desc: "VÃƒÂ©rifier la conformitÃƒÂ©", completed: false }
    ]
  },
  'A.5.18': {
    recommendations: [
      "Automatiser la rÃƒÂ©vocation des droits lors des dÃƒÂ©parts",
      "Mettre en place un workflow d'approbation pour les accÃƒÂ¨s privilÃƒÂ©giÃƒÂ©s",
      "RÃƒÂ©aliser une revue des droits d'accÃƒÂ¨s semestrielle",
      "Utiliser des groupes AD pour gÃƒÂ©rer les droits par profil",
      "Journaliser toutes les attributions de droits"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃƒÂ©finir le workflow d'approbation", completed: false },
      { title: "Groupes", desc: "Structurer les groupes d'accÃƒÂ¨s", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "Revue", desc: "Planifier la revue semestrielle", completed: false }
    ]
  },
  'A.5.19': {
    recommendations: [
      "Ãƒâ€°valuer la sÃƒÂ©curitÃƒÂ© des fournisseurs avant signature",
      "Inclure des clauses sÃƒÂ©curitÃƒÂ© dans tous les contrats fournisseurs",
      "Classer les fournisseurs par niveau de criticitÃƒÂ©",
      "RÃƒÂ©aliser des audits fournisseurs annuels pour les plus critiques",
      "Maintenir une base de donnÃƒÂ©es des ÃƒÂ©valuations fournisseurs"
    ],
    defaultSteps: [
      { title: "CritÃƒÂ¨res", desc: "DÃƒÂ©finir les critÃƒÂ¨res d'ÃƒÂ©valuation", completed: false },
      { title: "Questionnaire", desc: "CrÃƒÂ©er un questionnaire sÃƒÂ©curitÃƒÂ©", completed: false },
      { title: "Base", desc: "CrÃƒÂ©er la base fournisseurs", completed: false },
      { title: "Audits", desc: "Planifier les audits", completed: false }
    ]
  },
  'A.5.20': {
    recommendations: [
      "Faire signer une charte sÃƒÂ©curitÃƒÂ© aux prestataires externes",
      "Exiger la certification ISO 27001 des fournisseurs critiques",
      "DÃƒÂ©finir des pÃƒÂ©nalitÃƒÂ©s pour non-respect de la sÃƒÂ©curitÃƒÂ©",
      "Inclure un droit d'audit dans les contrats",
      "Limiter contractuellement la sous-traitance non autorisÃƒÂ©e"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Faire valider les clauses juridiquement", completed: false },
      { title: "Signature", desc: "Faire signer les accords existants", completed: false },
      { title: "Base", desc: "Centraliser les contrats", completed: false },
      { title: "Suivi", desc: "Mettre en place le suivi des ÃƒÂ©chÃƒÂ©ances", completed: false }
    ]
  },
  'A.5.21': {
    recommendations: [
      "Exiger des attestations de sÃƒÂ©curitÃƒÂ© des sous-traitants",
      "Limiter la profondeur de la chaÃƒÂ®ne de sous-traitance",
      "Auditer les fournisseurs de rang 2 pour les services critiques",
      "Documenter la chaÃƒÂ®ne d'approvisionnement complÃƒÂ¨te",
      "Mettre en place des clauses de cascade pour la sÃƒÂ©curitÃƒÂ©"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Mapper la chaÃƒÂ®ne d'approvisionnement", completed: false },
      { title: "Exigences", desc: "DÃƒÂ©finir les exigences pour chaque niveau", completed: false },
      { title: "Audits", desc: "Auditer les sous-traitants critiques", completed: false },
      { title: "Tableau", desc: "CrÃƒÂ©er un tableau de bord risques", completed: false }
    ]
  },
  'A.5.22': {
    recommendations: [
      "Mettre en place des revues de service trimestrielles",
      "Suivre les indicateurs de performance sÃƒÂ©curitÃƒÂ© des fournisseurs",
      "Documenter les changements de pÃƒÂ©rimÃƒÂ¨tre des fournisseurs",
      "RÃƒÂ©aliser un audit annuel des services externalisÃƒÂ©s",
      "PrÃƒÂ©voir un plan de sortie pour chaque service critique"
    ],
    defaultSteps: [
      { title: "KPI", desc: "DÃƒÂ©finir les KPI ÃƒÂ  suivre", completed: false },
      { title: "Revues", desc: "Planifier les revues", completed: false },
      { title: "Audit", desc: "Programmer l'audit annuel", completed: false },
      { title: "Plans sortie", desc: "RÃƒÂ©diger les plans de sortie", completed: false }
    ]
  },
  'A.5.23': {
    recommendations: [
      "Ãƒâ€°valuer la sÃƒÂ©curitÃƒÂ© des fournisseurs cloud (CSPM)",
      "DÃƒÂ©finir un modÃƒÂ¨le de responsabilitÃƒÂ© partagÃƒÂ©e clair",
      "Chiffrer les donnÃƒÂ©es avant stockage cloud",
      "Sauvegarder hors cloud les donnÃƒÂ©es critiques",
      "PrÃƒÂ©voir une stratÃƒÂ©gie de multi-cloud pour ÃƒÂ©viter le lock-in"
    ],
    defaultSteps: [
      { title: "Ãƒâ€°valuation", desc: "Auditer les fournisseurs cloud", completed: false },
      { title: "Chiffrement", desc: "Mettre en place le chiffrement", completed: false },
      { title: "Sauvegardes", desc: "Configurer les backups externes", completed: false },
      { title: "Documentation", desc: "Documenter le RACI cloud", completed: false }
    ]
  },
  'A.5.24': {
    recommendations: [
      "CrÃƒÂ©er une procÃƒÂ©dure formelle de gestion des incidents",
      "DÃƒÂ©signer une ÃƒÂ©quipe CERT/CSIRT interne",
      "Mettre en place un outil de ticketing pour les incidents",
      "DÃƒÂ©finir des niveaux de criticitÃƒÂ© et des SLAs de rÃƒÂ©ponse",
      "Organiser des exercices de simulation d'incident"
    ],
    defaultSteps: [
      { title: "ProcÃƒÂ©dure", desc: "RÃƒÂ©diger la PGI", completed: false },
      { title: "Ãƒâ€°quipe", desc: "Nommer l'ÃƒÂ©quipe incident", completed: false },
      { title: "Outil", desc: "DÃƒÂ©ployer un outil de ticketing", completed: false },
      { title: "Exercice", desc: "Organiser un premier exercice", completed: false }
    ]
  },
  'A.5.25': {
    recommendations: [
      "Former les ÃƒÂ©quipes ÃƒÂ  la qualification des ÃƒÂ©vÃƒÂ©nements",
      "DÃƒÂ©finir une matrice de classification des ÃƒÂ©vÃƒÂ©nements",
      "Mettre en place un seuil de dÃƒÂ©clenchement automatisÃƒÂ©",
      "Documenter les critÃƒÂ¨res de dÃƒÂ©cision pour chaque type d'ÃƒÂ©vÃƒÂ©nement",
      "RÃƒÂ©viser trimestriellement les critÃƒÂ¨res de classification"
    ],
    defaultSteps: [
      { title: "Matrice", desc: "CrÃƒÂ©er la matrice de classification", completed: false },
      { title: "Formation", desc: "Former les analystes", completed: false },
      { title: "Seuils", desc: "Configurer les alertes", completed: false },
      { title: "Revue", desc: "Valider avec l'ÃƒÂ©quipe", completed: false }
    ]
  },
  'A.5.26': {
    recommendations: [
      "Ãƒâ€°tablir des playbooks par type d'incident (ransomware, fuite, etc.)",
      "Mettre en place des runbooks d'escalade",
      "Former les ÃƒÂ©quipes ÃƒÂ  la rÃƒÂ©ponse sur incident",
      "Documenter les contacts d'urgence (lÃƒÂ©gal, com, technique)",
      "RÃƒÂ©aliser un debriefing aprÃƒÂ¨s chaque incident majeur"
    ],
    defaultSteps: [
      { title: "Playbooks", desc: "RÃƒÂ©diger les playbooks", completed: false },
      { title: "Contacts", desc: "CrÃƒÂ©er l'annuaire d'urgence", completed: false },
      { title: "Formation", desc: "Former ÃƒÂ  la rÃƒÂ©ponse", completed: false },
      { title: "Simulation", desc: "Tester les playbooks", completed: false }
    ]
  },
  'A.5.27': {
    recommendations: [
      "Organiser un REX (Retour d'ExpÃƒÂ©rience) aprÃƒÂ¨s chaque incident",
      "Mettre ÃƒÂ  jour les procÃƒÂ©dures suite aux incidents",
      "Partager les leÃƒÂ§ons apprises avec toutes les ÃƒÂ©quipes",
      "Maintenir une base de connaissances des incidents",
      "IntÃƒÂ©grer les enseignements dans la formation sÃƒÂ©curitÃƒÂ©"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃƒÂ©finir le processus REX", completed: false },
      { title: "Base", desc: "CrÃƒÂ©er la base de connaissances", completed: false },
      { title: "Mise ÃƒÂ  jour", desc: "RÃƒÂ©viser les procÃƒÂ©dures", completed: false },
      { title: "Diffusion", desc: "Partager les leÃƒÂ§ons", completed: false }
    ]
  },
  'A.5.28': {
    recommendations: [
      "DÃƒÂ©finir une procÃƒÂ©dure de chaÃƒÂ®ne de custody",
      "Former les ÃƒÂ©quipes ÃƒÂ  la collecte forensique",
      "Mettre ÃƒÂ  disposition une mallette de collecte",
      "Documenter les types de preuves admissibles",
      "Travailler avec un expert lÃƒÂ©gal pour la validitÃƒÂ© des preuves"
    ],
    defaultSteps: [
      { title: "ProcÃƒÂ©dure", desc: "RÃƒÂ©diger la procÃƒÂ©dure de preuves", completed: false },
      { title: "Formation", desc: "Former les rÃƒÂ©pondants", completed: false },
      { title: "Kit", desc: "PrÃƒÂ©parer le kit de collecte", completed: false },
      { title: "Test", desc: "Simuler une collecte", completed: false }
    ]
  },
  'A.5.29': {
    recommendations: [
      "IntÃƒÂ©grer la sÃƒÂ©curitÃƒÂ© dans le PCA/PRA existant",
      "Identifier les actifs critiques ÃƒÂ  protÃƒÂ©ger en prioritÃƒÂ©",
      "DÃƒÂ©finir des modes dÃƒÂ©gradÃƒÂ©s sÃƒÂ©curisÃƒÂ©s",
      "Tester la sÃƒÂ©curitÃƒÂ© en mode dÃƒÂ©gradÃƒÂ© lors des exercices",
      "Maintenir des documents procÃƒÂ©duraux hors ligne"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier les risques de disruption", completed: false },
      { title: "Plan", desc: "IntÃƒÂ©grer sÃƒÂ©curitÃƒÂ© au PCA", completed: false },
      { title: "Tests", desc: "Tester en mode dÃƒÂ©gradÃƒÂ©", completed: false },
      { title: "Mise ÃƒÂ  jour", desc: "RÃƒÂ©viser le PCA", completed: false }
    ]
  },
  'A.5.30': {
    recommendations: [
      "DÃƒÂ©finir des objectifs de temps (RTO) et de perte (RPO) par mÃƒÂ©tier",
      "Tester la restauration des sauvegardes critiques chaque mois",
      "Maintenir une copie des sauvegardes hors ligne (Air-gapped)",
      "Documenter les procÃƒÂ©dures de bascule en mode secours",
      "RÃƒÂ©aliser un exercice de gestion de crise simulant une panne"
    ],
    defaultSteps: [
      { title: "Analyse d'impact", desc: "DÃƒÂ©finir les prioritÃƒÂ©s de reprise", completed: false },
      { title: "Sauvegardes", desc: "Configurer les sauvegardes", completed: false },
      { title: "Test restauration", desc: "VÃƒÂ©rifier l'intÃƒÂ©gritÃƒÂ© des backups", completed: false },
      { title: "Exercice", desc: "Simuler un basculement", completed: false }
    ]
  },
  'A.5.31': {
    recommendations: [
      "Maintenir un registre des obligations lÃƒÂ©gales et rÃƒÂ©glementaires",
      "Nommer un rÃƒÂ©fÃƒÂ©rent conformitÃƒÂ© (Consultant, RSSI)",
      "RÃƒÂ©aliser une veille juridique mensuelle",
      "Documenter les actions de mise en conformitÃƒÂ©",
      "PrÃƒÂ©voir des audits de conformitÃƒÂ© externes"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les obligations", completed: false },
      { title: "Nomination", desc: "DÃƒÂ©signer les rÃƒÂ©fÃƒÂ©rents", completed: false },
      { title: "Veille", desc: "Mettre en place la veille", completed: false },
      { title: "Audit", desc: "Planifier l'audit conformitÃƒÂ©", completed: false }
    ]
  },
  'A.5.32': {
    recommendations: [
      "DÃƒÂ©ployer des solutions anti-piratage logiciel",
      "Signer des accords de licence avec tous les ÃƒÂ©diteurs",
      "RÃƒÂ©aliser un inventaire complet des licences logicielles",
      "Former les employÃƒÂ©s sur les droits d'auteur",
      "Mettre en place une politique d'utilisation des logiciels libres"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister tous les logiciels", completed: false },
      { title: "Licences", desc: "VÃƒÂ©rifier les licences", completed: false },
      { title: "Politique", desc: "RÃƒÂ©diger la politique IP", completed: false },
      { title: "Formation", desc: "Former les ÃƒÂ©quipes", completed: false }
    ]
  },
  'A.5.33': {
    recommendations: [
      "DÃƒÂ©finir une politique de conservation des archives",
      "Mettre en place un systÃƒÂ¨me de GED sÃƒÂ©curisÃƒÂ©",
      "ProtÃƒÂ©ger les archives physiques (armoires fermÃƒÂ©es, alarmes)",
      "Chiffrer les archives numÃƒÂ©riques sensibles",
      "RÃƒÂ©aliser des sauvegardes des archives critiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir les durÃƒÂ©es de conservation", completed: false },
      { title: "GED", desc: "DÃƒÂ©ployer une GED", completed: false },
      { title: "SÃƒÂ©curisation", desc: "ProtÃƒÂ©ger les archives", completed: false },
      { title: "Backups", desc: "Sauvegarder les archives", completed: false }
    ]
  },
  'A.5.34': {
    recommendations: [
      "Nommer un rÃƒÂ©fÃƒÂ©rent conformitÃƒÂ© (Consultant ou RSSI)",
      "Tenir un registre des traitements RGPD",
      "RÃƒÂ©aliser des AIPD pour les traitements sensibles",
      "Mettre en place les droits des personnes (accÃƒÂ¨s, rectification, effacement)",
      "Documenter les violations de donnÃƒÂ©es"
    ],
    defaultSteps: [
      { title: "Conformite", desc: "Nommer le referent conformite", completed: false },
      { title: "Registre", desc: "CrÃƒÂ©er le registre des traitements", completed: false },
      { title: "Droits", desc: "Mettre en place les procÃƒÂ©dures", completed: false },
      { title: "AIPD", desc: "RÃƒÂ©aliser les analyses d'impact", completed: false }
    ]
  },
  'A.5.35': {
    recommendations: [
      "Planifier un audit interne annuel",
      "Faire rÃƒÂ©aliser un audit externe tous les 2 ans",
      "Utiliser des auditeurs certifiÃƒÂ©s (Lead Auditor)",
      "Documenter un plan d'audit et les pÃƒÂ©rimÃƒÂ¨tres",
      "Traiter et suivre les non-conformitÃƒÂ©s identifiÃƒÂ©es"
    ],
    defaultSteps: [
      { title: "Planification", desc: "Ãƒâ€°tablir le plan d'audit", completed: false },
      { title: "Audit interne", desc: "RÃƒÂ©aliser l'audit", completed: false },
      { title: "Actions", desc: "Traiter les non-conformitÃƒÂ©s", completed: false },
      { title: "Audit externe", desc: "Planifier l'audit externe", completed: false }
    ]
  },
  'A.5.36': {
    recommendations: [
      "Mettre en place des contrÃƒÂ´les de conformitÃƒÂ© automatisÃƒÂ©s",
      "RÃƒÂ©aliser des campagnes de rappel des rÃƒÂ¨gles",
      "Auditer alÃƒÂ©atoirement la conformitÃƒÂ© des utilisateurs",
      "DÃƒÂ©finir des sanctions pour non-respect",
      "IntÃƒÂ©grer la conformitÃƒÂ© dans les entretiens annuels"
    ],
    defaultSteps: [
      { title: "ContrÃƒÂ´les", desc: "DÃƒÂ©finir les contrÃƒÂ´les", completed: false },
      { title: "Campagne", desc: "Lancer une campagne de sensibilisation", completed: false },
      { title: "Audits", desc: "RÃƒÂ©aliser des audits surprise", completed: false },
      { title: "Sanctions", desc: "Appliquer le disciplinaire", completed: false }
    ]
  },
  'A.5.37': {
    recommendations: [
      "Documenter toutes les procÃƒÂ©dures opÃƒÂ©rationnelles critiques",
      "Centraliser dans un wiki ou une base documentaire",
      "Versionner et tracer les modifications",
      "Former les ÃƒÂ©quipes ÃƒÂ  l'utilisation des procÃƒÂ©dures",
      "RÃƒÂ©viser annuellement les procÃƒÂ©dures"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les procÃƒÂ©dures ÃƒÂ  documenter", completed: false },
      { title: "RÃƒÂ©daction", desc: "Ãƒâ€°crire les procÃƒÂ©dures", completed: false },
      { title: "Validation", desc: "Faire valider", completed: false },
      { title: "Centralisation", desc: "Publier sur le wiki", completed: false }
    ]
  },
  // ==================== DOMAINE PERSONNES (A.6.1 ÃƒÂ  A.6.8) ====================
  'A.6.1': {
    recommendations: [
      "RÃƒÂ©aliser des vÃƒÂ©rifications des antÃƒÂ©cÃƒÂ©dents pour tous les postes sensibles",
      "VÃƒÂ©rifier les rÃƒÂ©fÃƒÂ©rences professionnelles des candidats",
      "Exiger un extrait de casier judiciaire pour les postes critiques",
      "Renouveler les vÃƒÂ©rifications pÃƒÂ©riodiquement (tous les 3 ans)",
      "Documenter les vÃƒÂ©rifications effectuÃƒÂ©es"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir la politique de vÃƒÂ©rification", completed: false },
      { title: "Processus", desc: "IntÃƒÂ©grer au process RH", completed: false },
      { title: "Fournisseur", desc: "Choisir un prestataire", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Lancer les premiÃƒÂ¨res vÃƒÂ©rifications", completed: false }
    ]
  },
  'A.6.2': {
    recommendations: [
      "Inclure une clause de confidentialitÃƒÂ© dans tous les contrats",
      "DÃƒÂ©finir les obligations sÃƒÂ©curitÃƒÂ© dans les avenants",
      "Faire signer une charte informatique en annexe",
      "PrÃƒÂ©voir des sanctions pour non-respect",
      "Mettre ÃƒÂ  jour les contrats lors des changements lÃƒÂ©gaux"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "RÃƒÂ©diger les clauses sÃƒÂ©curitÃƒÂ©", completed: false },
      { title: "Validation", desc: "Faire valider par juridique", completed: false },
      { title: "Signature", desc: "Faire signer aux employÃƒÂ©s", completed: false },
      { title: "Centralisation", desc: "Archiver les contrats", completed: false }
    ]
  },
  'A.6.3': {
    recommendations: [
      "Organiser une formation sÃƒÂ©curitÃƒÂ© annuelle obligatoire",
      "DÃƒÂ©ployer des campagnes de phishing simulÃƒÂ©",
      "CrÃƒÂ©er un e-learning de sensibilisation",
      "Diffuser des newsletters sÃƒÂ©curitÃƒÂ© mensuelles",
      "Former spÃƒÂ©cifiquement les ÃƒÂ©quipes sensibles (IT, finance, RH)"
    ],
    defaultSteps: [
      { title: "Programme", desc: "DÃƒÂ©finir le programme de formation", completed: false },
      { title: "E-learning", desc: "CrÃƒÂ©er ou acheter des modules", completed: false },
      { title: "Phishing", desc: "Lancer des campagnes simulÃƒÂ©es", completed: false },
      { title: "Suivi", desc: "Mesurer l'efficacitÃƒÂ©", completed: false }
    ]
  },
  'A.6.4': {
    recommendations: [
      "Creer un reglement interieur incluant les sanctions securite",
      "Definir une echelle de sanctions (avertissement, blame, licenciement)",
      "Documenter tous les cas de non-conformite",
      "Impliquer les RH dans le processus disciplinaire",
      "Appliquer les sanctions de maniere coherente"
    ],
    defaultSteps: [
      { title: "Reglement", desc: "Mettre a jour le reglement interieur", completed: false },
      { title: "Echelle", desc: "Definir les niveaux de sanctions", completed: false },
      { title: "Validation", desc: "Faire approuver par la direction", completed: false },
      { title: "Communication", desc: "Informer tous les employes", completed: false }
    ]
  },
  'A.6.5': {
    recommendations: [
      "Maintenir des obligations de confidentialitÃƒÂ© post-dÃƒÂ©part",
      "Informer les employÃƒÂ©s des obligations persistantes",
      "PrÃƒÂ©voir des clauses de non-concurrence si nÃƒÂ©cessaire",
      "Rappeler les obligations lors de l'entretien de sortie",
      "Surveiller le respect aprÃƒÂ¨s dÃƒÂ©part pour les postes sensibles"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "VÃƒÂ©rifier les clauses post-emploi", completed: false },
      { title: "Communication", desc: "Informer lors du dÃƒÂ©part", completed: false },
      { title: "Documentation", desc: "Archiver les rappels", completed: false },
      { title: "Suivi", desc: "Mettre en place des rappels", completed: false }
    ]
  },
  'A.6.6': {
    recommendations: [
      "Faire signer un NDA ÃƒÂ  tous les employÃƒÂ©s et prestataires",
      "RÃƒÂ©viser les NDA tous les 3 ans",
      "Adapter les NDA selon les niveaux d'accÃƒÂ¨s",
      "Centraliser tous les NDA signÃƒÂ©s",
      "PrÃƒÂ©voir des pÃƒÂ©nalitÃƒÂ©s financiÃƒÂ¨res pour violation"
    ],
    defaultSteps: [
      { title: "ModÃƒÂ¨le", desc: "CrÃƒÂ©er un modÃƒÂ¨le de NDA", completed: false },
      { title: "Validation", desc: "Faire valider juridiquement", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "Centralisation", desc: "Archiver dans un coffre", completed: false }
    ]
  },
  'A.6.7': {
    recommendations: [
      "DÃƒÂ©ployer un VPN obligatoire pour le tÃƒÂ©lÃƒÂ©travail",
      "Chiffrer les postes en tÃƒÂ©lÃƒÂ©travail (BitLocker, FileVault)",
      "Interdire le travail sur rÃƒÂ©seaux publics non sÃƒÂ©curisÃƒÂ©s",
      "Mettre en place une politique BYOD claire",
      "Former les tÃƒÂ©lÃƒÂ©travailleurs aux bonnes pratiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "RÃƒÂ©diger la politique tÃƒÂ©lÃƒÂ©travail", completed: false },
      { title: "VPN", desc: "DÃƒÂ©ployer et configurer le VPN", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement disque", completed: false },
      { title: "Formation", desc: "Former les tÃƒÂ©lÃƒÂ©travailleurs", completed: false }
    ]
  },
  'A.6.8': {
    recommendations: [
      "Mettre en place une adresse email dÃƒÂ©diÃƒÂ©e (signalement@)",
      "Garantir l'anonymat des signalements",
      "ProtÃƒÂ©ger les lanceurs d'alerte contre les reprÃƒÂ©sailles",
      "Communiquer sur le dispositif de signalement",
      "Traiter tous les signalements dans un dÃƒÂ©lai maximal de 72h"
    ],
    defaultSteps: [
      { title: "Dispositif", desc: "CrÃƒÂ©er le canal de signalement", completed: false },
      { title: "ProcÃƒÂ©dure", desc: "DÃƒÂ©finir le processus de traitement", completed: false },
      { title: "Communication", desc: "Informer les employÃƒÂ©s", completed: false },
      { title: "Formation", desc: "Former les gestionnaires", completed: false }
    ]
  },
  // ==================== DOMAINE PHYSIQUE (A.7.1 ÃƒÂ  A.7.14) ====================
  'A.7.1': {
    recommendations: [
      "DÃƒÂ©limiter clairement les zones sÃƒÂ©curisÃƒÂ©es (data center, serveurs)",
      "Installer des barriÃƒÂ¨res physiques (murs, clÃƒÂ´tures)",
      "MatÃƒÂ©rialiser le pÃƒÂ©rimÃƒÂ¨tre par une signalÃƒÂ©tique visible",
      "ContrÃƒÂ´ler les accÃƒÂ¨s aux zones sensibles",
      "Maintenir un registre des entrÃƒÂ©es dans les zones critiques"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Identifier les zones sensibles", completed: false },
      { title: "MatÃƒÂ©rialisation", desc: "Installer signalÃƒÂ©tique et barriÃƒÂ¨res", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Mettre en place le contrÃƒÂ´le d'accÃƒÂ¨s", completed: false },
      { title: "Registre", desc: "CrÃƒÂ©er le registre des entrÃƒÂ©es", completed: false }
    ]
  },
  'A.7.2': {
    recommendations: [
      "Installer un systÃƒÂ¨me de contrÃƒÂ´le d'accÃƒÂ¨s (badge, biomÃƒÂ©trie)",
      "Mettre en place des sas d'entrÃƒÂ©e pour les zones sensibles",
      "Former les employÃƒÂ©s ÃƒÂ  ne pas laisser entrer d'inconnus",
      "DÃƒÂ©sactiver les badges des dÃƒÂ©parts immÃƒÂ©diatement",
      "Auditer les logs d'accÃƒÂ¨s mensuellement"
    ],
    defaultSteps: [
      { title: "SystÃƒÂ¨me", desc: "Choisir et installer le contrÃƒÂ´le d'accÃƒÂ¨s", completed: false },
      { title: "Badges", desc: "Distribuer les badges", completed: false },
      { title: "ProcÃƒÂ©dure", desc: "DÃƒÂ©finir la gestion des badges", completed: false },
      { title: "Audit", desc: "Mettre en place la revue des logs", completed: false }
    ]
  },
  'A.7.3': {
    recommendations: [
      "Fermer ÃƒÂ  clÃƒÂ© les bureaux et salles techniques",
      "Installer des serrures ÃƒÂ©lectroniques avec traÃƒÂ§abilitÃƒÂ©",
      "ProtÃƒÂ©ger les baies de brassage dans des armoires fermÃƒÂ©es",
      "Surveiller les zones sensibles par vidÃƒÂ©o",
      "Maintenir une liste des personnes autorisÃƒÂ©es par zone"
    ],
    defaultSteps: [
      { title: "SÃƒÂ©curisation", desc: "Installer serrures et armoires", completed: false },
      { title: "Zonage", desc: "DÃƒÂ©finir les niveaux d'accÃƒÂ¨s", completed: false },
      { title: "CamÃƒÂ©ras", desc: "Installer la vidÃƒÂ©osurveillance", completed: false },
      { title: "ContrÃƒÂ´le", desc: "VÃƒÂ©rifier l'application", completed: false }
    ]
  },
  'A.7.4': {
    recommendations: [
      "DÃƒÂ©ployer un systÃƒÂ¨me de vidÃƒÂ©osurveillance",
      "Conserver les images 30 jours minimum",
      "Surveiller les alarmes intrusion 24/7",
      "DÃƒÂ©signer un responsable de la supervision",
      "RÃƒÂ©aliser des tests hebdomadaires des alarmes"
    ],
    defaultSteps: [
      { title: "Installation", desc: "Pose des camÃƒÂ©ras", completed: false },
      { title: "Centralisation", desc: "Mettre en place la supervision", completed: false },
      { title: "ProcÃƒÂ©dure", desc: "DÃƒÂ©finir la rÃƒÂ©ponse aux alarmes", completed: false },
      { title: "Tests", desc: "Programmer les tests", completed: false }
    ]
  },
  'A.7.5': {
    recommendations: [
      "ProtÃƒÂ©ger contre l'incendie (dÃƒÂ©tecteurs, extincteurs)",
      "Installer des parafoudres et onduleurs",
      "PrÃƒÂ©voir une climatisation pour les serveurs",
      "Ãƒâ€°viter les zones inondables pour les ÃƒÂ©quipements",
      "RÃƒÂ©aliser un audit des risques environnementaux"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Identifier les risques", completed: false },
      { title: "Ãƒâ€°quipements", desc: "Installer protections", completed: false },
      { title: "Maintenance", desc: "Planifier la maintenance", completed: false },
      { title: "Tests", desc: "Tester les ÃƒÂ©quipements", completed: false }
    ]
  },
  'A.7.6': {
    recommendations: [
      "Afficher les rÃƒÂ¨gles de sÃƒÂ©curitÃƒÂ© dans les zones",
      "Accompagner les visiteurs en zone sensible",
      "Interdire les photos dans les zones sÃƒÂ©curisÃƒÂ©es",
      "Exiger le port de badge visible",
      "DÃƒÂ©briefer les ÃƒÂ©quipes aprÃƒÂ¨s chaque incident"
    ],
    defaultSteps: [
      { title: "RÃƒÂ¨gles", desc: "Afficher les consignes", completed: false },
      { title: "Visiteurs", desc: "DÃƒÂ©finir procÃƒÂ©dure d'accueil", completed: false },
      { title: "Formation", desc: "Former les ÃƒÂ©quipes", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Surveiller l'application", completed: false }
    ]
  },
  'A.7.7': {
    recommendations: [
      "Exiger l'extinction des ÃƒÂ©crans en l'absence",
      "Ranger les documents sensibles dans des armoires fermÃƒÂ©es",
      "Interdire les documents papier sur les bureaux la nuit",
      "Utiliser des brouilleurs de confidentialitÃƒÂ© sur ÃƒÂ©crans",
      "Nettoyer les imprimantes des documents sensibles"
    ],
    defaultSteps: [
      { title: "Politique", desc: "RÃƒÂ©diger la rÃƒÂ¨gle", completed: false },
      { title: "Sensibilisation", desc: "Former les employÃƒÂ©s", completed: false },
      { title: "Ãƒâ€°quipement", desc: "Fournir brouilleurs et armoires", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Surveiller l'application", completed: false }
    ]
  },
  'A.7.8': {
    recommendations: [
      "Fixer les equipements sensibles (serveurs, baies)",
      "Proteger les cables dans des goulottes",
      "Maintenir une temperature adaptee (18-27 C)",
      "Nettoyer regulierement les equipements",
      "Surveiller l'humidite (40-60%)"
    ],
    defaultSteps: [
      { title: "Fixation", desc: "Securiser les equipements", completed: false },
      { title: "Goulottes", desc: "Proteger le cablage", completed: false },
      { title: "Environnement", desc: "Installer sondes temperature", completed: false },
      { title: "Maintenance", desc: "Planifier nettoyage", completed: false }
    ]
  },
  'A.7.9': {
    recommendations: [
      "Chiffrer les ordinateurs portables utilisÃƒÂ©s hors site",
      "ProtÃƒÂ©ger les actifs transportÃƒÂ©s (valises sÃƒÂ©curisÃƒÂ©es)",
      "Assurer les actifs mobiles contre le vol",
      "Interdire le stockage de donnÃƒÂ©es sensibles hors site non chiffrÃƒÂ©es",
      "Suivre la localisation des actifs mobiles"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les actifs mobiles", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement", completed: false },
      { title: "Assurance", desc: "VÃƒÂ©rifier couverture", completed: false },
      { title: "TraÃƒÂ§abilitÃƒÂ©", desc: "Mettre en place suivi", completed: false }
    ]
  },
  'A.7.10': {
    recommendations: [
      "Classifier les supports selon sensibilitÃƒÂ©",
      "Chiffrer les supports amovibles",
      "DÃƒÂ©truire les supports par broyage ou incinÃƒÂ©ration",
      "Tenir un registre des supports sensibles",
      "Limiter l'utilisation des clÃƒÂ©s USB"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir gestion supports", completed: false },
      { title: "Chiffrement", desc: "DÃƒÂ©ployer solution", completed: false },
      { title: "Destruction", desc: "Choisir prestataire", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Auditer utilisation", completed: false }
    ]
  },
  'A.7.11': {
    recommendations: [
      "Installer des onduleurs pour les ÃƒÂ©quipements critiques",
      "PrÃƒÂ©voir des groupes ÃƒÂ©lectrogÃƒÂ¨nes",
      "Surveiller la qualitÃƒÂ© d'alimentation ÃƒÂ©lectrique",
      "Tester les onduleurs trimestriellement",
      "Maintenir des contrats de maintenance"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Identifier ÃƒÂ©quipements critiques", completed: false },
      { title: "Onduleurs", desc: "Installer onduleurs", completed: false },
      { title: "Groupe", desc: "PrÃƒÂ©voir si nÃƒÂ©cessaire", completed: false },
      { title: "Tests", desc: "Programmer tests", completed: false }
    ]
  },
  'A.7.12': {
    recommendations: [
      "Proteger le cablage dans des goulottes ou chemins fermes",
      "Etiqueter les cables pour faciliter l'identification",
      "Interdire les cables apparents",
      "Surveiller l'integrite du cablage",
      "Utiliser des cables blindes pour les zones sensibles"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Inspecter cablage existant", completed: false },
      { title: "Correction", desc: "Proteger cables non conformes", completed: false },
      { title: "Etiquetage", desc: "Identifier les cables", completed: false },
      { title: "Documentation", desc: "Creer schema cablage", completed: false }
    ]
  },
  'A.7.13': {
    recommendations: [
      "Planifier une maintenance prÃƒÂ©ventive annuelle",
      "Signer des contrats de maintenance avec fournisseurs",
      "TraÃƒÂ§abilitÃƒÂ© des interventions",
      "VÃƒÂ©rifier les ÃƒÂ©quipements aprÃƒÂ¨s maintenance",
      "Maintenir des piÃƒÂ¨ces de rechange critiques"
    ],
    defaultSteps: [
      { title: "Planning", desc: "Ãƒâ€°tablir planning maintenance", completed: false },
      { title: "Contrats", desc: "Signer contrats", completed: false },
      { title: "Registre", desc: "CrÃƒÂ©er registre interventions", completed: false },
      { title: "Rechanges", desc: "Stocker piÃƒÂ¨ces critiques", completed: false }
    ]
  },
  'A.7.14': {
    recommendations: [
      "Effacer sÃƒÂ©curisÃƒÂ© les disques avant rÃƒÂ©utilisation",
      "DÃƒÂ©truire physiquement les disques dÃƒÂ©fectueux",
      "Obtenir un certificat de destruction",
      "Suivre la traÃƒÂ§abilitÃƒÂ© des ÃƒÂ©quipements ÃƒÂ©liminÃƒÂ©s",
      "Utiliser des prestataires certifiÃƒÂ©s"
    ],
    defaultSteps: [
      { title: "ProcÃƒÂ©dure", desc: "DÃƒÂ©finir processus", completed: false },
      { title: "Outil", desc: "Choisir outil d'effacement", completed: false },
      { title: "Prestataire", desc: "SÃƒÂ©lectionner destructeur certifiÃƒÂ©", completed: false },
      { title: "TraÃƒÂ§abilitÃƒÂ©", desc: "Mettre en place registre", completed: false }
    ]
  },
  // ==================== DOMAINE TECHNOLOGIQUE (A.8.1 ÃƒÂ  A.8.34) ====================
  'A.8.1': {
    recommendations: [
      "Chiffrer tous les postes de travail",
      "Activer le pare-feu local sur tous les postes",
      "DÃƒÂ©ployer un antivirus/EDR sur les postes",
      "Verrouiller automatiquement les postes aprÃƒÂ¨s 5 min",
      "Interdire l'installation de logiciels non approuvÃƒÂ©s"
    ],
    defaultSteps: [
      { title: "Baseline", desc: "DÃƒÂ©finir configuration sÃƒÂ©curisÃƒÂ©e", completed: false },
      { title: "Chiffrement", desc: "Activer BitLocker/FileVault", completed: false },
      { title: "EDR", desc: "DÃƒÂ©ployer solution", completed: false },
      { title: "GPO", desc: "Configurer verrouillage", completed: false }
    ]
  },
  'A.8.2': {
    recommendations: [
      "Utiliser des comptes d'administration dÃƒÂ©diÃƒÂ©s",
      "Imposer MFA pour tous les comptes privilÃƒÂ©giÃƒÂ©s",
      "Surveiller les actions des administrateurs",
      "RÃƒÂ©voquer les privilÃƒÂ¨ges aprÃƒÂ¨s 90 jours si non utilisÃƒÂ©s",
      "Utiliser un PAM (Privileged Access Management)"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister comptes privilÃƒÂ©giÃƒÂ©s", completed: false },
      { title: "PAM", desc: "DÃƒÂ©ployer solution PAM", completed: false },
      { title: "MFA", desc: "Activer MFA", completed: false },
      { title: "Surveillance", desc: "Mettre en place SIEM", completed: false }
    ]
  },
  'A.8.3': {
    recommendations: [
      "Appliquer le RBAC (Role-Based Access Control)",
      "RÃƒÂ©viser les accÃƒÂ¨s tous les 6 mois",
      "Utiliser des groupes de sÃƒÂ©curitÃƒÂ© AD",
      "Journaliser tous les accÃƒÂ¨s",
      "Mettre en place des workflows d'approbation"
    ],
    defaultSteps: [
      { title: "ModÃƒÂ¨le", desc: "DÃƒÂ©finir les rÃƒÂ´les", completed: false },
      { title: "Groupes", desc: "CrÃƒÂ©er groupes AD", completed: false },
      { title: "Migration", desc: "Passer au RBAC", completed: false },
      { title: "Revue", desc: "Programmer revues", completed: false }
    ]
  },
  'A.8.4': {
    recommendations: [
      "Utiliser un gestionnaire de versions (Git)",
      "Restreindre l'accÃƒÂ¨s en lecture seule",
      "Signer les commits avec GPG",
      "Scanner le code pour vulnÃƒÂ©rabilitÃƒÂ©s",
      "Sauvegarder le code source hors site"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir forge logicielle", completed: false },
      { title: "Permissions", desc: "Configurer ACLs", completed: false },
      { title: "Scan", desc: "IntÃƒÂ©grer SAST", completed: false },
      { title: "Backups", desc: "Configurer sauvegardes", completed: false }
    ]
  },
  'A.8.5': {
    recommendations: [
      "DÃƒÂ©ployer MFA sur tous les accÃƒÂ¨s externes",
      "Utiliser SSO avec MFA",
      "Interdire les mots de passe faibles",
      "Mettre en place la biomÃƒÂ©trie pour les postes critiques",
      "Verrouiller aprÃƒÂ¨s 5 ÃƒÂ©checs"
    ],
    defaultSteps: [
      { title: "MFA", desc: "Choisir solution MFA", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "DÃƒÂ©ployer sur tous les accÃƒÂ¨s", completed: false },
      { title: "Politique", desc: "DÃƒÂ©finir rÃƒÂ¨gles", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.6': {
    recommendations: [
      "Surveiller les ressources systÃƒÂ¨mes (CPU, RAM, disque)",
      "Planifier la capacitÃƒÂ© ÃƒÂ  12 mois",
      "Mettre en place des alertes de saturation",
      "Dimensionner les environnements pour la croissance",
      "Automatiser l'ajustement de capacitÃƒÂ© (cloud)"
    ],
    defaultSteps: [
      { title: "MÃƒÂ©triques", desc: "DÃƒÂ©finir indicateurs", completed: false },
      { title: "Supervision", desc: "DÃƒÂ©ployer outils", completed: false },
      { title: "Seuils", desc: "Configurer alertes", completed: false },
      { title: "Plan", desc: "Ãƒâ€°tablir plan capacitÃƒÂ©", completed: false }
    ]
  },
  'A.8.7': {
    recommendations: [
      "DÃƒÂ©ployer un antivirus/EDR sur tous les postes",
      "Mettre ÃƒÂ  jour automatiquement les signatures",
      "Configurer des analyses programmÃƒÂ©es",
      "Interdire l'exÃƒÂ©cution de macros Office",
      "Former aux risques de phishing"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir EDR", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Installer sur tous postes", completed: false },
      { title: "Configuration", desc: "Configurer politiques", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.8': {
    recommendations: [
      "Planifier des scans de vulnÃƒÂ©rabilitÃƒÂ©s automatiques chaque semaine",
      "DÃƒÂ©finir des dÃƒÂ©lais de correction (SLA) stricts selon la criticitÃƒÂ©",
      "Automatiser le dÃƒÂ©ploiement des correctifs (Patch Management)",
      "RÃƒÂ©aliser un test d'intrusion annuel par un prestataire externe",
      "Isoler du rÃƒÂ©seau les systÃƒÂ¨mes obsolÃƒÂ¨tes ne pouvant ÃƒÂªtre patchÃƒÂ©s"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir scanner vulnÃƒÂ©rabilitÃƒÂ©s", completed: false },
      { title: "Scan", desc: "Identifier les failles critiques", completed: false },
      { title: "Patching", desc: "Appliquer les correctifs", completed: false },
      { title: "Pentest", desc: "Planifier test intrusion", completed: false }
    ]
  },
  'A.8.9': {
    recommendations: [
      "Utiliser des outils de gestion de configuration (Ansible, Chef)",
      "Maintenir des baselines sÃƒÂ©curisÃƒÂ©es",
      "DÃƒÂ©tecter les dÃƒÂ©rives de configuration",
      "Automatiser la correction des configurations",
      "Versionner les configurations"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir outil IaC", completed: false },
      { title: "Baseline", desc: "DÃƒÂ©finir configurations sÃƒÂ©curisÃƒÂ©es", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Appliquer aux systÃƒÂ¨mes", completed: false },
      { title: "Surveillance", desc: "DÃƒÂ©tecter dÃƒÂ©rives", completed: false }
    ]
  },
  'A.8.10': {
    recommendations: [
      "DÃƒÂ©finir des durÃƒÂ©es de rÃƒÂ©tention prÃƒÂ©cises selon le RGPD",
      "Utiliser des outils d'effacement sÃƒÂ©curisÃƒÂ© certifiÃƒÂ©s",
      "DÃƒÂ©truire physiquement les disques durs dÃƒÂ©fectueux par broyage",
      "Mettre en place un script de purge automatique pour les logs",
      "RÃƒÂ©aliser des contrÃƒÂ´les inopinÃƒÂ©s pour vÃƒÂ©rifier la suppression"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir durÃƒÂ©es rÃƒÂ©tention", completed: false },
      { title: "Inventaire", desc: "Identifier les donnÃƒÂ©es hors dÃƒÂ©lais", completed: false },
      { title: "Purge", desc: "Effacement dÃƒÂ©finitif des supports", completed: false },
      { title: "ContrÃƒÂ´le", desc: "Auditer suppression", completed: false }
    ]
  },
  'A.8.11': {
    recommendations: [
      "Anonymiser les donnÃƒÂ©es en environnement de test",
      "Utiliser des donnÃƒÂ©es synthÃƒÂ©tiques quand possible",
      "Masquer les donnÃƒÂ©es sensibles dans les logs",
      "DÃƒÂ©ployer un outil de data masking",
      "Auditer l'utilisation des donnÃƒÂ©es masquÃƒÂ©es"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir rÃƒÂ¨gles masquage", completed: false },
      { title: "Outil", desc: "Choisir solution", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Appliquer aux environnements", completed: false },
      { title: "ContrÃƒÂ´le", desc: "VÃƒÂ©rifier efficacitÃƒÂ©", completed: false }
    ]
  },
  'A.8.12': {
    recommendations: [
      "DÃƒÂ©ployer une solution DLP",
      "Classifier les donnÃƒÂ©es sensibles",
      "Bloquer l'exfiltration par email/USB",
      "Surveiller les transferts anormaux",
      "Former aux risques de fuite"
    ],
    defaultSteps: [
      { title: "DLP", desc: "Choisir solution", completed: false },
      { title: "RÃƒÂ¨gles", desc: "Configurer politiques", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Installer sur postes", completed: false },
      { title: "Formation", desc: "Sensibiliser", completed: false }
    ]
  },
  'A.8.13': {
    recommendations: [
      "Sauvegarder quotidiennement les donnÃƒÂ©es critiques",
      "Tester la restauration mensuellement",
      "Maintenir des sauvegardes hors site",
      "Chiffrer les sauvegardes",
      "Documenter la procÃƒÂ©dure de restauration"
    ],
    defaultSteps: [
      { title: "Plan", desc: "DÃƒÂ©finir politique sauvegarde", completed: false },
      { title: "Outil", desc: "DÃƒÂ©ployer solution", completed: false },
      { title: "Tests", desc: "Tester restauration", completed: false },
      { title: "Documentation", desc: "RÃƒÂ©diger procÃƒÂ©dure", completed: false }
    ]
  },
  'A.8.14': {
    recommendations: [
      "Mettre en place du load balancing",
      "PrÃƒÂ©voir des serveurs de secours",
      "Utiliser le cloud pour la redondance",
      "Tester le basculement annuellement",
      "Documenter l'architecture redondante"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier SPOF", completed: false },
      { title: "Conception", desc: "Architecturer redondance", completed: false },
      { title: "ImplÃƒÂ©mentation", desc: "DÃƒÂ©ployer", completed: false },
      { title: "Tests", desc: "Tester basculement", completed: false }
    ]
  },
  'A.8.15': {
    recommendations: [
      "Centraliser les logs dans un SIEM",
      "Conserver les logs 13 mois",
      "ProtÃƒÂ©ger les logs contre modification",
      "Surveiller les logs en temps rÃƒÂ©el",
      "Mettre en place des alertes automatisÃƒÂ©es"
    ],
    defaultSteps: [
      { title: "SIEM", desc: "Choisir solution", completed: false },
      { title: "Collecte", desc: "Configurer collecte logs", completed: false },
      { title: "RÃƒÂ©tention", desc: "DÃƒÂ©finir durÃƒÂ©e", completed: false },
      { title: "Alertes", desc: "Configurer rÃƒÂ¨gles", completed: false }
    ]
  },
  'A.8.16': {
    recommendations: [
      "Surveiller 24/7 les systÃƒÂ¨mes critiques",
      "DÃƒÂ©tecter les comportements anormaux",
      "Mettre en place des SOC ou MSSP",
      "RÃƒÂ©agir aux alertes en < 1h",
      "Maintenir une base de rÃƒÂ©fÃƒÂ©rence"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir solution monitoring", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Installer sondes", completed: false },
      { title: "Base", desc: "Ãƒâ€°tablir baseline", completed: false },
      { title: "RÃƒÂ©ponse", desc: "DÃƒÂ©finir procÃƒÂ©dure", completed: false }
    ]
  },
  'A.8.17': {
    recommendations: [
      "Utiliser NTP pour synchronisation",
      "Synchroniser sur pool.ntp.org ou ÃƒÂ©quivalent",
      "VÃƒÂ©rifier l'heure sur tous systÃƒÂ¨mes",
      "Auditer la synchronisation mensuellement",
      "Configurer plusieurs sources NTP"
    ],
    defaultSteps: [
      { title: "Serveur", desc: "Configurer NTP", completed: false },
      { title: "Clients", desc: "Configurer synchronisation", completed: false },
      { title: "VÃƒÂ©rification", desc: "Auditer", completed: false },
      { title: "Redondance", desc: "Ajouter sources", completed: false }
    ]
  },
  'A.8.18': {
    recommendations: [
      "Restreindre l'utilisation des utilitaires",
      "Surveiller l'exÃƒÂ©cution d'utilitaires suspects",
      "DÃƒÂ©sactiver PowerShell si inutilisÃƒÂ©",
      "Auditer les sessions administrateur",
      "Utiliser AppLocker"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister utilitaires", completed: false },
      { title: "Restriction", desc: "Configurer politiques", completed: false },
      { title: "Surveillance", desc: "Mettre en place logs", completed: false },
      { title: "Audit", desc: "VÃƒÂ©rifier utilisation", completed: false }
    ]
  },
  'A.8.19': {
    recommendations: [
      "Maintenir une liste d'applications approuvÃƒÂ©es",
      "Interdire l'installation par utilisateurs",
      "Utiliser un outil de gestion des logiciels",
      "Scanner les logiciels installÃƒÂ©s",
      "DÃƒÂ©sinstaller les logiciels non conformes"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir rÃƒÂ¨gles", completed: false },
      { title: "Outil", desc: "DÃƒÂ©ployer gestionnaire", completed: false },
      { title: "Audit", desc: "Scanner existant", completed: false },
      { title: "Nettoyage", desc: "Supprimer non approuvÃƒÂ©s", completed: false }
    ]
  },
  'A.8.20': {
    recommendations: [
      "Segmenter le rÃƒÂ©seau en zones",
      "Mettre en place un pare-feu NextGen",
      "Configurer des ACLs strictes",
      "Surveiller le trafic rÃƒÂ©seau",
      "DÃƒÂ©sactiver les services inutilisÃƒÂ©s"
    ],
    defaultSteps: [
      { title: "Architecture", desc: "Concevoir segmentation", completed: false },
      { title: "Pare-feu", desc: "DÃƒÂ©ployer NGFW", completed: false },
      { title: "RÃƒÂ¨gles", desc: "Configurer ACLs", completed: false },
      { title: "Surveillance", desc: "Mettre en place NDR", completed: false }
    ]
  },
  'A.8.21': {
    recommendations: [
      "Documenter les services rÃƒÂ©seau",
      "DÃƒÂ©finir des SLAs sÃƒÂ©curitÃƒÂ©",
      "Signer des contrats avec niveaux de service",
      "Surveiller la disponibilitÃƒÂ©",
      "Auditer annuellement les services"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister services", completed: false },
      { title: "SLA", desc: "DÃƒÂ©finir exigences", completed: false },
      { title: "Contrats", desc: "NÃƒÂ©gocier", completed: false },
      { title: "Surveillance", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.22': {
    recommendations: [
      "CrÃƒÂ©er des VLANs par fonction",
      "Isoler le Wi-Fi invitÃƒÂ© du rÃƒÂ©seau interne",
      "SÃƒÂ©parer les environnements (prod, dev, test)",
      "Utiliser des DMZ pour services exposÃƒÂ©s",
      "Configurer des pare-feu entre zones"
    ],
    defaultSteps: [
      { title: "Zonage", desc: "DÃƒÂ©finir zones", completed: false },
      { title: "VLANs", desc: "Configurer", completed: false },
      { title: "Pare-feu", desc: "Mettre en place filtrage", completed: false },
      { title: "Tests", desc: "Valider isolation", completed: false }
    ]
  },
  'A.8.23': {
    recommendations: [
      "DÃƒÂ©ployer un proxy filtrant",
      "Bloquer les catÃƒÂ©gories ÃƒÂ  risque",
      "Autoriser uniquement les sites mÃƒÂ©tier",
      "Surveiller les requÃƒÂªtes DNS",
      "Former aux risques Web"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir proxy", completed: false },
      { title: "CatÃƒÂ©gories", desc: "DÃƒÂ©finir filtrage", completed: false },
      { title: "DÃƒÂ©ploiement", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.24': {
    recommendations: [
      "Chiffrer les donnÃƒÂ©es sensibles au repos",
      "Chiffrer les flux rÃƒÂ©seau (TLS 1.3)",
      "Utiliser un HSM pour les clÃƒÂ©s",
      "Faire tourner les clÃƒÂ©s annuellement",
      "Documenter la politique cryptographique"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir rÃƒÂ¨gles crypto", completed: false },
      { title: "HSM", desc: "DÃƒÂ©ployer", completed: false },
      { title: "Gestion", desc: "Mettre en place processus clÃƒÂ©s", completed: false },
      { title: "Audit", desc: "VÃƒÂ©rifier conformitÃƒÂ©", completed: false }
    ]
  },
  'A.8.25': {
    recommendations: [
      "IntÃƒÂ©grer la sÃƒÂ©curitÃƒÂ© dÃƒÂ¨s la conception (DevSecOps)",
      "Former les dÃƒÂ©veloppeurs ÃƒÂ  la sÃƒÂ©curitÃƒÂ©",
      "Utiliser des outils SAST/DAST",
      "RÃƒÂ©aliser des revues de code",
      "Documenter les exigences sÃƒÂ©curitÃƒÂ©"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃƒÂ©finir SDLC sÃƒÂ©curisÃƒÂ©", completed: false },
      { title: "Outils", desc: "IntÃƒÂ©grer SAST/DAST", completed: false },
      { title: "Formation", desc: "Former dÃƒÂ©veloppeurs", completed: false },
      { title: "Revues", desc: "Mettre en place code review", completed: false }
    ]
  },
  'A.8.26': {
    recommendations: [
      "DÃƒÂ©finir des exigences sÃƒÂ©curitÃƒÂ© fonctionnelles",
      "RÃƒÂ©aliser une analyse des risques applicatifs",
      "Valider les exigences avec le mÃƒÂ©tier",
      "Tester la conformitÃƒÂ© aux exigences",
      "Maintenir un registre des exigences"
    ],
    defaultSteps: [
      { title: "Template", desc: "CrÃƒÂ©er modÃƒÂ¨le exigences", completed: false },
      { title: "Analyse", desc: "Identifier risques", completed: false },
      { title: "Validation", desc: "Faire approuver", completed: false },
      { title: "Tests", desc: "VÃƒÂ©rifier conformitÃƒÂ©", completed: false }
    ]
  },
  'A.8.27': {
    recommendations: [
      "Adopter l'architecture Zero Trust",
      "Appliquer le principe de moindre privilÃƒÂ¨ge",
      "Utiliser la dÃƒÂ©fense en profondeur",
      "Documenter l'architecture",
      "RÃƒÂ©viser les principes annuellement"
    ],
    defaultSteps: [
      { title: "Principes", desc: "DÃƒÂ©finir", completed: false },
      { title: "Architecture", desc: "Concevoir", completed: false },
      { title: "Documentation", desc: "RÃƒÂ©diger", completed: false },
      { title: "Revue", desc: "Planifier rÃƒÂ©vision", completed: false }
    ]
  },
  'A.8.28': {
    recommendations: [
      "Suivre les standards OWASP",
      "Valider toutes les entrÃƒÂ©es utilisateur",
      "Ãƒâ€°chapper les sorties",
      "Utiliser des requÃƒÂªtes paramÃƒÂ©trÃƒÂ©es",
      "Former aux vulnÃƒÂ©rabilitÃƒÂ©s Web"
    ],
    defaultSteps: [
      { title: "Guide", desc: "Documenter rÃƒÂ¨gles codage", completed: false },
      { title: "Formation", desc: "Former ÃƒÂ©quipes", completed: false },
      { title: "Outils", desc: "IntÃƒÂ©grer linters sÃƒÂ©curitÃƒÂ©", completed: false },
      { title: "Revues", desc: "VÃƒÂ©rifier conformitÃƒÂ©", completed: false }
    ]
  },
  'A.8.29': {
    recommendations: [
      "IntÃƒÂ©grer tests sÃƒÂ©curitÃƒÂ© dans CI/CD",
      "RÃƒÂ©aliser des tests d'intrusion applicatifs",
      "Tester avant mise en production",
      "Automatiser les tests de non-rÃƒÂ©gression sÃƒÂ©curitÃƒÂ©",
      "Documenter les rÃƒÂ©sultats"
    ],
    defaultSteps: [
      { title: "CI/CD", desc: "IntÃƒÂ©grer tests", completed: false },
      { title: "Pentest", desc: "Planifier", completed: false },
      { title: "Automatisation", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.30': {
    recommendations: [
      "Auditer les dÃƒÂ©veloppements externalisÃƒÂ©s",
      "Exiger des livrables sÃƒÂ©curitÃƒÂ©",
      "Restreindre l'accÃƒÂ¨s aux donnÃƒÂ©es de production",
      "Signer des clauses de confidentialitÃƒÂ©",
      "VÃƒÂ©rifier la conformitÃƒÂ© des sous-traitants"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "DÃƒÂ©finir contrats", completed: false },
      { title: "Audit", desc: "Planifier audits", completed: false },
      { title: "AccÃƒÂ¨s", desc: "Restreindre", completed: false },
      { title: "Livrables", desc: "Exiger documentation sÃƒÂ©curitÃƒÂ©", completed: false }
    ]
  },
  'A.8.31': {
    recommendations: [
      "Isoler physiquement ou logiquement les environnements",
      "Utiliser des donnÃƒÂ©es anonymisÃƒÂ©es en test",
      "Interdire les accÃƒÂ¨s production depuis dev",
      "Configurer des comptes sÃƒÂ©parÃƒÂ©s",
      "Auditer la sÃƒÂ©paration"
    ],
    defaultSteps: [
      { title: "SÃƒÂ©paration", desc: "Isoler rÃƒÂ©seaux", completed: false },
      { title: "Comptes", desc: "CrÃƒÂ©er comptes dÃƒÂ©diÃƒÂ©s", completed: false },
      { title: "AccÃƒÂ¨s", desc: "Configurer restrictions", completed: false },
      { title: "Audit", desc: "VÃƒÂ©rifier", completed: false }
    ]
  },
  'A.8.32': {
    recommendations: [
      "Mettre en place un ITIL/Change Management",
      "Documenter tous les changements",
      "Valider les changements en CAB",
      "Tester avant dÃƒÂ©ploiement",
      "PrÃƒÂ©voir un plan de retour arriÃƒÂ¨re"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃƒÂ©finir gestion changements", completed: false },
      { title: "Outil", desc: "DÃƒÂ©ployer outil ticketing", completed: false },
      { title: "CAB", desc: "Former comitÃƒÂ©", completed: false },
      { title: "Formation", desc: "Former ÃƒÂ©quipes", completed: false }
    ]
  },
  'A.8.33': {
    recommendations: [
      "Ne pas utiliser de donnÃƒÂ©es rÃƒÂ©elles en test",
      "Anonymiser les donnÃƒÂ©es de test",
      "ProtÃƒÂ©ger les jeux de donnÃƒÂ©es de test",
      "DÃƒÂ©truire les donnÃƒÂ©es aprÃƒÂ¨s test",
      "Auditer l'utilisation"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃƒÂ©finir rÃƒÂ¨gles donnÃƒÂ©es test", completed: false },
      { title: "Anonymisation", desc: "Mettre en place", completed: false },
      { title: "Destruction", desc: "Configurer", completed: false },
      { title: "Audit", desc: "VÃƒÂ©rifier", completed: false }
    ]
  },
  'A.8.34': {
    recommendations: [
      "Planifier les audits avec les ÃƒÂ©quipes",
      "Isoler les tests d'audit",
      "Surveiller les activitÃƒÂ©s d'audit",
      "Restaurer aprÃƒÂ¨s audit",
      "Documenter les pÃƒÂ©rimÃƒÂ¨tres"
    ],
    defaultSteps: [
      { title: "ProcÃƒÂ©dure", desc: "DÃƒÂ©finir", completed: false },
      { title: "Planification", desc: "Coordonner", completed: false },
      { title: "Isolation", desc: "Mettre en place", completed: false },
      { title: "Restauration", desc: "PrÃƒÂ©voir rollback", completed: false }
    ]
  }
};

const DEFAULT_CONFIG = {
  recommendations: [
    "Analyser la cause racine de la non-conformitÃƒÂ© constatÃƒÂ©e",
    "Nommer un pilote responsable pour le pilotage de ce plan",
    "DÃƒÂ©finir un calendrier de mise en Ã…â€œuvre rÃƒÂ©aliste",
    "Documenter les preuves de correction (photos, logs, mails)",
    "RÃƒÂ©aliser une vÃƒÂ©rification d'efficacitÃƒÂ© aprÃƒÂ¨s clÃƒÂ´ture"
  ],
  defaultSteps: [{ title: "Diagnostic", desc: "Identifier les causes de l'ÃƒÂ©cart", completed: false }]
};

export default function PlanActionModal({ ctrl, onClose, onSave }) {
  const config = PLAN_CONFIGS[ctrl?.code] || DEFAULT_CONFIG;
  
 const [formData, setFormData] = useState({
  statut: ctrl?.statutPlan || 'NonDemarre',
  priorite: ctrl?.priorite || 'Basse',
  responsable: ctrl?.responsablePlan || '',
  dateEcheance: ctrl?.dateEcheance || '',
  notes: ctrl?.commentaireCloture || '',
  steps: (ctrl?.steps && (Array.isArray(ctrl.steps) ? ctrl.steps.length > 0 : true)) 
    ? (typeof ctrl.steps === 'string' ? JSON.parse(ctrl.steps) : ctrl.steps) 
    : config.defaultSteps
});
  const completedSteps = formData.steps.filter(s => s.completed).length;
  const progress = formData.steps.length > 0 ? (completedSteps / formData.steps.length) * 100 : 0;

  const toggleStep = (index) => {
    const newSteps = [...formData.steps];
    newSteps[index].completed = !newSteps[index].completed;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    const title = prompt("Titre de la nouvelle ÃƒÂ©tape :");
    if (title) {
      setFormData({
        ...formData,
        steps: [...formData.steps, { title, desc: "Action manuelle", completed: false }]
      });
    }
  };

  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave({
        statutPlan: formData.statut,
        responsablePlan: formData.responsable,
        dateEcheance: formData.dateEcheance,
        commentaireCloture: formData.notes,
        steps: formData.steps,
        priorite: formData.priorite 
      });
    } else {
      console.error("Erreur : La fonction onSave n'a pas ÃƒÂ©tÃƒÂ© passÃƒÂ©e au composant.");
    }
  };

  const FONT_SORA = "'Sora', sans-serif";

  const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    container: { width: '700px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', fontFamily: FONT_SORA },
    header: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    content: { padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px', backgroundColor: '#f8fafc' },
    card: { backgroundColor: '#fff', padding: '18px', borderRadius: '15px', border: '1px solid #e2e8f0' },
    title: { margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b', fontFamily: FONT_SORA },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '5px', display: 'block', fontFamily: FONT_SORA },
    input: { padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#f1f5f9', fontSize: '13px', width: '100%', boxSizing: 'border-box', fontFamily: FONT_SORA },
    recItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '12.5px', marginBottom: '10px', color: '#475569', lineHeight: '1.4', fontFamily: FONT_SORA },
    barBg: { height: '8px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', margin: '10px 0' },
    barFill: { height: '100%', backgroundColor: '#7c3aed', transition: 'width 0.4s ease' },
    stepItem: (done) => ({ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: done ? '#f0fdf4' : '#fff', marginBottom: '8px' }),
    footer: { padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fff' },
    btnSave: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: FONT_SORA }
  };

  return (
    <div style={styles.overlay} onClick={() => typeof onClose === 'function' && onClose()}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList color="#4f46e5" size={20} />
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Plan d'action : {ctrl?.code} - {ctrl?.titre}</h2>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onClose === 'function') onClose();
            }} 
            style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}
          >
             <X size={22} color="#64748b" />
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.card}>
            <h3 style={styles.title}>Informations du plan d'action</h3>
            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Statut</label>
                <select 
                    style={styles.input} 
                    value={formData.statut} 
                    onChange={e => setFormData({...formData, statut: e.target.value})}
                  >
                    <option value="NonDemarre">Non dÃƒÂ©marrÃƒÂ©</option>
                    <option value="EnCours">En cours</option>
                    <option value="Termine">TerminÃƒÂ©</option>
                  </select>
              </div>
              <div>
                <label style={styles.label}>PrioritÃƒÂ©</label>
                <select 
                  style={styles.input} 
                  value={formData.priorite} 
                  onChange={e => setFormData({...formData, priorite: e.target.value})}
                >
                  <option value="Basse">Basse</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Haute">Haute</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Responsable</label>
                <input style={styles.input} placeholder="Nom du responsable" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} />
              </div>
              <div>
                <label style={styles.label}>Date d'ÃƒÂ©chÃƒÂ©ance</label>
                <input type="date" style={styles.input} value={formData.dateEcheance} onChange={e => setFormData({...formData, dateEcheance: e.target.value})} />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <Lightbulb size={20} color="#f59e0b" />
              <h3 style={styles.title}>5 Recommandations</h3>
            </div>
            {config.recommendations.map((rec, i) => (
              <div key={i} style={styles.recItem}>
                <CheckCircle2 size={16} color="#10b981" style={{flexShrink:0, marginTop:2}} />
                <span>{rec}</span>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={styles.title}>Ãƒâ€°tapes du plan d'action</h3>
              <button onClick={addStep} style={{ ...styles.input, width: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>+ Ajouter ÃƒÂ©tape</button>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{completedSteps} / {formData.steps.length} ÃƒÂ©tapes complÃƒÂ©tÃƒÂ©es</div>
            <div style={styles.barBg}><div style={{ ...styles.barFill, width: `${progress}%` }} /></div>
            <div style={{ marginTop: 15 }}>
              {formData.steps.map((step, i) => (
                <div key={i} style={styles.stepItem(step.completed)}>
                  <input 
                    type="checkbox" 
                    checked={step.completed} 
                    onChange={() => toggleStep(i)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }} 
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800 }}>Ãƒâ€°tape {i+1} : {step.title}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.title}>Notes et commentaires</h3>
            <textarea 
              style={{ ...styles.input, minHeight: '70px', resize: 'none' }} 
              placeholder="Notes, observations, preuves..." 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
            />
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.btnSave} onClick={handleSave}>
            <Save size={18} /> Enregistrer le plan
          </button>
        </div>
      </div>
    </div>
  );
}

