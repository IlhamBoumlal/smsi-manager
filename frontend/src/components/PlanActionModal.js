import React, { useState } from 'react';
import { 
  X, CheckCircle2, Lightbulb, ClipboardList, 
  Save 
} from 'lucide-react';

// Configuration complÃ¨te pour TOUS les contrÃ´les avec 5 recommandations chacun
const PLAN_CONFIGS = {
  // ==================== DOMAINE ORGANISATIONNEL (A.5.1 Ã  A.5.37) ====================
  'A.5.1': {
    recommendations: [
      "RÃ©diger une politique de sÃ©curitÃ© de l'information formelle et complÃ¨te",
      "Faire approuver formellement la politique par la Direction GÃ©nÃ©rale (DG)",
      "Diffuser la politique Ã  l'ensemble du personnel via l'intranet et email",
      "Inclure la signature de la politique dans le processus d'onboarding RH",
      "Planifier une rÃ©vision annuelle et tracer les versions dans un registre"
    ],
    defaultSteps: [
      { title: "RÃ©daction", desc: "Ã‰laborer la version complÃ¨te de la politique", completed: false },
      { title: "Validation lÃ©gale", desc: "VÃ©rifier la conformitÃ© avec les obligations lÃ©gales", completed: false },
      { title: "Approbation DG", desc: "Signature officielle par la direction", completed: false },
      { title: "Diffusion", desc: "Publier sur l'intranet et communiquer par email", completed: false },
      { title: "Formation", desc: "Former tous les employÃ©s sur la politique", completed: false }
    ]
  },
  'A.5.2': {
    recommendations: [
      "CrÃ©er une matrice RACI dÃ©taillÃ©e pour tous les rÃ´les sÃ©curitÃ©",
      "Nommer officiellement un RSSI (Responsable SÃ©curitÃ© des SystÃ¨mes d'Information)",
      "DÃ©finir les responsabilitÃ©s sÃ©curitÃ© dans chaque fiche de poste",
      "Ã‰tablir une chaÃ®ne de remplacement pour les absences critiques",
      "Communiquer les rÃ´les et responsabilitÃ©s lors des revues annuelles"
    ],
    defaultSteps: [
      { title: "Inventaire des rÃ´les", desc: "Lister toutes les fonctions sensibles", completed: false },
      { title: "RÃ©daction matrice", desc: "CrÃ©er la matrice RACI sÃ©curitÃ©", completed: false },
      { title: "Validation RH", desc: "IntÃ©grer dans les fiches de poste", completed: false },
      { title: "Communication", desc: "PrÃ©senter en rÃ©union gÃ©nÃ©rale", completed: false }
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
      "Former les managers Ã  leurs responsabilitÃ©s sÃ©curitÃ©",
      "Inclure des objectifs sÃ©curitÃ© dans les OKR des managers",
      "Organiser des comitÃ©s de direction sÃ©curitÃ© trimestriels",
      "Mettre en place un reporting sÃ©curitÃ© mensuel pour la direction",
      "Sanctionner le non-respect des politiques par les Ã©quipes"
    ],
    defaultSteps: [
      { title: "Sensibilisation", desc: "Former les managers Ã  la sÃ©curitÃ©", completed: false },
      { title: "Objectifs", desc: "DÃ©finir des KPI sÃ©curitÃ© pour chaque manager", completed: false },
      { title: "Reporting", desc: "Mettre en place les tableaux de bord", completed: false },
      { title: "Suivi", desc: "Revue trimestrielle des rÃ©sultats", completed: false }
    ]
  },
  'A.5.5': {
    recommendations: [
      "Ã‰tablir une liste des autoritÃ©s compÃ©tentes (CNIL, ANSSI, police, etc.)",
      "DÃ©signer un correspondant officiel pour les contacts avec les autoritÃ©s",
      "Documenter les procÃ©dures de signalement d'incidents aux autoritÃ©s",
      "Maintenir Ã  jour les coordonnÃ©es et les obligations de signalement",
      "Organiser une rÃ©union annuelle avec les autoritÃ©s locales"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les autoritÃ©s pertinentes", completed: false },
      { title: "Nomination", desc: "DÃ©signer le correspondant autoritÃ©s", completed: false },
      { title: "ProcÃ©dure", desc: "RÃ©diger les procÃ©dures de contact", completed: false },
      { title: "Test", desc: "Simuler un signalement d'incident", completed: false }
    ]
  },
  'A.5.6': {
    recommendations: [
      "Identifier les groupes d'intÃ©rÃªt spÃ©ciaux (Clusir, FIRST, etc.)",
      "AdhÃ©rer Ã  au moins un forum professionnel sÃ©curitÃ©",
      "DÃ©signer des reprÃ©sentants pour participer aux rÃ©unions",
      "Diffuser les bonnes pratiques issues des groupes Ã  l'organisation",
      "Participer activement aux groupes de travail sectoriels"
    ],
    defaultSteps: [
      { title: "Recherche", desc: "Identifier les groupes pertinents", completed: false },
      { title: "AdhÃ©sion", desc: "Soumettre les demandes d'adhÃ©sion", completed: false },
      { title: "Participation", desc: "Assister aux premiÃ¨res rÃ©unions", completed: false },
      { title: "Retour", desc: "SynthÃ©tiser et diffuser les informations", completed: false }
    ]
  },
  'A.5.7': {
    recommendations: [
      "Mettre en place une veille sur les menaces (flux RSS, CERT, newsletters)",
      "Abonner Ã  des services de renseignement sur les menaces (ISAC)",
      "Analyser mensuellement les menaces pertinentes pour l'activitÃ©",
      "Partager les renseignements avec les Ã©quipes concernÃ©es",
      "Ã‰tablir un tableau de bord des menaces actives"
    ],
    defaultSteps: [
      { title: "Sources", desc: "Identifier les sources de renseignement", completed: false },
      { title: "Abonnements", desc: "S'abonner aux services", completed: false },
      { title: "Processus", desc: "DÃ©finir le cycle d'analyse", completed: false },
      { title: "Dashboard", desc: "CrÃ©er le tableau de bord", completed: false }
    ]
  },
  'A.5.8': {
    recommendations: [
      "IntÃ©grer un rÃ©fÃ©rent sÃ©curitÃ© dans chaque projet",
      "RÃ©aliser une analyse des risques sÃ©curitÃ© en phase d'initiation",
      "Inclure des critÃ¨res sÃ©curitÃ© dans les livrables de projet",
      "Planifier des revues sÃ©curitÃ© aux jalons clÃ©s du projet",
      "BudgÃ©ter les actions sÃ©curitÃ© dÃ¨s le lancement du projet"
    ],
    defaultSteps: [
      { title: "Template", desc: "CrÃ©er un modÃ¨le d'analyse sÃ©curitÃ© projet", completed: false },
      { title: "Formation", desc: "Former les chefs de projet", completed: false },
      { title: "Processus", desc: "IntÃ©grer dans la mÃ©thodologie projet", completed: false },
      { title: "Pilote", desc: "Tester sur un projet existant", completed: false }
    ]
  },
  'A.5.9': {
    recommendations: [
      "DÃ©ployer un outil CMDB pour l'inventaire automatisÃ©",
      "Nommer un propriÃ©taire pour chaque actif inventoriÃ©",
      "Scanner le rÃ©seau mensuellement pour dÃ©tecter les actifs non rÃ©fÃ©rencÃ©s",
      "Inclure les actifs cloud et SaaS dans l'inventaire",
      "Lier l'inventaire au processus d'onboarding/offboarding"
    ],
    defaultSteps: [
      { title: "Outil", desc: "SÃ©lectionner et dÃ©ployer un CMDB", completed: false },
      { title: "DÃ©couverte", desc: "Scanner l'existant", completed: false },
      { title: "Attribution", desc: "Nommer les propriÃ©taires", completed: false },
      { title: "Maintenance", desc: "Mettre en place la mise Ã  jour continue", completed: false }
    ]
  },
  'A.5.10': {
    recommendations: [
      "RÃ©diger une charte d'utilisation acceptable des moyens informatiques",
      "Faire signer la charte par tous les employÃ©s annuellement",
      "Interdire explicitement les usages personnels abusifs",
      "Former les utilisateurs sur les rÃ¨gles d'utilisation",
      "Mettre en place des contrÃ´les techniques (filtrage web, DLP)"
    ],
    defaultSteps: [
      { title: "RÃ©daction", desc: "Ã‰crire la charte d'utilisation", completed: false },
      { title: "Validation", desc: "Faire valider par le juridique", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "ContrÃ´les", desc: "Mettre en place les filtrages", completed: false }
    ]
  },
  'A.5.11': {
    recommendations: [
      "Formaliser une procÃ©dure de retour d'actifs dans le manuel RH",
      "CrÃ©er une checklist de dÃ©part Ã  remplir par le manager",
      "Verrouiller les comptes le jour du dÃ©part",
      "Utiliser un systÃ¨me de gestion des actifs pour tracer les retours",
      "PrÃ©voir des pÃ©nalitÃ©s pour non-retour dans les contrats"
    ],
    defaultSteps: [
      { title: "ProcÃ©dure", desc: "RÃ©diger la procÃ©dure de retour", completed: false },
      { title: "Checklist", desc: "CrÃ©er la checklist dÃ©part", completed: false },
      { title: "Formation", desc: "Former les managers", completed: false },
      { title: "Audit", desc: "VÃ©rifier l'application sur les derniers dÃ©parts", completed: false }
    ]
  },
  'A.5.12': {
    recommendations: [
      "DÃ©finir un schÃ©ma de classification Ã  3 ou 4 niveaux (Public, Interne, Confidentiel, Secret)",
      "Nommer des responsables de classification par dÃ©partement",
      "Documenter les critÃ¨res de classification pour chaque niveau",
      "Former tous les employÃ©s Ã  la classification",
      "RÃ©viser la classification annuellement"
    ],
    defaultSteps: [
      { title: "SchÃ©ma", desc: "DÃ©finir les niveaux et critÃ¨res", completed: false },
      { title: "Validation", desc: "Valider avec la direction", completed: false },
      { title: "Formation", desc: "Former tous les employÃ©s", completed: false },
      { title: "DÃ©ploiement", desc: "Classifier les actifs existants", completed: false }
    ]
  },
  'A.5.13': {
    recommendations: [
      "DÃ©finir des rÃ¨gles d'Ã©tiquetage pour chaque niveau de classification",
      "Utiliser des mÃ©tadonnÃ©es dans les fichiers Office pour l'Ã©tiquetage",
      "Apposer des mentions de confidentialitÃ© sur les documents papier",
      "Automatiser l'Ã©tiquetage via des solutions DLP",
      "VÃ©rifier la cohÃ©rence de l'Ã©tiquetage lors des audits"
    ],
    defaultSteps: [
      { title: "RÃ¨gles", desc: "DÃ©finir les rÃ¨gles d'Ã©tiquetage", completed: false },
      { title: "Outil", desc: "SÃ©lectionner une solution d'Ã©tiquetage", completed: false },
      { title: "DÃ©ploiement", desc: "Configurer l'Ã©tiquetage automatique", completed: false },
      { title: "ContrÃ´le", desc: "Auditer la conformitÃ©", completed: false }
    ]
  },
  'A.5.14': {
    recommendations: [
      "Chiffrer systÃ©matiquement les emails contenant des donnÃ©es sensibles",
      "Utiliser un outil de transfert sÃ©curisÃ© (SFTP, Kiteworks)",
      "Signer des accords de confidentialitÃ© avec les partenaires",
      "Interdire le transfert de donnÃ©es sensibles via clÃ©s USB",
      "Journaliser tous les transferts de donnÃ©es externes"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier tous les flux de transfert", completed: false },
      { title: "SÃ©curisation", desc: "Mettre en place les solutions de transfert sÃ©curisÃ©", completed: false },
      { title: "Accords", desc: "Faire signer les NDA", completed: false },
      { title: "ContrÃ´le", desc: "Mettre en place la journalisation", completed: false }
    ]
  },
  'A.5.15': {
    recommendations: [
      "Appliquer strictement le principe du moindre privilÃ¨ge (Need-to-know)",
      "RÃ©viser les droits d'accÃ¨s de tous les utilisateurs chaque trimestre",
      "DÃ©sactiver systÃ©matiquement les comptes des sortants le jour J",
      "GÃ©nÃ©raliser l'authentification multi-facteurs (MFA) pour tous les accÃ¨s",
      "Tenir un registre d'inventaire Ã  jour de tous les privilÃ¨ges admin"
    ],
    defaultSteps: [
      { title: "Audit initial", desc: "Lister tous les accÃ¨s actifs", completed: false },
      { title: "Nettoyage", desc: "Supprimer les comptes inutilisÃ©s", completed: false },
      { title: "MFA", desc: "DÃ©ployer l'authentification multi-facteurs", completed: false },
      { title: "Revue pÃ©riodique", desc: "Mettre en place la rÃ©vision trimestrielle", completed: false }
    ]
  },
  'A.5.16': {
    recommendations: [
      "Centraliser la gestion des identitÃ©s dans un annuaire (AD, LDAP)",
      "Automatiser la crÃ©ation/suppression des comptes via le SIRH",
      "ImplÃ©menter un processus de revue des identitÃ©s dormantes",
      "Lier l'identitÃ© numÃ©rique Ã  l'identitÃ© rÃ©elle (carte de visite)",
      "Mettre en place un SSO pour simplifier la gestion"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Inventorier toutes les identitÃ©s", completed: false },
      { title: "Centralisation", desc: "Choisir un annuaire central", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "SSO", desc: "DÃ©ployer l'authentification unique", completed: false }
    ]
  },
  'A.5.17': {
    recommendations: [
      "Imposer des mots de passe robustes (12+ caractÃ¨res, complexitÃ©)",
      "Activer la politique d'expiration des mots de passe (90 jours max)",
      "Proscrire la rÃ©utilisation des 5 derniers mots de passe",
      "DÃ©ployer un gestionnaire d'entreprise pour les comptes partagÃ©s",
      "Verrouiller le compte aprÃ¨s 5 Ã©checs consÃ©cutifs"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir la politique MDP", completed: false },
      { title: "Configuration", desc: "Configurer l'AD/GPO", completed: false },
      { title: "Formation", desc: "Former les utilisateurs", completed: false },
      { title: "ContrÃ´le", desc: "VÃ©rifier la conformitÃ©", completed: false }
    ]
  },
  'A.5.18': {
    recommendations: [
      "Automatiser la rÃ©vocation des droits lors des dÃ©parts",
      "Mettre en place un workflow d'approbation pour les accÃ¨s privilÃ©giÃ©s",
      "RÃ©aliser une revue des droits d'accÃ¨s semestrielle",
      "Utiliser des groupes AD pour gÃ©rer les droits par profil",
      "Journaliser toutes les attributions de droits"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃ©finir le workflow d'approbation", completed: false },
      { title: "Groupes", desc: "Structurer les groupes d'accÃ¨s", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "Revue", desc: "Planifier la revue semestrielle", completed: false }
    ]
  },
  'A.5.19': {
    recommendations: [
      "Ã‰valuer la sÃ©curitÃ© des fournisseurs avant signature",
      "Inclure des clauses sÃ©curitÃ© dans tous les contrats fournisseurs",
      "Classer les fournisseurs par niveau de criticitÃ©",
      "RÃ©aliser des audits fournisseurs annuels pour les plus critiques",
      "Maintenir une base de donnÃ©es des Ã©valuations fournisseurs"
    ],
    defaultSteps: [
      { title: "CritÃ¨res", desc: "DÃ©finir les critÃ¨res d'Ã©valuation", completed: false },
      { title: "Questionnaire", desc: "CrÃ©er un questionnaire sÃ©curitÃ©", completed: false },
      { title: "Base", desc: "CrÃ©er la base fournisseurs", completed: false },
      { title: "Audits", desc: "Planifier les audits", completed: false }
    ]
  },
  'A.5.20': {
    recommendations: [
      "Faire signer une charte sÃ©curitÃ© aux prestataires externes",
      "Exiger la certification ISO 27001 des fournisseurs critiques",
      "DÃ©finir des pÃ©nalitÃ©s pour non-respect de la sÃ©curitÃ©",
      "Inclure un droit d'audit dans les contrats",
      "Limiter contractuellement la sous-traitance non autorisÃ©e"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Faire valider les clauses juridiquement", completed: false },
      { title: "Signature", desc: "Faire signer les accords existants", completed: false },
      { title: "Base", desc: "Centraliser les contrats", completed: false },
      { title: "Suivi", desc: "Mettre en place le suivi des Ã©chÃ©ances", completed: false }
    ]
  },
  'A.5.21': {
    recommendations: [
      "Exiger des attestations de sÃ©curitÃ© des sous-traitants",
      "Limiter la profondeur de la chaÃ®ne de sous-traitance",
      "Auditer les fournisseurs de rang 2 pour les services critiques",
      "Documenter la chaÃ®ne d'approvisionnement complÃ¨te",
      "Mettre en place des clauses de cascade pour la sÃ©curitÃ©"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Mapper la chaÃ®ne d'approvisionnement", completed: false },
      { title: "Exigences", desc: "DÃ©finir les exigences pour chaque niveau", completed: false },
      { title: "Audits", desc: "Auditer les sous-traitants critiques", completed: false },
      { title: "Tableau", desc: "CrÃ©er un tableau de bord risques", completed: false }
    ]
  },
  'A.5.22': {
    recommendations: [
      "Mettre en place des revues de service trimestrielles",
      "Suivre les indicateurs de performance sÃ©curitÃ© des fournisseurs",
      "Documenter les changements de pÃ©rimÃ¨tre des fournisseurs",
      "RÃ©aliser un audit annuel des services externalisÃ©s",
      "PrÃ©voir un plan de sortie pour chaque service critique"
    ],
    defaultSteps: [
      { title: "KPI", desc: "DÃ©finir les KPI Ã  suivre", completed: false },
      { title: "Revues", desc: "Planifier les revues", completed: false },
      { title: "Audit", desc: "Programmer l'audit annuel", completed: false },
      { title: "Plans sortie", desc: "RÃ©diger les plans de sortie", completed: false }
    ]
  },
  'A.5.23': {
    recommendations: [
      "Ã‰valuer la sÃ©curitÃ© des fournisseurs cloud (CSPM)",
      "DÃ©finir un modÃ¨le de responsabilitÃ© partagÃ©e clair",
      "Chiffrer les donnÃ©es avant stockage cloud",
      "Sauvegarder hors cloud les donnÃ©es critiques",
      "PrÃ©voir une stratÃ©gie de multi-cloud pour Ã©viter le lock-in"
    ],
    defaultSteps: [
      { title: "Ã‰valuation", desc: "Auditer les fournisseurs cloud", completed: false },
      { title: "Chiffrement", desc: "Mettre en place le chiffrement", completed: false },
      { title: "Sauvegardes", desc: "Configurer les backups externes", completed: false },
      { title: "Documentation", desc: "Documenter le RACI cloud", completed: false }
    ]
  },
  'A.5.24': {
    recommendations: [
      "CrÃ©er une procÃ©dure formelle de gestion des incidents",
      "DÃ©signer une Ã©quipe CERT/CSIRT interne",
      "Mettre en place un outil de ticketing pour les incidents",
      "DÃ©finir des niveaux de criticitÃ© et des SLAs de rÃ©ponse",
      "Organiser des exercices de simulation d'incident"
    ],
    defaultSteps: [
      { title: "ProcÃ©dure", desc: "RÃ©diger la PGI", completed: false },
      { title: "Ã‰quipe", desc: "Nommer l'Ã©quipe incident", completed: false },
      { title: "Outil", desc: "DÃ©ployer un outil de ticketing", completed: false },
      { title: "Exercice", desc: "Organiser un premier exercice", completed: false }
    ]
  },
  'A.5.25': {
    recommendations: [
      "Former les Ã©quipes Ã  la qualification des Ã©vÃ©nements",
      "DÃ©finir une matrice de classification des Ã©vÃ©nements",
      "Mettre en place un seuil de dÃ©clenchement automatisÃ©",
      "Documenter les critÃ¨res de dÃ©cision pour chaque type d'Ã©vÃ©nement",
      "RÃ©viser trimestriellement les critÃ¨res de classification"
    ],
    defaultSteps: [
      { title: "Matrice", desc: "CrÃ©er la matrice de classification", completed: false },
      { title: "Formation", desc: "Former les analystes", completed: false },
      { title: "Seuils", desc: "Configurer les alertes", completed: false },
      { title: "Revue", desc: "Valider avec l'Ã©quipe", completed: false }
    ]
  },
  'A.5.26': {
    recommendations: [
      "Ã‰tablir des playbooks par type d'incident (ransomware, fuite, etc.)",
      "Mettre en place des runbooks d'escalade",
      "Former les Ã©quipes Ã  la rÃ©ponse sur incident",
      "Documenter les contacts d'urgence (lÃ©gal, com, technique)",
      "RÃ©aliser un debriefing aprÃ¨s chaque incident majeur"
    ],
    defaultSteps: [
      { title: "Playbooks", desc: "RÃ©diger les playbooks", completed: false },
      { title: "Contacts", desc: "CrÃ©er l'annuaire d'urgence", completed: false },
      { title: "Formation", desc: "Former Ã  la rÃ©ponse", completed: false },
      { title: "Simulation", desc: "Tester les playbooks", completed: false }
    ]
  },
  'A.5.27': {
    recommendations: [
      "Organiser un REX (Retour d'ExpÃ©rience) aprÃ¨s chaque incident",
      "Mettre Ã  jour les procÃ©dures suite aux incidents",
      "Partager les leÃ§ons apprises avec toutes les Ã©quipes",
      "Maintenir une base de connaissances des incidents",
      "IntÃ©grer les enseignements dans la formation sÃ©curitÃ©"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃ©finir le processus REX", completed: false },
      { title: "Base", desc: "CrÃ©er la base de connaissances", completed: false },
      { title: "Mise Ã  jour", desc: "RÃ©viser les procÃ©dures", completed: false },
      { title: "Diffusion", desc: "Partager les leÃ§ons", completed: false }
    ]
  },
  'A.5.28': {
    recommendations: [
      "DÃ©finir une procÃ©dure de chaÃ®ne de custody",
      "Former les Ã©quipes Ã  la collecte forensique",
      "Mettre Ã  disposition une mallette de collecte",
      "Documenter les types de preuves admissibles",
      "Travailler avec un expert lÃ©gal pour la validitÃ© des preuves"
    ],
    defaultSteps: [
      { title: "ProcÃ©dure", desc: "RÃ©diger la procÃ©dure de preuves", completed: false },
      { title: "Formation", desc: "Former les rÃ©pondants", completed: false },
      { title: "Kit", desc: "PrÃ©parer le kit de collecte", completed: false },
      { title: "Test", desc: "Simuler une collecte", completed: false }
    ]
  },
  'A.5.29': {
    recommendations: [
      "IntÃ©grer la sÃ©curitÃ© dans le PCA/PRA existant",
      "Identifier les actifs critiques Ã  protÃ©ger en prioritÃ©",
      "DÃ©finir des modes dÃ©gradÃ©s sÃ©curisÃ©s",
      "Tester la sÃ©curitÃ© en mode dÃ©gradÃ© lors des exercices",
      "Maintenir des documents procÃ©duraux hors ligne"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier les risques de disruption", completed: false },
      { title: "Plan", desc: "IntÃ©grer sÃ©curitÃ© au PCA", completed: false },
      { title: "Tests", desc: "Tester en mode dÃ©gradÃ©", completed: false },
      { title: "Mise Ã  jour", desc: "RÃ©viser le PCA", completed: false }
    ]
  },
  'A.5.30': {
    recommendations: [
      "DÃ©finir des objectifs de temps (RTO) et de perte (RPO) par mÃ©tier",
      "Tester la restauration des sauvegardes critiques chaque mois",
      "Maintenir une copie des sauvegardes hors ligne (Air-gapped)",
      "Documenter les procÃ©dures de bascule en mode secours",
      "RÃ©aliser un exercice de gestion de crise simulant une panne"
    ],
    defaultSteps: [
      { title: "Analyse d'impact", desc: "DÃ©finir les prioritÃ©s de reprise", completed: false },
      { title: "Sauvegardes", desc: "Configurer les sauvegardes", completed: false },
      { title: "Test restauration", desc: "VÃ©rifier l'intÃ©gritÃ© des backups", completed: false },
      { title: "Exercice", desc: "Simuler un basculement", completed: false }
    ]
  },
  'A.5.31': {
    recommendations: [
      "Maintenir un registre des obligations lÃ©gales et rÃ©glementaires",
      "Nommer un rÃ©fÃ©rent conformitÃ© (DPO, RSSI)",
      "RÃ©aliser une veille juridique mensuelle",
      "Documenter les actions de mise en conformitÃ©",
      "PrÃ©voir des audits de conformitÃ© externes"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les obligations", completed: false },
      { title: "Nomination", desc: "DÃ©signer les rÃ©fÃ©rents", completed: false },
      { title: "Veille", desc: "Mettre en place la veille", completed: false },
      { title: "Audit", desc: "Planifier l'audit conformitÃ©", completed: false }
    ]
  },
  'A.5.32': {
    recommendations: [
      "DÃ©ployer des solutions anti-piratage logiciel",
      "Signer des accords de licence avec tous les Ã©diteurs",
      "RÃ©aliser un inventaire complet des licences logicielles",
      "Former les employÃ©s sur les droits d'auteur",
      "Mettre en place une politique d'utilisation des logiciels libres"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister tous les logiciels", completed: false },
      { title: "Licences", desc: "VÃ©rifier les licences", completed: false },
      { title: "Politique", desc: "RÃ©diger la politique IP", completed: false },
      { title: "Formation", desc: "Former les Ã©quipes", completed: false }
    ]
  },
  'A.5.33': {
    recommendations: [
      "DÃ©finir une politique de conservation des archives",
      "Mettre en place un systÃ¨me de GED sÃ©curisÃ©",
      "ProtÃ©ger les archives physiques (armoires fermÃ©es, alarmes)",
      "Chiffrer les archives numÃ©riques sensibles",
      "RÃ©aliser des sauvegardes des archives critiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir les durÃ©es de conservation", completed: false },
      { title: "GED", desc: "DÃ©ployer une GED", completed: false },
      { title: "SÃ©curisation", desc: "ProtÃ©ger les archives", completed: false },
      { title: "Backups", desc: "Sauvegarder les archives", completed: false }
    ]
  },
  'A.5.34': {
    recommendations: [
      "Nommer un DPO (DÃ©lÃ©guÃ© Ã  la Protection des DonnÃ©es)",
      "Tenir un registre des traitements RGPD",
      "RÃ©aliser des AIPD pour les traitements sensibles",
      "Mettre en place les droits des personnes (accÃ¨s, rectification, effacement)",
      "Documenter les violations de donnÃ©es"
    ],
    defaultSteps: [
      { title: "DPO", desc: "Nommer le DPO", completed: false },
      { title: "Registre", desc: "CrÃ©er le registre des traitements", completed: false },
      { title: "Droits", desc: "Mettre en place les procÃ©dures", completed: false },
      { title: "AIPD", desc: "RÃ©aliser les analyses d'impact", completed: false }
    ]
  },
  'A.5.35': {
    recommendations: [
      "Planifier un audit interne annuel",
      "Faire rÃ©aliser un audit externe tous les 2 ans",
      "Utiliser des auditeurs certifiÃ©s (Lead Auditor)",
      "Documenter un plan d'audit et les pÃ©rimÃ¨tres",
      "Traiter et suivre les non-conformitÃ©s identifiÃ©es"
    ],
    defaultSteps: [
      { title: "Planification", desc: "Ã‰tablir le plan d'audit", completed: false },
      { title: "Audit interne", desc: "RÃ©aliser l'audit", completed: false },
      { title: "Actions", desc: "Traiter les non-conformitÃ©s", completed: false },
      { title: "Audit externe", desc: "Planifier l'audit externe", completed: false }
    ]
  },
  'A.5.36': {
    recommendations: [
      "Mettre en place des contrÃ´les de conformitÃ© automatisÃ©s",
      "RÃ©aliser des campagnes de rappel des rÃ¨gles",
      "Auditer alÃ©atoirement la conformitÃ© des utilisateurs",
      "DÃ©finir des sanctions pour non-respect",
      "IntÃ©grer la conformitÃ© dans les entretiens annuels"
    ],
    defaultSteps: [
      { title: "ContrÃ´les", desc: "DÃ©finir les contrÃ´les", completed: false },
      { title: "Campagne", desc: "Lancer une campagne de sensibilisation", completed: false },
      { title: "Audits", desc: "RÃ©aliser des audits surprise", completed: false },
      { title: "Sanctions", desc: "Appliquer le disciplinaire", completed: false }
    ]
  },
  'A.5.37': {
    recommendations: [
      "Documenter toutes les procÃ©dures opÃ©rationnelles critiques",
      "Centraliser dans un wiki ou une base documentaire",
      "Versionner et tracer les modifications",
      "Former les Ã©quipes Ã  l'utilisation des procÃ©dures",
      "RÃ©viser annuellement les procÃ©dures"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les procÃ©dures Ã  documenter", completed: false },
      { title: "RÃ©daction", desc: "Ã‰crire les procÃ©dures", completed: false },
      { title: "Validation", desc: "Faire valider", completed: false },
      { title: "Centralisation", desc: "Publier sur le wiki", completed: false }
    ]
  },
  // ==================== DOMAINE PERSONNES (A.6.1 Ã  A.6.8) ====================
  'A.6.1': {
    recommendations: [
      "RÃ©aliser des vÃ©rifications des antÃ©cÃ©dents pour tous les postes sensibles",
      "VÃ©rifier les rÃ©fÃ©rences professionnelles des candidats",
      "Exiger un extrait de casier judiciaire pour les postes critiques",
      "Renouveler les vÃ©rifications pÃ©riodiquement (tous les 3 ans)",
      "Documenter les vÃ©rifications effectuÃ©es"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir la politique de vÃ©rification", completed: false },
      { title: "Processus", desc: "IntÃ©grer au process RH", completed: false },
      { title: "Fournisseur", desc: "Choisir un prestataire", completed: false },
      { title: "DÃ©ploiement", desc: "Lancer les premiÃ¨res vÃ©rifications", completed: false }
    ]
  },
  'A.6.2': {
    recommendations: [
      "Inclure une clause de confidentialitÃ© dans tous les contrats",
      "DÃ©finir les obligations sÃ©curitÃ© dans les avenants",
      "Faire signer une charte informatique en annexe",
      "PrÃ©voir des sanctions pour non-respect",
      "Mettre Ã  jour les contrats lors des changements lÃ©gaux"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "RÃ©diger les clauses sÃ©curitÃ©", completed: false },
      { title: "Validation", desc: "Faire valider par juridique", completed: false },
      { title: "Signature", desc: "Faire signer aux employÃ©s", completed: false },
      { title: "Centralisation", desc: "Archiver les contrats", completed: false }
    ]
  },
  'A.6.3': {
    recommendations: [
      "Organiser une formation sÃ©curitÃ© annuelle obligatoire",
      "DÃ©ployer des campagnes de phishing simulÃ©",
      "CrÃ©er un e-learning de sensibilisation",
      "Diffuser des newsletters sÃ©curitÃ© mensuelles",
      "Former spÃ©cifiquement les Ã©quipes sensibles (IT, finance, RH)"
    ],
    defaultSteps: [
      { title: "Programme", desc: "DÃ©finir le programme de formation", completed: false },
      { title: "E-learning", desc: "CrÃ©er ou acheter des modules", completed: false },
      { title: "Phishing", desc: "Lancer des campagnes simulÃ©es", completed: false },
      { title: "Suivi", desc: "Mesurer l'efficacitÃ©", completed: false }
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
      "Maintenir des obligations de confidentialitÃ© post-dÃ©part",
      "Informer les employÃ©s des obligations persistantes",
      "PrÃ©voir des clauses de non-concurrence si nÃ©cessaire",
      "Rappeler les obligations lors de l'entretien de sortie",
      "Surveiller le respect aprÃ¨s dÃ©part pour les postes sensibles"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "VÃ©rifier les clauses post-emploi", completed: false },
      { title: "Communication", desc: "Informer lors du dÃ©part", completed: false },
      { title: "Documentation", desc: "Archiver les rappels", completed: false },
      { title: "Suivi", desc: "Mettre en place des rappels", completed: false }
    ]
  },
  'A.6.6': {
    recommendations: [
      "Faire signer un NDA Ã  tous les employÃ©s et prestataires",
      "RÃ©viser les NDA tous les 3 ans",
      "Adapter les NDA selon les niveaux d'accÃ¨s",
      "Centraliser tous les NDA signÃ©s",
      "PrÃ©voir des pÃ©nalitÃ©s financiÃ¨res pour violation"
    ],
    defaultSteps: [
      { title: "ModÃ¨le", desc: "CrÃ©er un modÃ¨le de NDA", completed: false },
      { title: "Validation", desc: "Faire valider juridiquement", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "Centralisation", desc: "Archiver dans un coffre", completed: false }
    ]
  },
  'A.6.7': {
    recommendations: [
      "DÃ©ployer un VPN obligatoire pour le tÃ©lÃ©travail",
      "Chiffrer les postes en tÃ©lÃ©travail (BitLocker, FileVault)",
      "Interdire le travail sur rÃ©seaux publics non sÃ©curisÃ©s",
      "Mettre en place une politique BYOD claire",
      "Former les tÃ©lÃ©travailleurs aux bonnes pratiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "RÃ©diger la politique tÃ©lÃ©travail", completed: false },
      { title: "VPN", desc: "DÃ©ployer et configurer le VPN", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement disque", completed: false },
      { title: "Formation", desc: "Former les tÃ©lÃ©travailleurs", completed: false }
    ]
  },
  'A.6.8': {
    recommendations: [
      "Mettre en place une adresse email dÃ©diÃ©e (signalement@)",
      "Garantir l'anonymat des signalements",
      "ProtÃ©ger les lanceurs d'alerte contre les reprÃ©sailles",
      "Communiquer sur le dispositif de signalement",
      "Traiter tous les signalements dans un dÃ©lai maximal de 72h"
    ],
    defaultSteps: [
      { title: "Dispositif", desc: "CrÃ©er le canal de signalement", completed: false },
      { title: "ProcÃ©dure", desc: "DÃ©finir le processus de traitement", completed: false },
      { title: "Communication", desc: "Informer les employÃ©s", completed: false },
      { title: "Formation", desc: "Former les gestionnaires", completed: false }
    ]
  },
  // ==================== DOMAINE PHYSIQUE (A.7.1 Ã  A.7.14) ====================
  'A.7.1': {
    recommendations: [
      "DÃ©limiter clairement les zones sÃ©curisÃ©es (data center, serveurs)",
      "Installer des barriÃ¨res physiques (murs, clÃ´tures)",
      "MatÃ©rialiser le pÃ©rimÃ¨tre par une signalÃ©tique visible",
      "ContrÃ´ler les accÃ¨s aux zones sensibles",
      "Maintenir un registre des entrÃ©es dans les zones critiques"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Identifier les zones sensibles", completed: false },
      { title: "MatÃ©rialisation", desc: "Installer signalÃ©tique et barriÃ¨res", completed: false },
      { title: "ContrÃ´le", desc: "Mettre en place le contrÃ´le d'accÃ¨s", completed: false },
      { title: "Registre", desc: "CrÃ©er le registre des entrÃ©es", completed: false }
    ]
  },
  'A.7.2': {
    recommendations: [
      "Installer un systÃ¨me de contrÃ´le d'accÃ¨s (badge, biomÃ©trie)",
      "Mettre en place des sas d'entrÃ©e pour les zones sensibles",
      "Former les employÃ©s Ã  ne pas laisser entrer d'inconnus",
      "DÃ©sactiver les badges des dÃ©parts immÃ©diatement",
      "Auditer les logs d'accÃ¨s mensuellement"
    ],
    defaultSteps: [
      { title: "SystÃ¨me", desc: "Choisir et installer le contrÃ´le d'accÃ¨s", completed: false },
      { title: "Badges", desc: "Distribuer les badges", completed: false },
      { title: "ProcÃ©dure", desc: "DÃ©finir la gestion des badges", completed: false },
      { title: "Audit", desc: "Mettre en place la revue des logs", completed: false }
    ]
  },
  'A.7.3': {
    recommendations: [
      "Fermer Ã  clÃ© les bureaux et salles techniques",
      "Installer des serrures Ã©lectroniques avec traÃ§abilitÃ©",
      "ProtÃ©ger les baies de brassage dans des armoires fermÃ©es",
      "Surveiller les zones sensibles par vidÃ©o",
      "Maintenir une liste des personnes autorisÃ©es par zone"
    ],
    defaultSteps: [
      { title: "SÃ©curisation", desc: "Installer serrures et armoires", completed: false },
      { title: "Zonage", desc: "DÃ©finir les niveaux d'accÃ¨s", completed: false },
      { title: "CamÃ©ras", desc: "Installer la vidÃ©osurveillance", completed: false },
      { title: "ContrÃ´le", desc: "VÃ©rifier l'application", completed: false }
    ]
  },
  'A.7.4': {
    recommendations: [
      "DÃ©ployer un systÃ¨me de vidÃ©osurveillance",
      "Conserver les images 30 jours minimum",
      "Surveiller les alarmes intrusion 24/7",
      "DÃ©signer un responsable de la supervision",
      "RÃ©aliser des tests hebdomadaires des alarmes"
    ],
    defaultSteps: [
      { title: "Installation", desc: "Pose des camÃ©ras", completed: false },
      { title: "Centralisation", desc: "Mettre en place la supervision", completed: false },
      { title: "ProcÃ©dure", desc: "DÃ©finir la rÃ©ponse aux alarmes", completed: false },
      { title: "Tests", desc: "Programmer les tests", completed: false }
    ]
  },
  'A.7.5': {
    recommendations: [
      "ProtÃ©ger contre l'incendie (dÃ©tecteurs, extincteurs)",
      "Installer des parafoudres et onduleurs",
      "PrÃ©voir une climatisation pour les serveurs",
      "Ã‰viter les zones inondables pour les Ã©quipements",
      "RÃ©aliser un audit des risques environnementaux"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Identifier les risques", completed: false },
      { title: "Ã‰quipements", desc: "Installer protections", completed: false },
      { title: "Maintenance", desc: "Planifier la maintenance", completed: false },
      { title: "Tests", desc: "Tester les Ã©quipements", completed: false }
    ]
  },
  'A.7.6': {
    recommendations: [
      "Afficher les rÃ¨gles de sÃ©curitÃ© dans les zones",
      "Accompagner les visiteurs en zone sensible",
      "Interdire les photos dans les zones sÃ©curisÃ©es",
      "Exiger le port de badge visible",
      "DÃ©briefer les Ã©quipes aprÃ¨s chaque incident"
    ],
    defaultSteps: [
      { title: "RÃ¨gles", desc: "Afficher les consignes", completed: false },
      { title: "Visiteurs", desc: "DÃ©finir procÃ©dure d'accueil", completed: false },
      { title: "Formation", desc: "Former les Ã©quipes", completed: false },
      { title: "ContrÃ´le", desc: "Surveiller l'application", completed: false }
    ]
  },
  'A.7.7': {
    recommendations: [
      "Exiger l'extinction des Ã©crans en l'absence",
      "Ranger les documents sensibles dans des armoires fermÃ©es",
      "Interdire les documents papier sur les bureaux la nuit",
      "Utiliser des brouilleurs de confidentialitÃ© sur Ã©crans",
      "Nettoyer les imprimantes des documents sensibles"
    ],
    defaultSteps: [
      { title: "Politique", desc: "RÃ©diger la rÃ¨gle", completed: false },
      { title: "Sensibilisation", desc: "Former les employÃ©s", completed: false },
      { title: "Ã‰quipement", desc: "Fournir brouilleurs et armoires", completed: false },
      { title: "ContrÃ´le", desc: "Surveiller l'application", completed: false }
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
      "Chiffrer les ordinateurs portables utilisÃ©s hors site",
      "ProtÃ©ger les actifs transportÃ©s (valises sÃ©curisÃ©es)",
      "Assurer les actifs mobiles contre le vol",
      "Interdire le stockage de donnÃ©es sensibles hors site non chiffrÃ©es",
      "Suivre la localisation des actifs mobiles"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les actifs mobiles", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement", completed: false },
      { title: "Assurance", desc: "VÃ©rifier couverture", completed: false },
      { title: "TraÃ§abilitÃ©", desc: "Mettre en place suivi", completed: false }
    ]
  },
  'A.7.10': {
    recommendations: [
      "Classifier les supports selon sensibilitÃ©",
      "Chiffrer les supports amovibles",
      "DÃ©truire les supports par broyage ou incinÃ©ration",
      "Tenir un registre des supports sensibles",
      "Limiter l'utilisation des clÃ©s USB"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir gestion supports", completed: false },
      { title: "Chiffrement", desc: "DÃ©ployer solution", completed: false },
      { title: "Destruction", desc: "Choisir prestataire", completed: false },
      { title: "ContrÃ´le", desc: "Auditer utilisation", completed: false }
    ]
  },
  'A.7.11': {
    recommendations: [
      "Installer des onduleurs pour les Ã©quipements critiques",
      "PrÃ©voir des groupes Ã©lectrogÃ¨nes",
      "Surveiller la qualitÃ© d'alimentation Ã©lectrique",
      "Tester les onduleurs trimestriellement",
      "Maintenir des contrats de maintenance"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Identifier Ã©quipements critiques", completed: false },
      { title: "Onduleurs", desc: "Installer onduleurs", completed: false },
      { title: "Groupe", desc: "PrÃ©voir si nÃ©cessaire", completed: false },
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
      "Planifier une maintenance prÃ©ventive annuelle",
      "Signer des contrats de maintenance avec fournisseurs",
      "TraÃ§abilitÃ© des interventions",
      "VÃ©rifier les Ã©quipements aprÃ¨s maintenance",
      "Maintenir des piÃ¨ces de rechange critiques"
    ],
    defaultSteps: [
      { title: "Planning", desc: "Ã‰tablir planning maintenance", completed: false },
      { title: "Contrats", desc: "Signer contrats", completed: false },
      { title: "Registre", desc: "CrÃ©er registre interventions", completed: false },
      { title: "Rechanges", desc: "Stocker piÃ¨ces critiques", completed: false }
    ]
  },
  'A.7.14': {
    recommendations: [
      "Effacer sÃ©curisÃ© les disques avant rÃ©utilisation",
      "DÃ©truire physiquement les disques dÃ©fectueux",
      "Obtenir un certificat de destruction",
      "Suivre la traÃ§abilitÃ© des Ã©quipements Ã©liminÃ©s",
      "Utiliser des prestataires certifiÃ©s"
    ],
    defaultSteps: [
      { title: "ProcÃ©dure", desc: "DÃ©finir processus", completed: false },
      { title: "Outil", desc: "Choisir outil d'effacement", completed: false },
      { title: "Prestataire", desc: "SÃ©lectionner destructeur certifiÃ©", completed: false },
      { title: "TraÃ§abilitÃ©", desc: "Mettre en place registre", completed: false }
    ]
  },
  // ==================== DOMAINE TECHNOLOGIQUE (A.8.1 Ã  A.8.34) ====================
  'A.8.1': {
    recommendations: [
      "Chiffrer tous les postes de travail",
      "Activer le pare-feu local sur tous les postes",
      "DÃ©ployer un antivirus/EDR sur les postes",
      "Verrouiller automatiquement les postes aprÃ¨s 5 min",
      "Interdire l'installation de logiciels non approuvÃ©s"
    ],
    defaultSteps: [
      { title: "Baseline", desc: "DÃ©finir configuration sÃ©curisÃ©e", completed: false },
      { title: "Chiffrement", desc: "Activer BitLocker/FileVault", completed: false },
      { title: "EDR", desc: "DÃ©ployer solution", completed: false },
      { title: "GPO", desc: "Configurer verrouillage", completed: false }
    ]
  },
  'A.8.2': {
    recommendations: [
      "Utiliser des comptes d'administration dÃ©diÃ©s",
      "Imposer MFA pour tous les comptes privilÃ©giÃ©s",
      "Surveiller les actions des administrateurs",
      "RÃ©voquer les privilÃ¨ges aprÃ¨s 90 jours si non utilisÃ©s",
      "Utiliser un PAM (Privileged Access Management)"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister comptes privilÃ©giÃ©s", completed: false },
      { title: "PAM", desc: "DÃ©ployer solution PAM", completed: false },
      { title: "MFA", desc: "Activer MFA", completed: false },
      { title: "Surveillance", desc: "Mettre en place SIEM", completed: false }
    ]
  },
  'A.8.3': {
    recommendations: [
      "Appliquer le RBAC (Role-Based Access Control)",
      "RÃ©viser les accÃ¨s tous les 6 mois",
      "Utiliser des groupes de sÃ©curitÃ© AD",
      "Journaliser tous les accÃ¨s",
      "Mettre en place des workflows d'approbation"
    ],
    defaultSteps: [
      { title: "ModÃ¨le", desc: "DÃ©finir les rÃ´les", completed: false },
      { title: "Groupes", desc: "CrÃ©er groupes AD", completed: false },
      { title: "Migration", desc: "Passer au RBAC", completed: false },
      { title: "Revue", desc: "Programmer revues", completed: false }
    ]
  },
  'A.8.4': {
    recommendations: [
      "Utiliser un gestionnaire de versions (Git)",
      "Restreindre l'accÃ¨s en lecture seule",
      "Signer les commits avec GPG",
      "Scanner le code pour vulnÃ©rabilitÃ©s",
      "Sauvegarder le code source hors site"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir forge logicielle", completed: false },
      { title: "Permissions", desc: "Configurer ACLs", completed: false },
      { title: "Scan", desc: "IntÃ©grer SAST", completed: false },
      { title: "Backups", desc: "Configurer sauvegardes", completed: false }
    ]
  },
  'A.8.5': {
    recommendations: [
      "DÃ©ployer MFA sur tous les accÃ¨s externes",
      "Utiliser SSO avec MFA",
      "Interdire les mots de passe faibles",
      "Mettre en place la biomÃ©trie pour les postes critiques",
      "Verrouiller aprÃ¨s 5 Ã©checs"
    ],
    defaultSteps: [
      { title: "MFA", desc: "Choisir solution MFA", completed: false },
      { title: "DÃ©ploiement", desc: "DÃ©ployer sur tous les accÃ¨s", completed: false },
      { title: "Politique", desc: "DÃ©finir rÃ¨gles", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.6': {
    recommendations: [
      "Surveiller les ressources systÃ¨mes (CPU, RAM, disque)",
      "Planifier la capacitÃ© Ã  12 mois",
      "Mettre en place des alertes de saturation",
      "Dimensionner les environnements pour la croissance",
      "Automatiser l'ajustement de capacitÃ© (cloud)"
    ],
    defaultSteps: [
      { title: "MÃ©triques", desc: "DÃ©finir indicateurs", completed: false },
      { title: "Supervision", desc: "DÃ©ployer outils", completed: false },
      { title: "Seuils", desc: "Configurer alertes", completed: false },
      { title: "Plan", desc: "Ã‰tablir plan capacitÃ©", completed: false }
    ]
  },
  'A.8.7': {
    recommendations: [
      "DÃ©ployer un antivirus/EDR sur tous les postes",
      "Mettre Ã  jour automatiquement les signatures",
      "Configurer des analyses programmÃ©es",
      "Interdire l'exÃ©cution de macros Office",
      "Former aux risques de phishing"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir EDR", completed: false },
      { title: "DÃ©ploiement", desc: "Installer sur tous postes", completed: false },
      { title: "Configuration", desc: "Configurer politiques", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.8': {
    recommendations: [
      "Planifier des scans de vulnÃ©rabilitÃ©s automatiques chaque semaine",
      "DÃ©finir des dÃ©lais de correction (SLA) stricts selon la criticitÃ©",
      "Automatiser le dÃ©ploiement des correctifs (Patch Management)",
      "RÃ©aliser un test d'intrusion annuel par un prestataire externe",
      "Isoler du rÃ©seau les systÃ¨mes obsolÃ¨tes ne pouvant Ãªtre patchÃ©s"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir scanner vulnÃ©rabilitÃ©s", completed: false },
      { title: "Scan", desc: "Identifier les failles critiques", completed: false },
      { title: "Patching", desc: "Appliquer les correctifs", completed: false },
      { title: "Pentest", desc: "Planifier test intrusion", completed: false }
    ]
  },
  'A.8.9': {
    recommendations: [
      "Utiliser des outils de gestion de configuration (Ansible, Chef)",
      "Maintenir des baselines sÃ©curisÃ©es",
      "DÃ©tecter les dÃ©rives de configuration",
      "Automatiser la correction des configurations",
      "Versionner les configurations"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir outil IaC", completed: false },
      { title: "Baseline", desc: "DÃ©finir configurations sÃ©curisÃ©es", completed: false },
      { title: "DÃ©ploiement", desc: "Appliquer aux systÃ¨mes", completed: false },
      { title: "Surveillance", desc: "DÃ©tecter dÃ©rives", completed: false }
    ]
  },
  'A.8.10': {
    recommendations: [
      "DÃ©finir des durÃ©es de rÃ©tention prÃ©cises selon le RGPD",
      "Utiliser des outils d'effacement sÃ©curisÃ© certifiÃ©s",
      "DÃ©truire physiquement les disques durs dÃ©fectueux par broyage",
      "Mettre en place un script de purge automatique pour les logs",
      "RÃ©aliser des contrÃ´les inopinÃ©s pour vÃ©rifier la suppression"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir durÃ©es rÃ©tention", completed: false },
      { title: "Inventaire", desc: "Identifier les donnÃ©es hors dÃ©lais", completed: false },
      { title: "Purge", desc: "Effacement dÃ©finitif des supports", completed: false },
      { title: "ContrÃ´le", desc: "Auditer suppression", completed: false }
    ]
  },
  'A.8.11': {
    recommendations: [
      "Anonymiser les donnÃ©es en environnement de test",
      "Utiliser des donnÃ©es synthÃ©tiques quand possible",
      "Masquer les donnÃ©es sensibles dans les logs",
      "DÃ©ployer un outil de data masking",
      "Auditer l'utilisation des donnÃ©es masquÃ©es"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir rÃ¨gles masquage", completed: false },
      { title: "Outil", desc: "Choisir solution", completed: false },
      { title: "DÃ©ploiement", desc: "Appliquer aux environnements", completed: false },
      { title: "ContrÃ´le", desc: "VÃ©rifier efficacitÃ©", completed: false }
    ]
  },
  'A.8.12': {
    recommendations: [
      "DÃ©ployer une solution DLP",
      "Classifier les donnÃ©es sensibles",
      "Bloquer l'exfiltration par email/USB",
      "Surveiller les transferts anormaux",
      "Former aux risques de fuite"
    ],
    defaultSteps: [
      { title: "DLP", desc: "Choisir solution", completed: false },
      { title: "RÃ¨gles", desc: "Configurer politiques", completed: false },
      { title: "DÃ©ploiement", desc: "Installer sur postes", completed: false },
      { title: "Formation", desc: "Sensibiliser", completed: false }
    ]
  },
  'A.8.13': {
    recommendations: [
      "Sauvegarder quotidiennement les donnÃ©es critiques",
      "Tester la restauration mensuellement",
      "Maintenir des sauvegardes hors site",
      "Chiffrer les sauvegardes",
      "Documenter la procÃ©dure de restauration"
    ],
    defaultSteps: [
      { title: "Plan", desc: "DÃ©finir politique sauvegarde", completed: false },
      { title: "Outil", desc: "DÃ©ployer solution", completed: false },
      { title: "Tests", desc: "Tester restauration", completed: false },
      { title: "Documentation", desc: "RÃ©diger procÃ©dure", completed: false }
    ]
  },
  'A.8.14': {
    recommendations: [
      "Mettre en place du load balancing",
      "PrÃ©voir des serveurs de secours",
      "Utiliser le cloud pour la redondance",
      "Tester le basculement annuellement",
      "Documenter l'architecture redondante"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier SPOF", completed: false },
      { title: "Conception", desc: "Architecturer redondance", completed: false },
      { title: "ImplÃ©mentation", desc: "DÃ©ployer", completed: false },
      { title: "Tests", desc: "Tester basculement", completed: false }
    ]
  },
  'A.8.15': {
    recommendations: [
      "Centraliser les logs dans un SIEM",
      "Conserver les logs 13 mois",
      "ProtÃ©ger les logs contre modification",
      "Surveiller les logs en temps rÃ©el",
      "Mettre en place des alertes automatisÃ©es"
    ],
    defaultSteps: [
      { title: "SIEM", desc: "Choisir solution", completed: false },
      { title: "Collecte", desc: "Configurer collecte logs", completed: false },
      { title: "RÃ©tention", desc: "DÃ©finir durÃ©e", completed: false },
      { title: "Alertes", desc: "Configurer rÃ¨gles", completed: false }
    ]
  },
  'A.8.16': {
    recommendations: [
      "Surveiller 24/7 les systÃ¨mes critiques",
      "DÃ©tecter les comportements anormaux",
      "Mettre en place des SOC ou MSSP",
      "RÃ©agir aux alertes en < 1h",
      "Maintenir une base de rÃ©fÃ©rence"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir solution monitoring", completed: false },
      { title: "DÃ©ploiement", desc: "Installer sondes", completed: false },
      { title: "Base", desc: "Ã‰tablir baseline", completed: false },
      { title: "RÃ©ponse", desc: "DÃ©finir procÃ©dure", completed: false }
    ]
  },
  'A.8.17': {
    recommendations: [
      "Utiliser NTP pour synchronisation",
      "Synchroniser sur pool.ntp.org ou Ã©quivalent",
      "VÃ©rifier l'heure sur tous systÃ¨mes",
      "Auditer la synchronisation mensuellement",
      "Configurer plusieurs sources NTP"
    ],
    defaultSteps: [
      { title: "Serveur", desc: "Configurer NTP", completed: false },
      { title: "Clients", desc: "Configurer synchronisation", completed: false },
      { title: "VÃ©rification", desc: "Auditer", completed: false },
      { title: "Redondance", desc: "Ajouter sources", completed: false }
    ]
  },
  'A.8.18': {
    recommendations: [
      "Restreindre l'utilisation des utilitaires",
      "Surveiller l'exÃ©cution d'utilitaires suspects",
      "DÃ©sactiver PowerShell si inutilisÃ©",
      "Auditer les sessions administrateur",
      "Utiliser AppLocker"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister utilitaires", completed: false },
      { title: "Restriction", desc: "Configurer politiques", completed: false },
      { title: "Surveillance", desc: "Mettre en place logs", completed: false },
      { title: "Audit", desc: "VÃ©rifier utilisation", completed: false }
    ]
  },
  'A.8.19': {
    recommendations: [
      "Maintenir une liste d'applications approuvÃ©es",
      "Interdire l'installation par utilisateurs",
      "Utiliser un outil de gestion des logiciels",
      "Scanner les logiciels installÃ©s",
      "DÃ©sinstaller les logiciels non conformes"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir rÃ¨gles", completed: false },
      { title: "Outil", desc: "DÃ©ployer gestionnaire", completed: false },
      { title: "Audit", desc: "Scanner existant", completed: false },
      { title: "Nettoyage", desc: "Supprimer non approuvÃ©s", completed: false }
    ]
  },
  'A.8.20': {
    recommendations: [
      "Segmenter le rÃ©seau en zones",
      "Mettre en place un pare-feu NextGen",
      "Configurer des ACLs strictes",
      "Surveiller le trafic rÃ©seau",
      "DÃ©sactiver les services inutilisÃ©s"
    ],
    defaultSteps: [
      { title: "Architecture", desc: "Concevoir segmentation", completed: false },
      { title: "Pare-feu", desc: "DÃ©ployer NGFW", completed: false },
      { title: "RÃ¨gles", desc: "Configurer ACLs", completed: false },
      { title: "Surveillance", desc: "Mettre en place NDR", completed: false }
    ]
  },
  'A.8.21': {
    recommendations: [
      "Documenter les services rÃ©seau",
      "DÃ©finir des SLAs sÃ©curitÃ©",
      "Signer des contrats avec niveaux de service",
      "Surveiller la disponibilitÃ©",
      "Auditer annuellement les services"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister services", completed: false },
      { title: "SLA", desc: "DÃ©finir exigences", completed: false },
      { title: "Contrats", desc: "NÃ©gocier", completed: false },
      { title: "Surveillance", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.22': {
    recommendations: [
      "CrÃ©er des VLANs par fonction",
      "Isoler le Wi-Fi invitÃ© du rÃ©seau interne",
      "SÃ©parer les environnements (prod, dev, test)",
      "Utiliser des DMZ pour services exposÃ©s",
      "Configurer des pare-feu entre zones"
    ],
    defaultSteps: [
      { title: "Zonage", desc: "DÃ©finir zones", completed: false },
      { title: "VLANs", desc: "Configurer", completed: false },
      { title: "Pare-feu", desc: "Mettre en place filtrage", completed: false },
      { title: "Tests", desc: "Valider isolation", completed: false }
    ]
  },
  'A.8.23': {
    recommendations: [
      "DÃ©ployer un proxy filtrant",
      "Bloquer les catÃ©gories Ã  risque",
      "Autoriser uniquement les sites mÃ©tier",
      "Surveiller les requÃªtes DNS",
      "Former aux risques Web"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir proxy", completed: false },
      { title: "CatÃ©gories", desc: "DÃ©finir filtrage", completed: false },
      { title: "DÃ©ploiement", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.24': {
    recommendations: [
      "Chiffrer les donnÃ©es sensibles au repos",
      "Chiffrer les flux rÃ©seau (TLS 1.3)",
      "Utiliser un HSM pour les clÃ©s",
      "Faire tourner les clÃ©s annuellement",
      "Documenter la politique cryptographique"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir rÃ¨gles crypto", completed: false },
      { title: "HSM", desc: "DÃ©ployer", completed: false },
      { title: "Gestion", desc: "Mettre en place processus clÃ©s", completed: false },
      { title: "Audit", desc: "VÃ©rifier conformitÃ©", completed: false }
    ]
  },
  'A.8.25': {
    recommendations: [
      "IntÃ©grer la sÃ©curitÃ© dÃ¨s la conception (DevSecOps)",
      "Former les dÃ©veloppeurs Ã  la sÃ©curitÃ©",
      "Utiliser des outils SAST/DAST",
      "RÃ©aliser des revues de code",
      "Documenter les exigences sÃ©curitÃ©"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃ©finir SDLC sÃ©curisÃ©", completed: false },
      { title: "Outils", desc: "IntÃ©grer SAST/DAST", completed: false },
      { title: "Formation", desc: "Former dÃ©veloppeurs", completed: false },
      { title: "Revues", desc: "Mettre en place code review", completed: false }
    ]
  },
  'A.8.26': {
    recommendations: [
      "DÃ©finir des exigences sÃ©curitÃ© fonctionnelles",
      "RÃ©aliser une analyse des risques applicatifs",
      "Valider les exigences avec le mÃ©tier",
      "Tester la conformitÃ© aux exigences",
      "Maintenir un registre des exigences"
    ],
    defaultSteps: [
      { title: "Template", desc: "CrÃ©er modÃ¨le exigences", completed: false },
      { title: "Analyse", desc: "Identifier risques", completed: false },
      { title: "Validation", desc: "Faire approuver", completed: false },
      { title: "Tests", desc: "VÃ©rifier conformitÃ©", completed: false }
    ]
  },
  'A.8.27': {
    recommendations: [
      "Adopter l'architecture Zero Trust",
      "Appliquer le principe de moindre privilÃ¨ge",
      "Utiliser la dÃ©fense en profondeur",
      "Documenter l'architecture",
      "RÃ©viser les principes annuellement"
    ],
    defaultSteps: [
      { title: "Principes", desc: "DÃ©finir", completed: false },
      { title: "Architecture", desc: "Concevoir", completed: false },
      { title: "Documentation", desc: "RÃ©diger", completed: false },
      { title: "Revue", desc: "Planifier rÃ©vision", completed: false }
    ]
  },
  'A.8.28': {
    recommendations: [
      "Suivre les standards OWASP",
      "Valider toutes les entrÃ©es utilisateur",
      "Ã‰chapper les sorties",
      "Utiliser des requÃªtes paramÃ©trÃ©es",
      "Former aux vulnÃ©rabilitÃ©s Web"
    ],
    defaultSteps: [
      { title: "Guide", desc: "Documenter rÃ¨gles codage", completed: false },
      { title: "Formation", desc: "Former Ã©quipes", completed: false },
      { title: "Outils", desc: "IntÃ©grer linters sÃ©curitÃ©", completed: false },
      { title: "Revues", desc: "VÃ©rifier conformitÃ©", completed: false }
    ]
  },
  'A.8.29': {
    recommendations: [
      "IntÃ©grer tests sÃ©curitÃ© dans CI/CD",
      "RÃ©aliser des tests d'intrusion applicatifs",
      "Tester avant mise en production",
      "Automatiser les tests de non-rÃ©gression sÃ©curitÃ©",
      "Documenter les rÃ©sultats"
    ],
    defaultSteps: [
      { title: "CI/CD", desc: "IntÃ©grer tests", completed: false },
      { title: "Pentest", desc: "Planifier", completed: false },
      { title: "Automatisation", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.30': {
    recommendations: [
      "Auditer les dÃ©veloppements externalisÃ©s",
      "Exiger des livrables sÃ©curitÃ©",
      "Restreindre l'accÃ¨s aux donnÃ©es de production",
      "Signer des clauses de confidentialitÃ©",
      "VÃ©rifier la conformitÃ© des sous-traitants"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "DÃ©finir contrats", completed: false },
      { title: "Audit", desc: "Planifier audits", completed: false },
      { title: "AccÃ¨s", desc: "Restreindre", completed: false },
      { title: "Livrables", desc: "Exiger documentation sÃ©curitÃ©", completed: false }
    ]
  },
  'A.8.31': {
    recommendations: [
      "Isoler physiquement ou logiquement les environnements",
      "Utiliser des donnÃ©es anonymisÃ©es en test",
      "Interdire les accÃ¨s production depuis dev",
      "Configurer des comptes sÃ©parÃ©s",
      "Auditer la sÃ©paration"
    ],
    defaultSteps: [
      { title: "SÃ©paration", desc: "Isoler rÃ©seaux", completed: false },
      { title: "Comptes", desc: "CrÃ©er comptes dÃ©diÃ©s", completed: false },
      { title: "AccÃ¨s", desc: "Configurer restrictions", completed: false },
      { title: "Audit", desc: "VÃ©rifier", completed: false }
    ]
  },
  'A.8.32': {
    recommendations: [
      "Mettre en place un ITIL/Change Management",
      "Documenter tous les changements",
      "Valider les changements en CAB",
      "Tester avant dÃ©ploiement",
      "PrÃ©voir un plan de retour arriÃ¨re"
    ],
    defaultSteps: [
      { title: "Processus", desc: "DÃ©finir gestion changements", completed: false },
      { title: "Outil", desc: "DÃ©ployer outil ticketing", completed: false },
      { title: "CAB", desc: "Former comitÃ©", completed: false },
      { title: "Formation", desc: "Former Ã©quipes", completed: false }
    ]
  },
  'A.8.33': {
    recommendations: [
      "Ne pas utiliser de donnÃ©es rÃ©elles en test",
      "Anonymiser les donnÃ©es de test",
      "ProtÃ©ger les jeux de donnÃ©es de test",
      "DÃ©truire les donnÃ©es aprÃ¨s test",
      "Auditer l'utilisation"
    ],
    defaultSteps: [
      { title: "Politique", desc: "DÃ©finir rÃ¨gles donnÃ©es test", completed: false },
      { title: "Anonymisation", desc: "Mettre en place", completed: false },
      { title: "Destruction", desc: "Configurer", completed: false },
      { title: "Audit", desc: "VÃ©rifier", completed: false }
    ]
  },
  'A.8.34': {
    recommendations: [
      "Planifier les audits avec les Ã©quipes",
      "Isoler les tests d'audit",
      "Surveiller les activitÃ©s d'audit",
      "Restaurer aprÃ¨s audit",
      "Documenter les pÃ©rimÃ¨tres"
    ],
    defaultSteps: [
      { title: "ProcÃ©dure", desc: "DÃ©finir", completed: false },
      { title: "Planification", desc: "Coordonner", completed: false },
      { title: "Isolation", desc: "Mettre en place", completed: false },
      { title: "Restauration", desc: "PrÃ©voir rollback", completed: false }
    ]
  }
};

const DEFAULT_CONFIG = {
  recommendations: [
    "Analyser la cause racine de la non-conformitÃ© constatÃ©e",
    "Nommer un pilote responsable pour le pilotage de ce plan",
    "DÃ©finir un calendrier de mise en Å“uvre rÃ©aliste",
    "Documenter les preuves de correction (photos, logs, mails)",
    "RÃ©aliser une vÃ©rification d'efficacitÃ© aprÃ¨s clÃ´ture"
  ],
  defaultSteps: [{ title: "Diagnostic", desc: "Identifier les causes de l'Ã©cart", completed: false }]
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
    const title = prompt("Titre de la nouvelle Ã©tape :");
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
      console.error("Erreur : La fonction onSave n'a pas Ã©tÃ© passÃ©e au composant.");
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
                    <option value="NonDemarre">Non dÃ©marrÃ©</option>
                    <option value="EnCours">En cours</option>
                    <option value="Termine">TerminÃ©</option>
                  </select>
              </div>
              <div>
                <label style={styles.label}>PrioritÃ©</label>
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
                <label style={styles.label}>Date d'Ã©chÃ©ance</label>
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
              <h3 style={styles.title}>Ã‰tapes du plan d'action</h3>
              <button onClick={addStep} style={{ ...styles.input, width: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>+ Ajouter Ã©tape</button>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{completedSteps} / {formData.steps.length} Ã©tapes complÃ©tÃ©es</div>
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
                    <div style={{ fontSize: '13.5px', fontWeight: 800 }}>Ã‰tape {i+1} : {step.title}</div>
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
