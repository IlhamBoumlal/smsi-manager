import React, { useState } from 'react';
import { 
  X, CheckCircle2, Lightbulb, ClipboardList, 
  Save 
} from 'lucide-react';
import { appPrompt } from '../utils/appDialogs';

// Configuration complète pour TOUS les contrôles avec 5 recommandations chacun
const PLAN_CONFIGS = {
  // ==================== DOMAINE ORGANISATIONNEL (A.5.1 à A.5.37) ====================
  'A.5.1': {
    recommendations: [
      "Rédiger une politique de sécurité de l'information formelle et complète",
      "Faire approuver formellement la politique par la Direction Générale (DG)",
      "Diffuser la politique à l'ensemble du personnel via l'intranet et email",
      "Inclure la signature de la politique dans le processus d'onboarding RH",
      "Planifier une révision annuelle et tracer les versions dans un registre"
    ],
    defaultSteps: [
      { title: "Rédaction", desc: "Élaborer la version complète de la politique", completed: false },
      { title: "Validation légale", desc: "Vérifier la conformité avec les obligations légales", completed: false },
      { title: "Approbation DG", desc: "Signature officielle par la direction", completed: false },
      { title: "Diffusion", desc: "Publier sur l'intranet et communiquer par email", completed: false },
      { title: "Formation", desc: "Former tous les employés sur la politique", completed: false }
    ]
  },
  'A.5.2': {
    recommendations: [
      "Créer une matrice RACI détaillée pour tous les rôles sécurité",
      "Nommer officiellement un RSSI (Responsable Sécurité des Systèmes d'Information)",
      "Définir les responsabilités sécurité dans chaque fiche de poste",
      "Établir une chaîne de remplacement pour les absences critiques",
      "Communiquer les rôles et responsabilités lors des revues annuelles"
    ],
    defaultSteps: [
      { title: "Inventaire des rôles", desc: "Lister toutes les fonctions sensibles", completed: false },
      { title: "Rédaction matrice", desc: "Créer la matrice RACI sécurité", completed: false },
      { title: "Validation RH", desc: "Intégrer dans les fiches de poste", completed: false },
      { title: "Communication", desc: "Présenter en réunion générale", completed: false }
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
      "Former les managers à leurs responsabilités sécurité",
      "Inclure des objectifs sécurité dans les OKR des managers",
      "Organiser des comités de direction sécurité trimestriels",
      "Mettre en place un reporting sécurité mensuel pour la direction",
      "Sanctionner le non-respect des politiques par les équipes"
    ],
    defaultSteps: [
      { title: "Sensibilisation", desc: "Former les managers à la sécurité", completed: false },
      { title: "Objectifs", desc: "Définir des KPI sécurité pour chaque manager", completed: false },
      { title: "Reporting", desc: "Mettre en place les tableaux de bord", completed: false },
      { title: "Suivi", desc: "Revue trimestrielle des résultats", completed: false }
    ]
  },
  'A.5.5': {
    recommendations: [
      "Établir une liste des autorités compétentes (CNIL, ANSSI, police, etc.)",
      "Désigner un correspondant officiel pour les contacts avec les autorités",
      "Documenter les procédures de signalement d'incidents aux autorités",
      "Maintenir à jour les coordonnées et les obligations de signalement",
      "Organiser une réunion annuelle avec les autorités locales"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les autorités pertinentes", completed: false },
      { title: "Nomination", desc: "Désigner le correspondant autorités", completed: false },
      { title: "Procédure", desc: "Rédiger les procédures de contact", completed: false },
      { title: "Test", desc: "Simuler un signalement d'incident", completed: false }
    ]
  },
  'A.5.6': {
    recommendations: [
      "Identifier les groupes d'intérêt spéciaux (Clusir, FIRST, etc.)",
      "Adhérer à au moins un forum professionnel sécurité",
      "Désigner des représentants pour participer aux réunions",
      "Diffuser les bonnes pratiques issues des groupes à l'organisation",
      "Participer activement aux groupes de travail sectoriels"
    ],
    defaultSteps: [
      { title: "Recherche", desc: "Identifier les groupes pertinents", completed: false },
      { title: "Adhésion", desc: "Soumettre les demandes d'adhésion", completed: false },
      { title: "Participation", desc: "Assister aux premières réunions", completed: false },
      { title: "Retour", desc: "Synthétiser et diffuser les informations", completed: false }
    ]
  },
  'A.5.7': {
    recommendations: [
      "Mettre en place une veille sur les menaces (flux RSS, CERT, newsletters)",
      "Abonner à des services de renseignement sur les menaces (ISAC)",
      "Analyser mensuellement les menaces pertinentes pour l'activité",
      "Partager les renseignements avec les équipes concernées",
      "Établir un tableau de bord des menaces actives"
    ],
    defaultSteps: [
      { title: "Sources", desc: "Identifier les sources de renseignement", completed: false },
      { title: "Abonnements", desc: "S'abonner aux services", completed: false },
      { title: "Processus", desc: "Définir le cycle d'analyse", completed: false },
      { title: "Dashboard", desc: "Créer le tableau de bord", completed: false }
    ]
  },
  'A.5.8': {
    recommendations: [
      "Intégrer un référent sécurité dans chaque projet",
      "Réaliser une analyse des risques sécurité en phase d'initiation",
      "Inclure des critères sécurité dans les livrables de projet",
      "Planifier des revues sécurité aux jalons clés du projet",
      "Budgéter les actions sécurité dès le lancement du projet"
    ],
    defaultSteps: [
      { title: "Template", desc: "Créer un modèle d'analyse sécurité projet", completed: false },
      { title: "Formation", desc: "Former les chefs de projet", completed: false },
      { title: "Processus", desc: "Intégrer dans la méthodologie projet", completed: false },
      { title: "Pilote", desc: "Tester sur un projet existant", completed: false }
    ]
  },
  'A.5.9': {
    recommendations: [
      "Déployer un outil CMDB pour l'inventaire automatisé",
      "Nommer un propriétaire pour chaque actif inventorié",
      "Scanner le réseau mensuellement pour détecter les actifs non référencés",
      "Inclure les actifs cloud et SaaS dans l'inventaire",
      "Lier l'inventaire au processus d'onboarding/offboarding"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Sélectionner et déployer un CMDB", completed: false },
      { title: "Découverte", desc: "Scanner l'existant", completed: false },
      { title: "Attribution", desc: "Nommer les propriétaires", completed: false },
      { title: "Maintenance", desc: "Mettre en place la mise à jour continue", completed: false }
    ]
  },
  'A.5.10': {
    recommendations: [
      "Rédiger une charte d'utilisation acceptable des moyens informatiques",
      "Faire signer la charte par tous les employés annuellement",
      "Interdire explicitement les usages personnels abusifs",
      "Former les utilisateurs sur les règles d'utilisation",
      "Mettre en place des contrôles techniques (filtrage web, DLP)"
    ],
    defaultSteps: [
      { title: "Rédaction", desc: "Écrire la charte d'utilisation", completed: false },
      { title: "Validation", desc: "Faire valider par le juridique", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "Contrôles", desc: "Mettre en place les filtrages", completed: false }
    ]
  },
  'A.5.11': {
    recommendations: [
      "Formaliser une procédure de retour d'actifs dans le manuel RH",
      "Créer une checklist de départ à remplir par le manager",
      "Verrouiller les comptes le jour du départ",
      "Utiliser un système de gestion des actifs pour tracer les retours",
      "Prévoir des pénalités pour non-retour dans les contrats"
    ],
    defaultSteps: [
      { title: "Procédure", desc: "Rédiger la procédure de retour", completed: false },
      { title: "Checklist", desc: "Créer la checklist départ", completed: false },
      { title: "Formation", desc: "Former les managers", completed: false },
      { title: "Audit", desc: "Vérifier l'application sur les derniers départs", completed: false }
    ]
  },
  'A.5.12': {
    recommendations: [
      "Définir un schéma de classification à 3 ou 4 niveaux (Public, Interne, Confidentiel, Secret)",
      "Nommer des responsables de classification par département",
      "Documenter les critères de classification pour chaque niveau",
      "Former tous les employés à la classification",
      "Réviser la classification annuellement"
    ],
    defaultSteps: [
      { title: "Schéma", desc: "Définir les niveaux et critères", completed: false },
      { title: "Validation", desc: "Valider avec la direction", completed: false },
      { title: "Formation", desc: "Former tous les employés", completed: false },
      { title: "Déploiement", desc: "Classifier les actifs existants", completed: false }
    ]
  },
  'A.5.13': {
    recommendations: [
      "Définir des règles d'étiquetage pour chaque niveau de classification",
      "Utiliser des métadonnées dans les fichiers Office pour l'étiquetage",
      "Apposer des mentions de confidentialité sur les documents papier",
      "Automatiser l'étiquetage via des solutions DLP",
      "Vérifier la cohérence de l'étiquetage lors des audits"
    ],
    defaultSteps: [
      { title: "Règles", desc: "Définir les règles d'étiquetage", completed: false },
      { title: "Outil", desc: "Sélectionner une solution d'étiquetage", completed: false },
      { title: "Déploiement", desc: "Configurer l'étiquetage automatique", completed: false },
      { title: "Contrôle", desc: "Auditer la conformité", completed: false }
    ]
  },
  'A.5.14': {
    recommendations: [
      "Chiffrer systématiquement les emails contenant des données sensibles",
      "Utiliser un outil de transfert sécurisé (SFTP, Kiteworks)",
      "Signer des accords de confidentialité avec les partenaires",
      "Interdire le transfert de données sensibles via clés USB",
      "Journaliser tous les transferts de données externes"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier tous les flux de transfert", completed: false },
      { title: "Sécurisation", desc: "Mettre en place les solutions de transfert sécurisé", completed: false },
      { title: "Accords", desc: "Faire signer les NDA", completed: false },
      { title: "Contrôle", desc: "Mettre en place la journalisation", completed: false }
    ]
  },
  'A.5.15': {
    recommendations: [
      "Appliquer strictement le principe du moindre privilège (Need-to-know)",
      "Réviser les droits d'accès de tous les utilisateurs chaque trimestre",
      "Désactiver systématiquement les comptes des sortants le jour J",
      "Généraliser l'authentification multi-facteurs (MFA) pour tous les accès",
      "Tenir un registre d'inventaire à jour de tous les privilèges admin"
    ],
    defaultSteps: [
      { title: "Audit initial", desc: "Lister tous les accès actifs", completed: false },
      { title: "Nettoyage", desc: "Supprimer les comptes inutilisés", completed: false },
      { title: "MFA", desc: "Déployer l'authentification multi-facteurs", completed: false },
      { title: "Revue périodique", desc: "Mettre en place la révision trimestrielle", completed: false }
    ]
  },
  'A.5.16': {
    recommendations: [
      "Centraliser la gestion des identités dans un annuaire (AD, LDAP)",
      "Automatiser la création/suppression des comptes via le SIRH",
      "Implémenter un processus de revue des identités dormantes",
      "Lier l'identité numérique à l'identité réelle (carte de visite)",
      "Mettre en place un SSO pour simplifier la gestion"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Inventorier toutes les identités", completed: false },
      { title: "Centralisation", desc: "Choisir un annuaire central", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "SSO", desc: "Déployer l'authentification unique", completed: false }
    ]
  },
  'A.5.17': {
    recommendations: [
      "Imposer des mots de passe robustes (12+ caractères, complexité)",
      "Activer la politique d'expiration des mots de passe (90 jours max)",
      "Proscrire la réutilisation des 5 derniers mots de passe",
      "Déployer un gestionnaire d'entreprise pour les comptes partagés",
      "Verrouiller le compte après 5 échecs consécutifs"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir la politique MDP", completed: false },
      { title: "Configuration", desc: "Configurer l'AD/GPO", completed: false },
      { title: "Formation", desc: "Former les utilisateurs", completed: false },
      { title: "Contrôle", desc: "Vérifier la conformité", completed: false }
    ]
  },
  'A.5.18': {
    recommendations: [
      "Automatiser la révocation des droits lors des départs",
      "Mettre en place un workflow d'approbation pour les accès privilégiés",
      "Réaliser une revue des droits d'accès semestrielle",
      "Utiliser des groupes AD pour gérer les droits par profil",
      "Journaliser toutes les attributions de droits"
    ],
    defaultSteps: [
      { title: "Processus", desc: "Définir le workflow d'approbation", completed: false },
      { title: "Groupes", desc: "Structurer les groupes d'accès", completed: false },
      { title: "Automatisation", desc: "Connecter au SIRH", completed: false },
      { title: "Revue", desc: "Planifier la revue semestrielle", completed: false }
    ]
  },
  'A.5.19': {
    recommendations: [
      "Évaluer la sécurité des fournisseurs avant signature",
      "Inclure des clauses sécurité dans tous les contrats fournisseurs",
      "Classer les fournisseurs par niveau de criticité",
      "Réaliser des audits fournisseurs annuels pour les plus critiques",
      "Maintenir une base de données des évaluations fournisseurs"
    ],
    defaultSteps: [
      { title: "Critères", desc: "Définir les critères d'évaluation", completed: false },
      { title: "Questionnaire", desc: "Créer un questionnaire sécurité", completed: false },
      { title: "Base", desc: "Créer la base fournisseurs", completed: false },
      { title: "Audits", desc: "Planifier les audits", completed: false }
    ]
  },
  'A.5.20': {
    recommendations: [
      "Faire signer une charte sécurité aux prestataires externes",
      "Exiger la certification ISO 27001 des fournisseurs critiques",
      "Définir des pénalités pour non-respect de la sécurité",
      "Inclure un droit d'audit dans les contrats",
      "Limiter contractuellement la sous-traitance non autorisée"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Faire valider les clauses juridiquement", completed: false },
      { title: "Signature", desc: "Faire signer les accords existants", completed: false },
      { title: "Base", desc: "Centraliser les contrats", completed: false },
      { title: "Suivi", desc: "Mettre en place le suivi des échéances", completed: false }
    ]
  },
  'A.5.21': {
    recommendations: [
      "Exiger des attestations de sécurité des sous-traitants",
      "Limiter la profondeur de la chaîne de sous-traitance",
      "Auditer les fournisseurs de rang 2 pour les services critiques",
      "Documenter la chaîne d'approvisionnement complète",
      "Mettre en place des clauses de cascade pour la sécurité"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Mapper la chaîne d'approvisionnement", completed: false },
      { title: "Exigences", desc: "Définir les exigences pour chaque niveau", completed: false },
      { title: "Audits", desc: "Auditer les sous-traitants critiques", completed: false },
      { title: "Tableau", desc: "Créer un tableau de bord risques", completed: false }
    ]
  },
  'A.5.22': {
    recommendations: [
      "Mettre en place des revues de service trimestrielles",
      "Suivre les indicateurs de performance sécurité des fournisseurs",
      "Documenter les changements de périmètre des fournisseurs",
      "Réaliser un audit annuel des services externalisés",
      "Prévoir un plan de sortie pour chaque service critique"
    ],
    defaultSteps: [
      { title: "KPI", desc: "Définir les KPI à suivre", completed: false },
      { title: "Revues", desc: "Planifier les revues", completed: false },
      { title: "Audit", desc: "Programmer l'audit annuel", completed: false },
      { title: "Plans sortie", desc: "Rédiger les plans de sortie", completed: false }
    ]
  },
  'A.5.23': {
    recommendations: [
      "Évaluer la sécurité des fournisseurs cloud (CSPM)",
      "Définir un modèle de responsabilité partagée clair",
      "Chiffrer les données avant stockage cloud",
      "Sauvegarder hors cloud les données critiques",
      "Prévoir une stratégie de multi-cloud pour éviter le lock-in"
    ],
    defaultSteps: [
      { title: "Évaluation", desc: "Auditer les fournisseurs cloud", completed: false },
      { title: "Chiffrement", desc: "Mettre en place le chiffrement", completed: false },
      { title: "Sauvegardes", desc: "Configurer les backups externes", completed: false },
      { title: "Documentation", desc: "Documenter le RACI cloud", completed: false }
    ]
  },
  'A.5.24': {
    recommendations: [
      "Créer une procédure formelle de gestion des incidents",
      "Désigner une équipe CERT/CSIRT interne",
      "Mettre en place un outil de ticketing pour les incidents",
      "Définir des niveaux de criticité et des SLAs de réponse",
      "Organiser des exercices de simulation d'incident"
    ],
    defaultSteps: [
      { title: "Procédure", desc: "Rédiger la PGI", completed: false },
      { title: "Équipe", desc: "Nommer l'équipe incident", completed: false },
      { title: "Outil", desc: "Déployer un outil de ticketing", completed: false },
      { title: "Exercice", desc: "Organiser un premier exercice", completed: false }
    ]
  },
  'A.5.25': {
    recommendations: [
      "Former les équipes à la qualification des événements",
      "Définir une matrice de classification des événements",
      "Mettre en place un seuil de déclenchement automatisé",
      "Documenter les critères de décision pour chaque type d'événement",
      "Réviser trimestriellement les critères de classification"
    ],
    defaultSteps: [
      { title: "Matrice", desc: "Créer la matrice de classification", completed: false },
      { title: "Formation", desc: "Former les analystes", completed: false },
      { title: "Seuils", desc: "Configurer les alertes", completed: false },
      { title: "Revue", desc: "Valider avec l'équipe", completed: false }
    ]
  },
  'A.5.26': {
    recommendations: [
      "Établir des playbooks par type d'incident (ransomware, fuite, etc.)",
      "Mettre en place des runbooks d'escalade",
      "Former les équipes à la réponse sur incident",
      "Documenter les contacts d'urgence (légal, com, technique)",
      "Réaliser un debriefing après chaque incident majeur"
    ],
    defaultSteps: [
      { title: "Playbooks", desc: "Rédiger les playbooks", completed: false },
      { title: "Contacts", desc: "Créer l'annuaire d'urgence", completed: false },
      { title: "Formation", desc: "Former à la réponse", completed: false },
      { title: "Simulation", desc: "Tester les playbooks", completed: false }
    ]
  },
  'A.5.27': {
    recommendations: [
      "Organiser un REX (Retour d'Expérience) après chaque incident",
      "Mettre à jour les procédures suite aux incidents",
      "Partager les leçons apprises avec toutes les équipes",
      "Maintenir une base de connaissances des incidents",
      "Intégrer les enseignements dans la formation sécurité"
    ],
    defaultSteps: [
      { title: "Processus", desc: "Définir le processus REX", completed: false },
      { title: "Base", desc: "Créer la base de connaissances", completed: false },
      { title: "Mise à jour", desc: "Réviser les procédures", completed: false },
      { title: "Diffusion", desc: "Partager les leçons", completed: false }
    ]
  },
  'A.5.28': {
    recommendations: [
      "Définir une procédure de chaîne de custody",
      "Former les équipes à la collecte forensique",
      "Mettre à disposition une mallette de collecte",
      "Documenter les types de preuves admissibles",
      "Travailler avec un expert légal pour la validité des preuves"
    ],
    defaultSteps: [
      { title: "Procédure", desc: "Rédiger la procédure de preuves", completed: false },
      { title: "Formation", desc: "Former les répondants", completed: false },
      { title: "Kit", desc: "Préparer le kit de collecte", completed: false },
      { title: "Test", desc: "Simuler une collecte", completed: false }
    ]
  },
  'A.5.29': {
    recommendations: [
      "Intégrer la sécurité dans le PCA/PRA existant",
      "Identifier les actifs critiques à protéger en priorité",
      "Définir des modes dégradés sécurisés",
      "Tester la sécurité en mode dégradé lors des exercices",
      "Maintenir des documents procéduraux hors ligne"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier les risques de disruption", completed: false },
      { title: "Plan", desc: "Intégrer sécurité au PCA", completed: false },
      { title: "Tests", desc: "Tester en mode dégradé", completed: false },
      { title: "Mise à jour", desc: "Réviser le PCA", completed: false }
    ]
  },
  'A.5.30': {
    recommendations: [
      "Définir des objectifs de temps (RTO) et de perte (RPO) par métier",
      "Tester la restauration des sauvegardes critiques chaque mois",
      "Maintenir une copie des sauvegardes hors ligne (Air-gapped)",
      "Documenter les procédures de bascule en mode secours",
      "Réaliser un exercice de gestion de crise simulant une panne"
    ],
    defaultSteps: [
      { title: "Analyse d'impact", desc: "Définir les priorités de reprise", completed: false },
      { title: "Sauvegardes", desc: "Configurer les sauvegardes", completed: false },
      { title: "Test restauration", desc: "Vérifier l'intégrité des backups", completed: false },
      { title: "Exercice", desc: "Simuler un basculement", completed: false }
    ]
  },
  'A.5.31': {
    recommendations: [
      "Maintenir un registre des obligations légales et réglementaires",
      "Nommer un référent conformité (Consultant, RSSI)",
      "Réaliser une veille juridique mensuelle",
      "Documenter les actions de mise en conformité",
      "Prévoir des audits de conformité externes"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister toutes les obligations", completed: false },
      { title: "Nomination", desc: "Désigner les référents", completed: false },
      { title: "Veille", desc: "Mettre en place la veille", completed: false },
      { title: "Audit", desc: "Planifier l'audit conformité", completed: false }
    ]
  },
  'A.5.32': {
    recommendations: [
      "Déployer des solutions anti-piratage logiciel",
      "Signer des accords de licence avec tous les éditeurs",
      "Réaliser un inventaire complet des licences logicielles",
      "Former les employés sur les droits d'auteur",
      "Mettre en place une politique d'utilisation des logiciels libres"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister tous les logiciels", completed: false },
      { title: "Licences", desc: "Vérifier les licences", completed: false },
      { title: "Politique", desc: "Rédiger la politique IP", completed: false },
      { title: "Formation", desc: "Former les équipes", completed: false }
    ]
  },
  'A.5.33': {
    recommendations: [
      "Définir une politique de conservation des archives",
      "Mettre en place un système de GED sécurisé",
      "Protéger les archives physiques (armoires fermées, alarmes)",
      "Chiffrer les archives numériques sensibles",
      "Réaliser des sauvegardes des archives critiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir les durées de conservation", completed: false },
      { title: "GED", desc: "Déployer une GED", completed: false },
      { title: "Sécurisation", desc: "Protéger les archives", completed: false },
      { title: "Backups", desc: "Sauvegarder les archives", completed: false }
    ]
  },
  'A.5.34': {
    recommendations: [
      "Nommer un référent conformité (Consultant ou RSSI)",
      "Tenir un registre des traitements RGPD",
      "Réaliser des AIPD pour les traitements sensibles",
      "Mettre en place les droits des personnes (accès, rectification, effacement)",
      "Documenter les violations de données"
    ],
    defaultSteps: [
      { title: "Conformite", desc: "Nommer le referent conformite", completed: false },
      { title: "Registre", desc: "Créer le registre des traitements", completed: false },
      { title: "Droits", desc: "Mettre en place les procédures", completed: false },
      { title: "AIPD", desc: "Réaliser les analyses d'impact", completed: false }
    ]
  },
  'A.5.35': {
    recommendations: [
      "Planifier un audit interne annuel",
      "Faire réaliser un audit externe tous les 2 ans",
      "Utiliser des auditeurs certifiés (Lead Auditor)",
      "Documenter un plan d'audit et les périmètres",
      "Traiter et suivre les non-conformités identifiées"
    ],
    defaultSteps: [
      { title: "Planification", desc: "Établir le plan d'audit", completed: false },
      { title: "Audit interne", desc: "Réaliser l'audit", completed: false },
      { title: "Actions", desc: "Traiter les non-conformités", completed: false },
      { title: "Audit externe", desc: "Planifier l'audit externe", completed: false }
    ]
  },
  'A.5.36': {
    recommendations: [
      "Mettre en place des contrôles de conformité automatisés",
      "Réaliser des campagnes de rappel des règles",
      "Auditer aléatoirement la conformité des utilisateurs",
      "Définir des sanctions pour non-respect",
      "Intégrer la conformité dans les entretiens annuels"
    ],
    defaultSteps: [
      { title: "Contrôles", desc: "Définir les contrôles", completed: false },
      { title: "Campagne", desc: "Lancer une campagne de sensibilisation", completed: false },
      { title: "Audits", desc: "Réaliser des audits surprise", completed: false },
      { title: "Sanctions", desc: "Appliquer le disciplinaire", completed: false }
    ]
  },
  'A.5.37': {
    recommendations: [
      "Documenter toutes les procédures opérationnelles critiques",
      "Centraliser dans un wiki ou une base documentaire",
      "Versionner et tracer les modifications",
      "Former les équipes à l'utilisation des procédures",
      "Réviser annuellement les procédures"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les procédures à documenter", completed: false },
      { title: "Rédaction", desc: "Écrire les procédures", completed: false },
      { title: "Validation", desc: "Faire valider", completed: false },
      { title: "Centralisation", desc: "Publier sur le wiki", completed: false }
    ]
  },
  // ==================== DOMAINE PERSONNES (A.6.1 à A.6.8) ====================
  'A.6.1': {
    recommendations: [
      "Réaliser des vérifications des antécédents pour tous les postes sensibles",
      "Vérifier les références professionnelles des candidats",
      "Exiger un extrait de casier judiciaire pour les postes critiques",
      "Renouveler les vérifications périodiquement (tous les 3 ans)",
      "Documenter les vérifications effectuées"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir la politique de vérification", completed: false },
      { title: "Processus", desc: "Intégrer au process RH", completed: false },
      { title: "Fournisseur", desc: "Choisir un prestataire", completed: false },
      { title: "Déploiement", desc: "Lancer les premières vérifications", completed: false }
    ]
  },
  'A.6.2': {
    recommendations: [
      "Inclure une clause de confidentialité dans tous les contrats",
      "Définir les obligations sécurité dans les avenants",
      "Faire signer une charte informatique en annexe",
      "Prévoir des sanctions pour non-respect",
      "Mettre à jour les contrats lors des changements légaux"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Rédiger les clauses sécurité", completed: false },
      { title: "Validation", desc: "Faire valider par juridique", completed: false },
      { title: "Signature", desc: "Faire signer aux employés", completed: false },
      { title: "Centralisation", desc: "Archiver les contrats", completed: false }
    ]
  },
  'A.6.3': {
    recommendations: [
      "Organiser une formation sécurité annuelle obligatoire",
      "Déployer des campagnes de phishing simulé",
      "Créer un e-learning de sensibilisation",
      "Diffuser des newsletters sécurité mensuelles",
      "Former spécifiquement les équipes sensibles (IT, finance, RH)"
    ],
    defaultSteps: [
      { title: "Programme", desc: "Définir le programme de formation", completed: false },
      { title: "E-learning", desc: "Créer ou acheter des modules", completed: false },
      { title: "Phishing", desc: "Lancer des campagnes simulées", completed: false },
      { title: "Suivi", desc: "Mesurer l'efficacité", completed: false }
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
      "Maintenir des obligations de confidentialité post-départ",
      "Informer les employés des obligations persistantes",
      "Prévoir des clauses de non-concurrence si nécessaire",
      "Rappeler les obligations lors de l'entretien de sortie",
      "Surveiller le respect après départ pour les postes sensibles"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Vérifier les clauses post-emploi", completed: false },
      { title: "Communication", desc: "Informer lors du départ", completed: false },
      { title: "Documentation", desc: "Archiver les rappels", completed: false },
      { title: "Suivi", desc: "Mettre en place des rappels", completed: false }
    ]
  },
  'A.6.6': {
    recommendations: [
      "Faire signer un NDA à tous les employés et prestataires",
      "Réviser les NDA tous les 3 ans",
      "Adapter les NDA selon les niveaux d'accès",
      "Centraliser tous les NDA signés",
      "Prévoir des pénalités financières pour violation"
    ],
    defaultSteps: [
      { title: "Modèle", desc: "Créer un modèle de NDA", completed: false },
      { title: "Validation", desc: "Faire valider juridiquement", completed: false },
      { title: "Signature", desc: "Recueillir les signatures", completed: false },
      { title: "Centralisation", desc: "Archiver dans un coffre", completed: false }
    ]
  },
  'A.6.7': {
    recommendations: [
      "Déployer un VPN obligatoire pour le télétravail",
      "Chiffrer les postes en télétravail (BitLocker, FileVault)",
      "Interdire le travail sur réseaux publics non sécurisés",
      "Mettre en place une politique BYOD claire",
      "Former les télétravailleurs aux bonnes pratiques"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Rédiger la politique télétravail", completed: false },
      { title: "VPN", desc: "Déployer et configurer le VPN", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement disque", completed: false },
      { title: "Formation", desc: "Former les télétravailleurs", completed: false }
    ]
  },
  'A.6.8': {
    recommendations: [
      "Mettre en place une adresse email dédiée (signalement@)",
      "Garantir l'anonymat des signalements",
      "Protéger les lanceurs d'alerte contre les représailles",
      "Communiquer sur le dispositif de signalement",
      "Traiter tous les signalements dans un délai maximal de 72h"
    ],
    defaultSteps: [
      { title: "Dispositif", desc: "Créer le canal de signalement", completed: false },
      { title: "Procédure", desc: "Définir le processus de traitement", completed: false },
      { title: "Communication", desc: "Informer les employés", completed: false },
      { title: "Formation", desc: "Former les gestionnaires", completed: false }
    ]
  },
  // ==================== DOMAINE PHYSIQUE (A.7.1 à A.7.14) ====================
  'A.7.1': {
    recommendations: [
      "Délimiter clairement les zones sécurisées (data center, serveurs)",
      "Installer des barrières physiques (murs, clôtures)",
      "Matérialiser le périmètre par une signalétique visible",
      "Contrôler les accès aux zones sensibles",
      "Maintenir un registre des entrées dans les zones critiques"
    ],
    defaultSteps: [
      { title: "Cartographie", desc: "Identifier les zones sensibles", completed: false },
      { title: "Matérialisation", desc: "Installer signalétique et barrières", completed: false },
      { title: "Contrôle", desc: "Mettre en place le contrôle d'accès", completed: false },
      { title: "Registre", desc: "Créer le registre des entrées", completed: false }
    ]
  },
  'A.7.2': {
    recommendations: [
      "Installer un système de contrôle d'accès (badge, biométrie)",
      "Mettre en place des sas d'entrée pour les zones sensibles",
      "Former les employés à ne pas laisser entrer d'inconnus",
      "Désactiver les badges des départs immédiatement",
      "Auditer les logs d'accès mensuellement"
    ],
    defaultSteps: [
      { title: "Système", desc: "Choisir et installer le contrôle d'accès", completed: false },
      { title: "Badges", desc: "Distribuer les badges", completed: false },
      { title: "Procédure", desc: "Définir la gestion des badges", completed: false },
      { title: "Audit", desc: "Mettre en place la revue des logs", completed: false }
    ]
  },
  'A.7.3': {
    recommendations: [
      "Fermer à clé les bureaux et salles techniques",
      "Installer des serrures électroniques avec traçabilité",
      "Protéger les baies de brassage dans des armoires fermées",
      "Surveiller les zones sensibles par vidéo",
      "Maintenir une liste des personnes autorisées par zone"
    ],
    defaultSteps: [
      { title: "Sécurisation", desc: "Installer serrures et armoires", completed: false },
      { title: "Zonage", desc: "Définir les niveaux d'accès", completed: false },
      { title: "Caméras", desc: "Installer la vidéosurveillance", completed: false },
      { title: "Contrôle", desc: "Vérifier l'application", completed: false }
    ]
  },
  'A.7.4': {
    recommendations: [
      "Déployer un système de vidéosurveillance",
      "Conserver les images 30 jours minimum",
      "Surveiller les alarmes intrusion 24/7",
      "Désigner un responsable de la supervision",
      "Réaliser des tests hebdomadaires des alarmes"
    ],
    defaultSteps: [
      { title: "Installation", desc: "Pose des caméras", completed: false },
      { title: "Centralisation", desc: "Mettre en place la supervision", completed: false },
      { title: "Procédure", desc: "Définir la réponse aux alarmes", completed: false },
      { title: "Tests", desc: "Programmer les tests", completed: false }
    ]
  },
  'A.7.5': {
    recommendations: [
      "Protéger contre l'incendie (détecteurs, extincteurs)",
      "Installer des parafoudres et onduleurs",
      "Prévoir une climatisation pour les serveurs",
      "Éviter les zones inondables pour les équipements",
      "Réaliser un audit des risques environnementaux"
    ],
    defaultSteps: [
      { title: "Audit", desc: "Identifier les risques", completed: false },
      { title: "Équipements", desc: "Installer protections", completed: false },
      { title: "Maintenance", desc: "Planifier la maintenance", completed: false },
      { title: "Tests", desc: "Tester les équipements", completed: false }
    ]
  },
  'A.7.6': {
    recommendations: [
      "Afficher les règles de sécurité dans les zones",
      "Accompagner les visiteurs en zone sensible",
      "Interdire les photos dans les zones sécurisées",
      "Exiger le port de badge visible",
      "Débriefer les équipes après chaque incident"
    ],
    defaultSteps: [
      { title: "Règles", desc: "Afficher les consignes", completed: false },
      { title: "Visiteurs", desc: "Définir procédure d'accueil", completed: false },
      { title: "Formation", desc: "Former les équipes", completed: false },
      { title: "Contrôle", desc: "Surveiller l'application", completed: false }
    ]
  },
  'A.7.7': {
    recommendations: [
      "Exiger l'extinction des écrans en l'absence",
      "Ranger les documents sensibles dans des armoires fermées",
      "Interdire les documents papier sur les bureaux la nuit",
      "Utiliser des brouilleurs de confidentialité sur écrans",
      "Nettoyer les imprimantes des documents sensibles"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Rédiger la règle", completed: false },
      { title: "Sensibilisation", desc: "Former les employés", completed: false },
      { title: "Équipement", desc: "Fournir brouilleurs et armoires", completed: false },
      { title: "Contrôle", desc: "Surveiller l'application", completed: false }
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
      "Chiffrer les ordinateurs portables utilisés hors site",
      "Protéger les actifs transportés (valises sécurisées)",
      "Assurer les actifs mobiles contre le vol",
      "Interdire le stockage de données sensibles hors site non chiffrées",
      "Suivre la localisation des actifs mobiles"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister les actifs mobiles", completed: false },
      { title: "Chiffrement", desc: "Activer le chiffrement", completed: false },
      { title: "Assurance", desc: "Vérifier couverture", completed: false },
      { title: "Traçabilité", desc: "Mettre en place suivi", completed: false }
    ]
  },
  'A.7.10': {
    recommendations: [
      "Classifier les supports selon sensibilité",
      "Chiffrer les supports amovibles",
      "Détruire les supports par broyage ou incinération",
      "Tenir un registre des supports sensibles",
      "Limiter l'utilisation des clés USB"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir gestion supports", completed: false },
      { title: "Chiffrement", desc: "Déployer solution", completed: false },
      { title: "Destruction", desc: "Choisir prestataire", completed: false },
      { title: "Contrôle", desc: "Auditer utilisation", completed: false }
    ]
  },
  'A.7.11': {
    recommendations: [
      "Installer des onduleurs pour les équipements critiques",
      "Prévoir des groupes électrogènes",
      "Surveiller la qualité d'alimentation électrique",
      "Tester les onduleurs trimestriellement",
      "Maintenir des contrats de maintenance"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Identifier équipements critiques", completed: false },
      { title: "Onduleurs", desc: "Installer onduleurs", completed: false },
      { title: "Groupe", desc: "Prévoir si nécessaire", completed: false },
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
      "Planifier une maintenance préventive annuelle",
      "Signer des contrats de maintenance avec fournisseurs",
      "Traçabilité des interventions",
      "Vérifier les équipements après maintenance",
      "Maintenir des pièces de rechange critiques"
    ],
    defaultSteps: [
      { title: "Planning", desc: "Établir planning maintenance", completed: false },
      { title: "Contrats", desc: "Signer contrats", completed: false },
      { title: "Registre", desc: "Créer registre interventions", completed: false },
      { title: "Rechanges", desc: "Stocker pièces critiques", completed: false }
    ]
  },
  'A.7.14': {
    recommendations: [
      "Effacer sécurisé les disques avant réutilisation",
      "Détruire physiquement les disques défectueux",
      "Obtenir un certificat de destruction",
      "Suivre la traçabilité des équipements éliminés",
      "Utiliser des prestataires certifiés"
    ],
    defaultSteps: [
      { title: "Procédure", desc: "Définir processus", completed: false },
      { title: "Outil", desc: "Choisir outil d'effacement", completed: false },
      { title: "Prestataire", desc: "Sélectionner destructeur certifié", completed: false },
      { title: "Traçabilité", desc: "Mettre en place registre", completed: false }
    ]
  },
  // ==================== DOMAINE TECHNOLOGIQUE (A.8.1 à A.8.34) ====================
  'A.8.1': {
    recommendations: [
      "Chiffrer tous les postes de travail",
      "Activer le pare-feu local sur tous les postes",
      "Déployer un antivirus/EDR sur les postes",
      "Verrouiller automatiquement les postes après 5 min",
      "Interdire l'installation de logiciels non approuvés"
    ],
    defaultSteps: [
      { title: "Baseline", desc: "Définir configuration sécurisée", completed: false },
      { title: "Chiffrement", desc: "Activer BitLocker/FileVault", completed: false },
      { title: "EDR", desc: "Déployer solution", completed: false },
      { title: "GPO", desc: "Configurer verrouillage", completed: false }
    ]
  },
  'A.8.2': {
    recommendations: [
      "Utiliser des comptes d'administration dédiés",
      "Imposer MFA pour tous les comptes privilégiés",
      "Surveiller les actions des administrateurs",
      "Révoquer les privilèges après 90 jours si non utilisés",
      "Utiliser un PAM (Privileged Access Management)"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister comptes privilégiés", completed: false },
      { title: "PAM", desc: "Déployer solution PAM", completed: false },
      { title: "MFA", desc: "Activer MFA", completed: false },
      { title: "Surveillance", desc: "Mettre en place SIEM", completed: false }
    ]
  },
  'A.8.3': {
    recommendations: [
      "Appliquer le RBAC (Role-Based Access Control)",
      "Réviser les accès tous les 6 mois",
      "Utiliser des groupes de sécurité AD",
      "Journaliser tous les accès",
      "Mettre en place des workflows d'approbation"
    ],
    defaultSteps: [
      { title: "Modèle", desc: "Définir les rôles", completed: false },
      { title: "Groupes", desc: "Créer groupes AD", completed: false },
      { title: "Migration", desc: "Passer au RBAC", completed: false },
      { title: "Revue", desc: "Programmer revues", completed: false }
    ]
  },
  'A.8.4': {
    recommendations: [
      "Utiliser un gestionnaire de versions (Git)",
      "Restreindre l'accès en lecture seule",
      "Signer les commits avec GPG",
      "Scanner le code pour vulnérabilités",
      "Sauvegarder le code source hors site"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir forge logicielle", completed: false },
      { title: "Permissions", desc: "Configurer ACLs", completed: false },
      { title: "Scan", desc: "Intégrer SAST", completed: false },
      { title: "Backups", desc: "Configurer sauvegardes", completed: false }
    ]
  },
  'A.8.5': {
    recommendations: [
      "Déployer MFA sur tous les accès externes",
      "Utiliser SSO avec MFA",
      "Interdire les mots de passe faibles",
      "Mettre en place la biométrie pour les postes critiques",
      "Verrouiller après 5 échecs"
    ],
    defaultSteps: [
      { title: "MFA", desc: "Choisir solution MFA", completed: false },
      { title: "Déploiement", desc: "Déployer sur tous les accès", completed: false },
      { title: "Politique", desc: "Définir règles", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.6': {
    recommendations: [
      "Surveiller les ressources systèmes (CPU, RAM, disque)",
      "Planifier la capacité à 12 mois",
      "Mettre en place des alertes de saturation",
      "Dimensionner les environnements pour la croissance",
      "Automatiser l'ajustement de capacité (cloud)"
    ],
    defaultSteps: [
      { title: "Métriques", desc: "Définir indicateurs", completed: false },
      { title: "Supervision", desc: "Déployer outils", completed: false },
      { title: "Seuils", desc: "Configurer alertes", completed: false },
      { title: "Plan", desc: "Établir plan capacité", completed: false }
    ]
  },
  'A.8.7': {
    recommendations: [
      "Déployer un antivirus/EDR sur tous les postes",
      "Mettre à jour automatiquement les signatures",
      "Configurer des analyses programmées",
      "Interdire l'exécution de macros Office",
      "Former aux risques de phishing"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir EDR", completed: false },
      { title: "Déploiement", desc: "Installer sur tous postes", completed: false },
      { title: "Configuration", desc: "Configurer politiques", completed: false },
      { title: "Formation", desc: "Former utilisateurs", completed: false }
    ]
  },
  'A.8.8': {
    recommendations: [
      "Planifier des scans de vulnérabilités automatiques chaque semaine",
      "Définir des délais de correction (SLA) stricts selon la criticité",
      "Automatiser le déploiement des correctifs (Patch Management)",
      "Réaliser un test d'intrusion annuel par un prestataire externe",
      "Isoler du réseau les systèmes obsolètes ne pouvant être patchés"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir scanner vulnérabilités", completed: false },
      { title: "Scan", desc: "Identifier les failles critiques", completed: false },
      { title: "Patching", desc: "Appliquer les correctifs", completed: false },
      { title: "Pentest", desc: "Planifier test intrusion", completed: false }
    ]
  },
  'A.8.9': {
    recommendations: [
      "Utiliser des outils de gestion de configuration (Ansible, Chef)",
      "Maintenir des baselines sécurisées",
      "Détecter les dérives de configuration",
      "Automatiser la correction des configurations",
      "Versionner les configurations"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir outil IaC", completed: false },
      { title: "Baseline", desc: "Définir configurations sécurisées", completed: false },
      { title: "Déploiement", desc: "Appliquer aux systèmes", completed: false },
      { title: "Surveillance", desc: "Détecter dérives", completed: false }
    ]
  },
  'A.8.10': {
    recommendations: [
      "Définir des durées de rétention précises selon le RGPD",
      "Utiliser des outils d'effacement sécurisé certifiés",
      "Détruire physiquement les disques durs défectueux par broyage",
      "Mettre en place un script de purge automatique pour les logs",
      "Réaliser des contrôles inopinés pour vérifier la suppression"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir durées rétention", completed: false },
      { title: "Inventaire", desc: "Identifier les données hors délais", completed: false },
      { title: "Purge", desc: "Effacement définitif des supports", completed: false },
      { title: "Contrôle", desc: "Auditer suppression", completed: false }
    ]
  },
  'A.8.11': {
    recommendations: [
      "Anonymiser les données en environnement de test",
      "Utiliser des données synthétiques quand possible",
      "Masquer les données sensibles dans les logs",
      "Déployer un outil de data masking",
      "Auditer l'utilisation des données masquées"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir règles masquage", completed: false },
      { title: "Outil", desc: "Choisir solution", completed: false },
      { title: "Déploiement", desc: "Appliquer aux environnements", completed: false },
      { title: "Contrôle", desc: "Vérifier efficacité", completed: false }
    ]
  },
  'A.8.12': {
    recommendations: [
      "Déployer une solution DLP",
      "Classifier les données sensibles",
      "Bloquer l'exfiltration par email/USB",
      "Surveiller les transferts anormaux",
      "Former aux risques de fuite"
    ],
    defaultSteps: [
      { title: "DLP", desc: "Choisir solution", completed: false },
      { title: "Règles", desc: "Configurer politiques", completed: false },
      { title: "Déploiement", desc: "Installer sur postes", completed: false },
      { title: "Formation", desc: "Sensibiliser", completed: false }
    ]
  },
  'A.8.13': {
    recommendations: [
      "Sauvegarder quotidiennement les données critiques",
      "Tester la restauration mensuellement",
      "Maintenir des sauvegardes hors site",
      "Chiffrer les sauvegardes",
      "Documenter la procédure de restauration"
    ],
    defaultSteps: [
      { title: "Plan", desc: "Définir politique sauvegarde", completed: false },
      { title: "Outil", desc: "Déployer solution", completed: false },
      { title: "Tests", desc: "Tester restauration", completed: false },
      { title: "Documentation", desc: "Rédiger procédure", completed: false }
    ]
  },
  'A.8.14': {
    recommendations: [
      "Mettre en place du load balancing",
      "Prévoir des serveurs de secours",
      "Utiliser le cloud pour la redondance",
      "Tester le basculement annuellement",
      "Documenter l'architecture redondante"
    ],
    defaultSteps: [
      { title: "Analyse", desc: "Identifier SPOF", completed: false },
      { title: "Conception", desc: "Architecturer redondance", completed: false },
      { title: "Implémentation", desc: "Déployer", completed: false },
      { title: "Tests", desc: "Tester basculement", completed: false }
    ]
  },
  'A.8.15': {
    recommendations: [
      "Centraliser les logs dans un SIEM",
      "Conserver les logs 13 mois",
      "Protéger les logs contre modification",
      "Surveiller les logs en temps réel",
      "Mettre en place des alertes automatisées"
    ],
    defaultSteps: [
      { title: "SIEM", desc: "Choisir solution", completed: false },
      { title: "Collecte", desc: "Configurer collecte logs", completed: false },
      { title: "Rétention", desc: "Définir durée", completed: false },
      { title: "Alertes", desc: "Configurer règles", completed: false }
    ]
  },
  'A.8.16': {
    recommendations: [
      "Surveiller 24/7 les systèmes critiques",
      "Détecter les comportements anormaux",
      "Mettre en place des SOC ou MSSP",
      "Réagir aux alertes en < 1h",
      "Maintenir une base de référence"
    ],
    defaultSteps: [
      { title: "Outil", desc: "Choisir solution monitoring", completed: false },
      { title: "Déploiement", desc: "Installer sondes", completed: false },
      { title: "Base", desc: "Établir baseline", completed: false },
      { title: "Réponse", desc: "Définir procédure", completed: false }
    ]
  },
  'A.8.17': {
    recommendations: [
      "Utiliser NTP pour synchronisation",
      "Synchroniser sur pool.ntp.org ou équivalent",
      "Vérifier l'heure sur tous systèmes",
      "Auditer la synchronisation mensuellement",
      "Configurer plusieurs sources NTP"
    ],
    defaultSteps: [
      { title: "Serveur", desc: "Configurer NTP", completed: false },
      { title: "Clients", desc: "Configurer synchronisation", completed: false },
      { title: "Vérification", desc: "Auditer", completed: false },
      { title: "Redondance", desc: "Ajouter sources", completed: false }
    ]
  },
  'A.8.18': {
    recommendations: [
      "Restreindre l'utilisation des utilitaires",
      "Surveiller l'exécution d'utilitaires suspects",
      "Désactiver PowerShell si inutilisé",
      "Auditer les sessions administrateur",
      "Utiliser AppLocker"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister utilitaires", completed: false },
      { title: "Restriction", desc: "Configurer politiques", completed: false },
      { title: "Surveillance", desc: "Mettre en place logs", completed: false },
      { title: "Audit", desc: "Vérifier utilisation", completed: false }
    ]
  },
  'A.8.19': {
    recommendations: [
      "Maintenir une liste d'applications approuvées",
      "Interdire l'installation par utilisateurs",
      "Utiliser un outil de gestion des logiciels",
      "Scanner les logiciels installés",
      "Désinstaller les logiciels non conformes"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir règles", completed: false },
      { title: "Outil", desc: "Déployer gestionnaire", completed: false },
      { title: "Audit", desc: "Scanner existant", completed: false },
      { title: "Nettoyage", desc: "Supprimer non approuvés", completed: false }
    ]
  },
  'A.8.20': {
    recommendations: [
      "Segmenter le réseau en zones",
      "Mettre en place un pare-feu NextGen",
      "Configurer des ACLs strictes",
      "Surveiller le trafic réseau",
      "Désactiver les services inutilisés"
    ],
    defaultSteps: [
      { title: "Architecture", desc: "Concevoir segmentation", completed: false },
      { title: "Pare-feu", desc: "Déployer NGFW", completed: false },
      { title: "Règles", desc: "Configurer ACLs", completed: false },
      { title: "Surveillance", desc: "Mettre en place NDR", completed: false }
    ]
  },
  'A.8.21': {
    recommendations: [
      "Documenter les services réseau",
      "Définir des SLAs sécurité",
      "Signer des contrats avec niveaux de service",
      "Surveiller la disponibilité",
      "Auditer annuellement les services"
    ],
    defaultSteps: [
      { title: "Inventaire", desc: "Lister services", completed: false },
      { title: "SLA", desc: "Définir exigences", completed: false },
      { title: "Contrats", desc: "Négocier", completed: false },
      { title: "Surveillance", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.22': {
    recommendations: [
      "Créer des VLANs par fonction",
      "Isoler le Wi-Fi invité du réseau interne",
      "Séparer les environnements (prod, dev, test)",
      "Utiliser des DMZ pour services exposés",
      "Configurer des pare-feu entre zones"
    ],
    defaultSteps: [
      { title: "Zonage", desc: "Définir zones", completed: false },
      { title: "VLANs", desc: "Configurer", completed: false },
      { title: "Pare-feu", desc: "Mettre en place filtrage", completed: false },
      { title: "Tests", desc: "Valider isolation", completed: false }
    ]
  },
  'A.8.23': {
    recommendations: [
      "Déployer un proxy filtrant",
      "Bloquer les catégories à risque",
      "Autoriser uniquement les sites métier",
      "Surveiller les requêtes DNS",
      "Former aux risques Web"
    ],
    defaultSteps: [
      { title: "Solution", desc: "Choisir proxy", completed: false },
      { title: "Catégories", desc: "Définir filtrage", completed: false },
      { title: "Déploiement", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.24': {
    recommendations: [
      "Chiffrer les données sensibles au repos",
      "Chiffrer les flux réseau (TLS 1.3)",
      "Utiliser un HSM pour les clés",
      "Faire tourner les clés annuellement",
      "Documenter la politique cryptographique"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir règles crypto", completed: false },
      { title: "HSM", desc: "Déployer", completed: false },
      { title: "Gestion", desc: "Mettre en place processus clés", completed: false },
      { title: "Audit", desc: "Vérifier conformité", completed: false }
    ]
  },
  'A.8.25': {
    recommendations: [
      "Intégrer la sécurité dès la conception (DevSecOps)",
      "Former les développeurs à la sécurité",
      "Utiliser des outils SAST/DAST",
      "Réaliser des revues de code",
      "Documenter les exigences sécurité"
    ],
    defaultSteps: [
      { title: "Processus", desc: "Définir SDLC sécurisé", completed: false },
      { title: "Outils", desc: "Intégrer SAST/DAST", completed: false },
      { title: "Formation", desc: "Former développeurs", completed: false },
      { title: "Revues", desc: "Mettre en place code review", completed: false }
    ]
  },
  'A.8.26': {
    recommendations: [
      "Définir des exigences sécurité fonctionnelles",
      "Réaliser une analyse des risques applicatifs",
      "Valider les exigences avec le métier",
      "Tester la conformité aux exigences",
      "Maintenir un registre des exigences"
    ],
    defaultSteps: [
      { title: "Template", desc: "Créer modèle exigences", completed: false },
      { title: "Analyse", desc: "Identifier risques", completed: false },
      { title: "Validation", desc: "Faire approuver", completed: false },
      { title: "Tests", desc: "Vérifier conformité", completed: false }
    ]
  },
  'A.8.27': {
    recommendations: [
      "Adopter l'architecture Zero Trust",
      "Appliquer le principe de moindre privilège",
      "Utiliser la défense en profondeur",
      "Documenter l'architecture",
      "Réviser les principes annuellement"
    ],
    defaultSteps: [
      { title: "Principes", desc: "Définir", completed: false },
      { title: "Architecture", desc: "Concevoir", completed: false },
      { title: "Documentation", desc: "Rédiger", completed: false },
      { title: "Revue", desc: "Planifier révision", completed: false }
    ]
  },
  'A.8.28': {
    recommendations: [
      "Suivre les standards OWASP",
      "Valider toutes les entrées utilisateur",
      "Échapper les sorties",
      "Utiliser des requêtes paramétrées",
      "Former aux vulnérabilités Web"
    ],
    defaultSteps: [
      { title: "Guide", desc: "Documenter règles codage", completed: false },
      { title: "Formation", desc: "Former équipes", completed: false },
      { title: "Outils", desc: "Intégrer linters sécurité", completed: false },
      { title: "Revues", desc: "Vérifier conformité", completed: false }
    ]
  },
  'A.8.29': {
    recommendations: [
      "Intégrer tests sécurité dans CI/CD",
      "Réaliser des tests d'intrusion applicatifs",
      "Tester avant mise en production",
      "Automatiser les tests de non-régression sécurité",
      "Documenter les résultats"
    ],
    defaultSteps: [
      { title: "CI/CD", desc: "Intégrer tests", completed: false },
      { title: "Pentest", desc: "Planifier", completed: false },
      { title: "Automatisation", desc: "Configurer", completed: false },
      { title: "Reporting", desc: "Mettre en place", completed: false }
    ]
  },
  'A.8.30': {
    recommendations: [
      "Auditer les développements externalisés",
      "Exiger des livrables sécurité",
      "Restreindre l'accès aux données de production",
      "Signer des clauses de confidentialité",
      "Vérifier la conformité des sous-traitants"
    ],
    defaultSteps: [
      { title: "Clauses", desc: "Définir contrats", completed: false },
      { title: "Audit", desc: "Planifier audits", completed: false },
      { title: "Accès", desc: "Restreindre", completed: false },
      { title: "Livrables", desc: "Exiger documentation sécurité", completed: false }
    ]
  },
  'A.8.31': {
    recommendations: [
      "Isoler physiquement ou logiquement les environnements",
      "Utiliser des données anonymisées en test",
      "Interdire les accès production depuis dev",
      "Configurer des comptes séparés",
      "Auditer la séparation"
    ],
    defaultSteps: [
      { title: "Séparation", desc: "Isoler réseaux", completed: false },
      { title: "Comptes", desc: "Créer comptes dédiés", completed: false },
      { title: "Accès", desc: "Configurer restrictions", completed: false },
      { title: "Audit", desc: "Vérifier", completed: false }
    ]
  },
  'A.8.32': {
    recommendations: [
      "Mettre en place un ITIL/Change Management",
      "Documenter tous les changements",
      "Valider les changements en CAB",
      "Tester avant déploiement",
      "Prévoir un plan de retour arrière"
    ],
    defaultSteps: [
      { title: "Processus", desc: "Définir gestion changements", completed: false },
      { title: "Outil", desc: "Déployer outil ticketing", completed: false },
      { title: "CAB", desc: "Former comité", completed: false },
      { title: "Formation", desc: "Former équipes", completed: false }
    ]
  },
  'A.8.33': {
    recommendations: [
      "Ne pas utiliser de données réelles en test",
      "Anonymiser les données de test",
      "Protéger les jeux de données de test",
      "Détruire les données après test",
      "Auditer l'utilisation"
    ],
    defaultSteps: [
      { title: "Politique", desc: "Définir règles données test", completed: false },
      { title: "Anonymisation", desc: "Mettre en place", completed: false },
      { title: "Destruction", desc: "Configurer", completed: false },
      { title: "Audit", desc: "Vérifier", completed: false }
    ]
  },
  'A.8.34': {
    recommendations: [
      "Planifier les audits avec les équipes",
      "Isoler les tests d'audit",
      "Surveiller les activités d'audit",
      "Restaurer après audit",
      "Documenter les périmètres"
    ],
    defaultSteps: [
      { title: "Procédure", desc: "Définir", completed: false },
      { title: "Planification", desc: "Coordonner", completed: false },
      { title: "Isolation", desc: "Mettre en place", completed: false },
      { title: "Restauration", desc: "Prévoir rollback", completed: false }
    ]
  }
};

const DEFAULT_CONFIG = {
  recommendations: [
    "Analyser la cause racine de la non-conformité constatée",
    "Nommer un pilote responsable pour le pilotage de ce plan",
    "Définir un calendrier de mise en œuvre réaliste",
    "Documenter les preuves de correction (photos, logs, mails)",
    "Réaliser une vérification d'efficacité après clôture"
  ],
  defaultSteps: [{ title: "Diagnostic", desc: "Identifier les causes de l'écart", completed: false }]
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

  const addStep = async () => {
    const title = await appPrompt("Titre de la nouvelle étape :", {
      title: "Nouvelle étape",
      confirmText: "Ajouter",
      defaultValue: "",
    });
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
      console.error("Erreur : La fonction onSave n'a pas été passée au composant.");
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
                    <option value="NonDemarre">Non démarré</option>
                    <option value="EnCours">En cours</option>
                    <option value="Termine">Terminé</option>
                  </select>
              </div>
              <div>
                <label style={styles.label}>Priorité</label>
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
                <label style={styles.label}>Date d'échéance</label>
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
              <h3 style={styles.title}>Étapes du plan d'action</h3>
              <button onClick={addStep} style={{ ...styles.input, width: 'auto', padding: '5px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>+ Ajouter étape</button>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{completedSteps} / {formData.steps.length} étapes complétées</div>
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
                    <div style={{ fontSize: '13.5px', fontWeight: 800 }}>Étape {i+1} : {step.title}</div>
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
