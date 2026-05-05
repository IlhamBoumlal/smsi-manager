# 📋 PRODUCT BACKLOG JIRA - SMSI Manager

**Projet** : SMSI Manager  
**Période** : 10/02/2025 au 10/06/2025 (8 Sprints de 15 jours)  
**Date création** : 28 avril 2026  
**Statut** : En cours (60% réalisé)

---

## 🎯 ÉPICS

### **EPIC MP-01** — Étude de projet (Sprint 1)
**Durée** : 10/02 - 24/02/2025  
**Objectif** : Fonder la solution sur des bases solides

- **US-001** — Définir le périmètre fonctionnel
  - Description : Documenter les modules à livrer
  - Modules : Auth, Users, Profils, Permissions, Sociétés, Actifs, Cartographie, Contrôles, Audits, Incidents, Risques, Documentation, Sensibilisation, PDCA, Dashboard,etc.
  - Critères d'acceptation :
    - ✅ Liste modules complète avec description

- **US-002** — Valider l'architecture technique
  - Description : Formaliser stack, patterns et contraintes
  - Critères d'acceptation :
    - ✅ Stack validée : React 19 + Tailwind / .NET 9 + EF Core
    - ✅ Architecture CQRS + Clean
    - ✅ JWT + RBAC + permissions

- **US-003** — Configurer l'environnement projet
  - Description : repo Git/GitHub, outils, IDEs
  - Critères d'acceptation :
    - ✅ Board Jira créé (6 epics, workflows)
    - ✅ branches définis
    - ✅ Repo local clône et fonctionnel

- **US-004** — Collecter les besoins métier
  - Description : formalisation besoins
  - Critères d'acceptation :
    - ✅ Document besoins métier validé
    - ✅ Cas d'usage critiques listés
    - ✅ Contraintes de sécurité/compliance ISO 27001 identifiées
    - ✅ Risques techniques documentés

---

### **EPIC MP-02** — Mise en place de l'environnement (Sprint 2)
**Durée** : 25/02 - 10/03/2025  
**Objectif** : Détailler l'architecture et les contrats

- **US-005** — Spécifier les modules fonctionnellement
  - Description : Fiche module pour chaque domaine
  - Contenu :
    - Authentification & Gestion utilisateurs
    - Gestion des rôles & permissions
    - Gestion multi-société & isolation
    - Contrôles ISO & évaluations
    - Plans d'action & non-conformités
    - Audits & incidents
    - Cartographie & risques
    - Documentation & sensibilisation
  - Critères d'acceptation :
    - ✅ Fiches module complètes
    - ✅ User stories métier détaillées
    - ✅ Critères d'acceptation clairs

- **US-006** — Modéliser l'architecture CQRS + Clean
  - Description : Définir les flux CQRS et la structure en couches Clean Architecture pour chaque module fonctionnel.
  - Critères d'acceptation :
   ### 🟦 Domain Layer
    - ✅ Entités métier définies
    - ✅ Interfaces des Repositories définies

    ### 🟨 Application Layer
    - ✅ DTOs d'entrée (Request) et de sortie (Response) définis par module
    - ✅ Commandes CQRS listées par module
    - ✅ Requêtes CQRS listées par module
    - ✅ Handlers associés à chaque commande et requête documentés
    - ✅ Règles de validation spécifiées par commande

    ### 🟩 Infrastructure Layer
    - ✅ Implémentations des Repositories documentées
    - ✅ ORM / accès base de données définis

    ### 🟥 Presentation Layer
    - ✅ Controllers REST organisés par module

- **US-007** — Concevoir le schéma API et base de données
  - Description : Routes REST et modèle données
  - Critères d'acceptation :
    - ✅ Diagramme ER / schéma SQL
    - ✅ Routes API CRUD par module (GET/POST/PUT/DELETE)


- **US-008** — Définir la sécurité et permissions RBAC
  - Description : Détailler JWT, rôles, droits module par module
  - Critères d'acceptation :
    - ✅ Rôles définis (Super Admin, Admin société, Auditeur, utilisateur standard, RSSI)
    - ✅ Permissions par module + actions listées
    - ✅ Claim SocieteId dans JWT
    - ✅ Cas d'accès inter-société rejetés

- **US-009** — Documentaliser les cas d'usage clés
  - Description : Use cases détaillés + diagrammes séquence
  - Contenu :
    - Login + gestion session
    - Création/modification contrôle + évaluation
    - Création audit + découverte incident
    - Plans d'action et clôture
    - Reporting/dashboard
  - Critères d'acceptation :
    - ✅ 10+ use cases détaillés
    - ✅ Diagrammes séquence critiques
    - ✅ Scénarios happy path + erreurs

---

### **EPIC MP-03** — Conception des interfaces utilisateurs (Sprint 3)
**Durée** : 11/03 - 25/03/2025  
**Objectif** : Visualiser la solution UX et l'architecture détaillée

- **US-010** — Créer les wireframes principaux
  - Description : Écrans clés du parcours utilisateur
  - Écrans :
    - Login / Dashboard
    - Navigation modules
    - Écran de tous les modules (grille + détail + évaluation)

  - Critères d'acceptation :
    - ✅ wireframes de qualité
    - ✅ Navigation UX cohérente

- **US-011** — Concevoir les parcours utilisateurs
  - Description : Flux utilisateur détaillés
  - Critères d'acceptation :
    - ✅ 5+ parcours documentés (Les parcours utilisateurs ont été documentés à travers
                    des maquettes et prototypes interactifs réalisés sous Figma.)
    - ✅ Points de décision clairs
    - ✅ États de chargement/erreur


---

### **EPIC MP-04** — Développement Backend (Sprint 4-7)
**Durée** : 26/03 - 24/05/2025 (4 sprints × 15 jours)  
**Objectif** : Implémenter une API stable et sécurisée

#### **Sprint 4 (26/03 - 09/04) : Architecture CQRS + Fondations**

- **US-013** — Mettre en place l'architecture Clean + CQRS
  - Description : Structure projet .NET + dossiers + patterns
  - Tâches :
    - ✅ Projet .NET 8 + EF Core migrations
    - ✅ Dossier Domain/ : Entities, Enumerations, Interfaces
    - ✅ Dossier Application/ : Commands, Queries, DTOs, Handlers, Mappers
    - ✅ Dossier Infrastructure/ : Repositories, Services, Data context
    - ✅ Dossier API/ : Controllers, Middleware, Logging
    - ✅ Configuration MediatR + AutoMapper + Dependency Injection
    - ✅ appsettings par environnement (dev, test, prod)
  - Critères :
    - ✅ Projet compile sans erreurs
    - ✅ Migrations initiales créées
    - ✅ Seed data injecté

- **US-014** — Implémenter les bases (Auth + Users + Sociétés)
  - Description : Fondations authentification et isolation
  - Tâches :
    - ✅ Modèle User + Societe (Domain layer)
    - ✅ DTOs UserDto, SocieteDto (Application layer)
    - ✅ Commands : LoginCommand, RegisterCommand, CreateSocieteCommand
    - ✅ Queries : GetUserQuery, GetSocieteQuery
    - ✅ Handlers avec logique métier
    - ✅ Repository IUserRepository, ISocieteRepository
    - ✅ JWT Service + token generation
    - ✅ Tests unitaires handlers + repository
  - Critères :
    - ✅ Login/logout fonctionnel
    - ✅ JWT contient SocieteId
    - ✅ Tests coverage > 80%

- **US-015** — Implémenter Rôles, Profils et Permissions
  - Description : RBAC complet + isolation données
  - Tâches :
    - ✅ Entités Role, Permission, RolePermission (Domain)
    - ✅ DTOs RoleDto, PermissionDto
    - ✅ Commands : CreateRoleCommand, GrantPermissionCommand, RevokePermissionCommand
    - ✅ Queries : GetRolesQuery, GetPermissionsQuery
    - ✅ Handlers + Repositories
    - ✅ Middleware vérification claim SocieteId
    - ✅ Validation : endpoint rejette accès inter-société
    - ✅ Tests intégration sécurité
  - Critères :
    - ✅ Permissions appliquées par module
    - ✅ Super Admin > Admin société> RSSI > Auditeur > Utilisateur Standard


#### **Sprint 5 (10/04 - 24/04) : Modules Critiques (Contrôles, Plans d'Action, Clauses, Audits)**

- **US-016** — Implémenter le module Contrôles
  - Description : Gestion des contrôles ISO 27001 + évaluations
  - Tâches :
    - ✅ Entité Controle + Evaluation (Domain)
    - ✅ Domaines : Organisationnel, Personnes, Physique, Technologique
    - ✅ Statuts : NonEvalue, Conforme, NCMineure, NCMajeure, Remarque
    - ✅ DTOs ControleDto, EvaluationDto
    - ✅ Commands : CreateControleCommand, EvaluateControleCommand
    - ✅ Queries : GetControlesQuery, GetControleByIdQuery
    - ✅ Handlers + Repositories avec filtrage par SocieteId
    - ✅ Filtres : par domaine, statut, société, recherche texte
    - ✅ Pagination (10/25/50 items)
    - ✅ Traçabilité : DateModification, ModifiePar, DateCreation, CreePar
    - ✅ Tests unitaires + intégration
  - Critères :
    - ✅ 93 contrôles ISO intégrés et queryables
    - ✅ Évaluation multi-critères persistée
    - ✅ Audit trail complet

- **US-017** — Implémenter le module Plans d'Action
  - Description : Gestion des plans d'action et non-conformités (6 étapes)
  - Tâches :
    - ✅ Entités PlanAction, EtapePlan (Domain)
    - ✅ 6 étapes : Identification, Action immédiate, Causes, Plan correctif, Vérification, Clôture
    - ✅ DTOs PlanActionDto, EtapePlanDto
    - ✅ Commands : CreatePlanActionCommand, UpdateEtapePlanCommand, ClosePlanActionCommand
    - ✅ Queries : GetPlansActionQuery, GetPlanActionDetailQuery
    - ✅ Handlers + Repositories
    - ✅ Statut plan : EnCours, EnAttente, Terminé, Annulé
    - ✅ Responsabilité et délais
    - ✅ Tests unitaires flux 6 étapes
  - Critères :
    - ✅ Plans d'action pré-configurés par contrôle
    - ✅ Cycle de vie complet fonctionnel
    - ✅ Audit trail détaillé

- **US-018** — Implémenter le module Audits
  - Description : Gestion des audits internes/externes
  - Tâches :
    - ✅ Entités Audit, AuditControle, Constat (Domain)
    - ✅ DTOs AuditDto, ConstatDto
    - ✅ Commands : CreateAuditCommand, CreateConstatCommand, CloseAuditCommand
    - ✅ Queries : GetAuditsQuery, GetAuditDetailQuery
    - ✅ Statut audit : Planifié, EnCours, Clôturé
    - ✅ Liens audit → contrôles → plans d'action
    - ✅ Tests intégration
  - Critères :
    - ✅ Audit complet tracé
    - ✅ Constats liés à contrôles
    - ✅ Génération automatique plans d'action

#### **Sprint 6 (25/04 - 09/05) : Modules Complémentaires (Incidents, Risques, Actifs)**

- **US-019** — Implémenter le module Incidents
  - Description : Gestion incidents de sécurité
  - Tâches :
    - ✅ Entités Incident, IncidentClassification (Domain)
    - ✅ DTOs IncidentDto
    - ✅ Commands : ReportIncidentCommand, InvestigateIncidentCommand, CloseIncidentCommand
    - ✅ Queries : GetIncidentsQuery, GetIncidentDetailQuery
    - ✅ Statut : Déclaré, En investigation, Clôturé
    - ✅ Sévérité : Critique, Haute, Moyenne, Basse
    - ✅ Lien incident → plans d'action automatique
  - Critères :
    - ✅ Cycles de vie incidents complets
    - ✅ Alertes sévérité Critique

- **US-020** — Implémenter le module Risques
  - Description : Gestion des risques de sécurité
  - Tâches :
    - ✅ Entités Risque, EvaluationRisque (Domain)
    - ✅ Matrice probabilité/impact (4×4)
    - ✅ DTOs RisqueDto
    - ✅ Commands : CreateRisqueCommand, EvaluateRisqueCommand
    - ✅ Queries : GetRisquesQuery, GetMatriceRisquesQuery
    - ✅ Liens risques → contrôles → plans d'action
    - ✅ Statut risque : Identifié, Accepté, Mitigé, Transféré, Traité
  - Critères :
    - ✅ Cartographie risques complète et queryable
    - ✅ Heatmap probabilité/impact

- **US-021** — Implémenter les modules Cartographie + Actifs
  - Description : Cartographie processus + inventaire patrimoine informatique
  - Tâches :
    - ✅ Entités Processus, ProcessusControle (Domain)
    - ✅ Flux données entre processus
    - ✅ Entités Actif, TypeActif (Domain)
    - ✅ Propriétaire, propriétaire données, responsable sécurité
    - ✅ Classification sensibilité (Public, Interne, Confidentiel, Restreint)
    - ✅ DTOs ProcessusDto, ActifDto
    - ✅ Commands + Queries pour CRUD
    - ✅ Lien actifs ↔ risques
  - Critères :
    - ✅ Cartographie processus navigable
    - ✅ Inventaire actifs complet

#### **Sprint 7 (10/05 - 24/05) : Modules Transversaux + Dashboard + Qualité**

- **US-022** — Implémenter les modules transversaux
  - Description : Documentation, Sensibilisation, PDCA
  - Tâches :
    - ✅ Module Documentation : CRUD documents, versioning
    - ✅ DTOs DocumentationDto
    - ✅ Stockage fichiers structuré
    - ✅ Module Sensibilisation : campagnes de formation, attestations
    - ✅ DTOs SensibilisationDto
    - ✅ Module PDCA : cycles Plan-Do-Check-Act avec timeline
    - ✅ DTOs PdcaDto
    - ✅ Commands et Queries pour chaque module
  - Critères :
    - ✅ Tous modules transversaux fonctionnels
    - ✅ Gestion versions documentation

- **US-024** — Implémenter Dashboard et Reporting
  - Description : KPIs, graphiques, export données
  - Tâches :
    - ✅ Query KpiDashboardQuery (réturne stats globales)
    - ✅ Stats : conformité %, NC par domaine, plans d'action en retard, incidents critiques
    - ✅ Query ReportingQuery (filtres par société, période)
    - ✅ Export Excel/PDF (contrôles, audits, incidents)
    - ✅ Graphiques : tendances conformité, distribution risques
  - Critères :
    - ✅ Dashboard temps réel et performant
    - ✅ Exports Excel valides

- **US-025** — Qualité backend et tests
  - Description : Tests unitaires, intégration, seed data, logging
  - Tâches :
    - ✅ Tests unitaires handlers (couverture > 80%)
    - ✅ Tests intégration API (Postman collections)
    - ✅ Seed data complet : 100 contrôles + 5 audits + 10 incidents + risques
    - ✅ Vérification migrations EF Core
    - ✅ Logging structuré (Serilog) sur chaque handler
    - ✅ Exception handling centralisé
    - ✅ API documentation OpenAPI/Swagger
  - Critères :
    - ✅ Code coverage > 75% (critères + handlers)
    - ✅ Tous les tests passent
    - ✅ API conforme OpenAPI 3.0
    - ✅ Seed data importable en 1 commande

---

### **EPIC MP-05** — Développement Frontend (Sprint 4-7)
**Durée** : 26/03 - 24/05/2025 (4 sprints × 15 jours)  
**Objectif** : Interface utilisateur complète et intuitive

#### **Sprint 4 (26/03 - 09/04) : Fondations Frontend**

- **US-026** — Mettre en place l'architecture frontend
  - Description : Structure React + Tailwind + routing
  - Tâches :
    - ✅ Create React App + Tailwind CSS 3
    - ✅ Structure `src/` : components/, pages/, services/, context/, hooks/
    - ✅ React Router v6 + PrivateRoute
    - ✅ axios instance centralisée
    - ✅ Context API pour auth + user + société
    - ✅ env config (API_URL par environnement)
  - Critères :
    - ✅ Projet compile sans warnings
    - ✅ Routes basiques fonctionnelles
    - ✅ Structure respectée par tous les développeurs

- **US-027** — Implémenter l'authentification frontend
  - Description : Login, logout, token management
  - Tâches :
    - ✅ Écran Login avec email/password + validation
    - ✅ Stockage token localStorage (sécurisé)
    - ✅ Refresh token automatique via interceptor
    - ✅ Redirection /login si session expirée
    - ✅ PrivateRoute pour pages protégées
    - ✅ Gestion erreur login (credentials, timeout)
  - Critères :
    - ✅ Login → dashboard fonctionnel
    - ✅ Logout clé session proprement
    - ✅ Token refresh transparent

#### **Sprint 5 (10/04 - 24/04) : Écrans Métier Prioritaires**

- **US-028** — Créer Dashboard et navigation
  - Description : Écran d'accueil + menu modules
  - Tâches :
    - ✅ Dashboard : KPIs conformité (%), plans d'action en retard, audits récents, incidents critiques
    - ✅ Cartes statistiques : NonEvalues, Conformes, NC, Risques élevés
    - ✅ Header avec profil utilisateur + déconnexion
    - ✅ Sidebar navigation modules (tous 15 modules listés)
    - ✅ Responsive mobile/tablet/desktop
    - ✅ Dark mode support (optionnel mais nice-to-have)
  - Critères :
    - ✅ Layout cohérent sur tous écrans
    - ✅ Navigation fluide et rapide
    - ✅ Accessibilité WCAG 2.1 AA minimal

- **US-029** — Implémenter l'écran Contrôles
  - Description : Grille, filtres, évaluation, traçabilité
  - Tâches :
    - ✅ Tableau contrôles (93 ISO 27001)
    - ✅ Colonnes : Code, Titre, Domaine, Statut, DateModification, ModifiePar
    - ✅ Filtres : domaine (dropdown), statut (badge), société, recherche full-text
    - ✅ Pagination/scroll infini (choisir un)
    - ✅ Détail contrôle + évaluation modal (6 critères)
    - ✅ KPI bande supérieure (total, %, NonEvalues, etc.)
    - ✅ Affichage traçabilité (qui a modifié, quand)
    - ✅ Performance : charge 100+ contrôles fluide
  - Critères :
    - ✅ Charge 93 contrôles en < 2s
    - ✅ Filtres performants
    - ✅ Modal évaluation ergonomique

- **US-030** — Implémenter l'écran Plans d'Action
  - Description : 6 étapes, édition, cycles de vie
  - Tâches :
    - ✅ Accès depuis écran Contrôles (button "Créer/Voir plan")
    - ✅ Modal multi-étapes (6 onglets ou chevrons)
    - ✅ Étape 1 : Sélection contrôle + description NC
    - ✅ Étape 2 : Action immédiate (24-72h)
    - ✅ Étape 3 : Analyse causes (5-pourquoi)
    - ✅ Étape 4 : Plan correctif (actions numérotées)
    - ✅ Étape 5 : Vérification (critères de preuve)
    - ✅ Étape 6 : Clôture (signature auditeur)
    - ✅ Champs pré-remplis par contrôle sélectionné
    - ✅ Sauvegarde progressive (ne pas perdre données)
    - ✅ Affichage responsable + délai
  - Critères :
    - ✅ UX 6 étapes fluide (pas d'abandon)
    - ✅ Sauvegarde brouillon entre visites
    - ✅ Validation champs requis

#### **Sprint 6 (25/04 - 09/05) : Écrans Audits, Incidents, Risques**

- **US-031** — Implémenter l'écran Audits
  - Description : Créer, lister, détailler, constats
  - Tâches :
    - ✅ Liste audits filtrée (statut, période, auditeur, société)
    - ✅ Colonnes : Code audit, Date, Auditeur, Statut, Contrôles testés
    - ✅ Création audit (bouton + modal) : titre, date, auditeur, étendue (checkboxes contrôles)
    - ✅ Détail audit : liste contrôles testés, constats associés
    - ✅ Ajout constats (observation + lien contrôle → plans d'action)
    - ✅ Clôture audit (signature, commentaires)
    - ✅ Téléchargement rapport audit (PDF)
  - Critères :
    - ✅ Cycle audit complet tracé
    - ✅ Constats automatiquement créent plans d'action

- **US-032** — Implémenter l'écran Incidents
  - Description : Reporter, investiguer, clôturer incidents
  - Tâches :
    - ✅ Formulaire signalement incident (titre, description, sévérité, découverte date)
    - ✅ Liste incidents filtrée (sévérité, statut, période)
    - ✅ Tableau : Code, Date, Titre, Sévérité (couleurs), Statut, Responsable
    - ✅ Détail + investigation (timeline, actions, responsable)
    - ✅ Liaison incident → plans d'action automatique (sévérité Critique)
    - ✅ Clôture incident (analyse post-mortem)
  - Critères :
    - ✅ Incidents traçables bout à bout
    - ✅ Sévérité Critique génère alertes

- **US-033** — Implémenter l'écran Risques
  - Description : Matrice risques, évaluation, mitigation
  - Tâches :
    - ✅ Matrice probabilité/impact (4×4)
    - ✅ Heatmap couleur (vert, jaune, orange, rouge)
    - ✅ Clic cellule = liste risques pour ce niveau
    - ✅ Détail risque : description, impact, mitigation par contrôles
    - ✅ Graphs trends risques (évolution) si données historiques
    - ✅ Lien risques → contrôles → plans d'action
  - Critères :
    - ✅ Vue cartographie intuitive
    - ✅ Matrice performante (calculée côté client si < 500 risques)

#### **Sprint 7 (10/05 - 24/05) : Modules Complémentaires + Qualité**

- **US-034** — Implémenter l'écran Cartographie & Actifs
  - Description : Processus et patrimoine informatique
  - Tâches :
    - ✅ Cartographie processus : diagramme flux (visuel ou liste)
    - ✅ Liste actifs avec classification (Public/Interne/Confidentiel/Restreint)
    - ✅ Détail actif : propriétaire, responsable sécurité, description
    - ✅ Liens actifs ↔ risques
    - ✅ Export inventaire (CSV/Excel)
  - Critères :
    - ✅ Visualisation claire processus
    - ✅ Inventaire complet

- **US-035** — Implémenter Documentation, Sensibilisation, PDCA
  - Description : Modules transversaux
  - Tâches :
    - ✅ Onglet Documentation : upload docs, versioning (v1, v2, etc.)
    - ✅ Onglet Sensibilisation : liste campagnes, attestation (checkbox par utilisateur)
    - ✅ Onglet PDCA : cycles avec timeline Plan → Do → Check → Act
    - ✅ CRUD basique pour chaque module
  - Critères :
    - ✅ Modules fonctionnels
    - ✅ Pas de blocage pour test

- **US-036** — Implémenter configuration Sociétés, Utilisateurs, Permissions
  - Description : Admin super-utilisateur
  - Tâches :
    - ✅ Onglet Sociétés (Admin) : CRUD sociétés
    - ✅ Onglet Utilisateurs : CRUD utilisateurs (affectation société)
    - ✅ Onglet Rôles/Permissions : matrice rôles × modules × actions
    - ✅ Interface contrôle d'accès intuitive (cases à cocher)
    - ✅ Gestion des profils (Admin, Manager, Auditeur, Collaborateur)
  - Critères :
    - ✅ Admin complet du système
    - ✅ Sans erreur d'isolation

- **US-037** — Intégration API et gestion erreurs
  - Description : Appels API, notifications, retry
  - Tâches :
    - ✅ Service API centralisé (src/services/api.js)
    - ✅ Axios interceptors pour JWT + refresh token
    - ✅ Toast notifications (succès/erreur/warning) via Toastr ou similaire
    - ✅ Spinner loading pendant fetch (skeleton screens si possible)
    - ✅ Validation formulaires côté client (email, required, etc.)
    - ✅ Retry réseau (exponential backoff)
    - ✅ Timeout 30s + fallback message
  - Critères :
    - ✅ UX fluide en cas erreur API
    - ✅ Messages clairs utilisateur
    - ✅ Pas de perte données en cas erreur

- **US-038** — Tests frontend et optimisation
  - Description : Tests unitaires, E2E, perf
  - Tâches :
    - ✅ Tests unitaires composants clés (Controles, Dashboard, Login)
    - ✅ Tests E2E scénario complet (si temps : login → contrôle → plan d'action → sauvegarde)
    - ✅ Optimisation images (lazy loading)
    - ✅ Code splitting par route (React.lazy)
    - ✅ Lighthouse audit : score > 85
    - ✅ Accessibilité WCAG 2.1 AA minimal (focus management, alt text)
  - Critères :
    - ✅ Tests coverage > 70% (composants critiques)
    - ✅ Lighthouse > 85
    - ✅ Pas d'erreurs console en production

---

### **EPIC MP-06** — Intégration frontend & backend (Sprint 4-7)
**Durée** : 26/03 - 24/05/2025  
**Objectif** : Vérifier les flux cross-module et industrialiser l'intégration

- **US-039** — Intégrer backend et frontend
  - Description : Connecter les écrans aux APIs et valider les workflows
  - Tâches :
    - ✅ Valider les contrats API (request/response)
    - ✅ Intégrer l'authentification end-to-end
    - ✅ Relier états backend et UI pour : contrôles, plans d'action, audits, incidents, risques, cartographie, actifs
    - ✅ Gérer correctement les erreurs API en UI
    - ✅ Mettre en place des tests E2E pour les flux critiques
    - ✅ Vérifier l'isolation SocieteId dans les appels frontend
  - Critères :
    - ✅ Flux login → contrôle → plan d'action → audit fonctionnel
    - ✅ Erreurs API affichées de façon explicite
    - ✅ 0 rupture de flux entre backend et frontend

- **US-040** — Mettre en place CI/CD et pipeline d'intégration
  - Description : Automatiser les builds, tests et déploiement de préprod
  - Tâches :
    - ✅ Configuration pipeline CI (GitHub Actions, Azure DevOps ou équivalent)
    - ✅ Build automatisé backend + frontend
    - ✅ Exécution tests unitaires + tests d'intégration
    - ✅ Déploiement en environnement staging
    - ✅ Smoke tests automatiques après déploiement
    - ✅ Publication Swagger/OpenAPI pour validation
  - Critères :
    - ✅ Pipeline build vert
    - ✅ Déploiement staging fonctionnel
    - ✅ Tests automatisés exécutés avec succès

---

### **EPIC MP-07** — Tests & Déploiement (Sprint 8)
**Durée** : 25/05 - 10/06/2025  
**Objectif** : Assurance qualité et mise en production

- **US-041** — Plan de tests et cas de test
  - Description : Scénarios de test par module
  - Contenu :
    - Authentification + gestion session
    - Contrôles + évaluation + plans d'action
    - Audits + constats
    - Incidents + risques
    - Permissions + isolation multi-société
    - Reporting + export
    - Charge et performance
  - Critères :
    - ✅ 100+ cas de test rédigés
    - ✅ Matrice de traçabilité user story ↔ tests

- **US-042** — Recette fonctionnelle et tests d'intégration
  - Description : Exécution tests, relevé bugs
  - Tâches :
    - ✅ Tests manuels tous les modules
    - ✅ Vérification multi-société isolation
    - ✅ Vérification permissions RBAC
    - ✅ Tests API (Postman collections)
    - ✅ Vérification traçabilité (audit logs)
    - ✅ Relevé bugs avec reproduction steps
  - Critères :
    - ✅ Tous bugs P0/P1 correctifs avant prod
    - ✅ Test reports signés

- **US-043** — Correction anomalies et validation
  - Description : Trier, fixer bugs, re-tester
  - Tâches :
    - ✅ Backlog bugs triés par gravité
    - ✅ Fix P0/P1 itération 1
    - ✅ Regression tests
    - ✅ Sign-off par QA
  - Critères :
    - ✅ 0 bugs P0 en prod
    - ✅ P1 < 5

- **US-044** — Préparation déploiement
  - Description : Build, config, documentation
  - Tâches :
    - ✅ Build frontend (npm run build)
    - ✅ Build backend (dotnet publish)
    - ✅ Config environnements (dev/test/prod)
    - ✅ Setup BDD (migrations)
    - ✅ Checklist déploiement
    - ✅ Guide utilisateur / mode opératoire
    - ✅ Scripts rollback
  - Critères :
    - ✅ Builds reproductibles
    - ✅ Documentation complète

- **US-045** — Déploiement et validation post-prod
  - Description : Mise en production + vérification
  - Tâches :
    - ✅ Déploiement serveur/cloud
    - ✅ Smoke tests post-déploiement
    - ✅ Vérification données intégrées
    - ✅ Vérification auth + permissions
    - ✅ Monitoring activé (logs, alertes)
    - ✅ Notification utilisateurs
    - ✅ Support utilisateur J1-J7
  - Critères :
    - ✅ App stable et accessible
    - ✅ 0 incident critique

---

## 📊 Vue synthétique des tickets

| Épic | Story | Type | Sprint | Priorié |
|------|-------|------|--------|---------|
| MP-01 | US-001 | Story | 1 | P0 |
| MP-01 | US-002 | Story | 1 | P0 |
| MP-01 | US-003 | Story | 1 | P0 |
| MP-01 | US-004 | Story | 1 | P0 |
| MP-02 | US-005 | Story | 2 | P0 |
| MP-02 | US-006 | Story | 2 | P0 |
| MP-02 | US-007 | Story | 2 | P0 |
| MP-02 | US-008 | Story | 2 | P0 |
| MP-02 | US-009 | Story | 2 | P1 |
| MP-03 | US-010 | Story | 3 | P1 |
| MP-03 | US-011 | Story | 3 | P1 |
| MP-03 | US-012 | Story | 3 | P1 |
| MP-04 | US-013 | Story | 4 | **P0 - CRITIQUE** |
| MP-04 | US-014 | Story | 4 | **P0 - CRITIQUE** |
| MP-04 | US-015 | Story | 4 | **P0 - CRITIQUE** |
| MP-04 | US-016 | Story | 5 | P0 |
| MP-04 | US-017 | Story | 5 | P0 |
| MP-04 | US-018 | Story | 5 | P0 |
| MP-04 | US-019 | Story | 6 | P1 |
| MP-04 | US-020 | Story | 6 | P1 |
| MP-04 | US-021 | Story | 6 | P2 |
| MP-04 | US-022 | Story | 7 | P2 |
| MP-04 | US-024 | Story | 7 | P1 |
| MP-04 | US-025 | Story | 7 | P0 |
| MP-05 | US-026 | Story | 4 | **P0 - CRITIQUE** |
| MP-05 | US-027 | Story | 4 | **P0 - CRITIQUE** |
| MP-05 | US-028 | Story | 5 | P0 |
| MP-05 | US-029 | Story | 5 | P0 |
| MP-05 | US-030 | Story | 5 | P0 |
| MP-05 | US-031 | Story | 6 | P0 |
| MP-05 | US-032 | Story | 6 | P1 |
| MP-05 | US-033 | Story | 6 | P1 |
| MP-05 | US-034 | Story | 7 | P2 |
| MP-05 | US-035 | Story | 7 | P2 |
| MP-05 | US-036 | Story | 7 | P1 |
| MP-05 | US-037 | Story | 7 | P0 |
| MP-05 | US-038 | Story | 7 | P1 |
| MP-06 | US-039 | Story | 4-7 | P0 |
| MP-06 | US-040 | Story | 4-7 | P0 |
| MP-07 | US-041 | Story | 8 | P0 |
| MP-07 | US-042 | Story | 8 | P0 |
| MP-07 | US-043 | Story | 8 | P0 |
| MP-07 | US-044 | Story | 8 | P0 |
| MP-07 | US-045 | Story | 8 | P0 |

---

## 🎯 Dépendances critiques

```
US-001, US-002, US-003, US-004
    ↓ (après validation architecture)
US-005, US-006, US-007, US-008
    ↓ (contrats clairs)
US-013 (Architecture CQRS + Clean) ← BLOQUANT pour tout backend
    ↓
US-014, US-015 (Auth + RBAC) ← Bloque tous modules
    ↓
US-016 → US-017 → US-018 → US-019 → US-020 (modules métier)

US-026 (Structure React) ← BLOQUANT pour tout frontend
    ↓
US-027 (Auth frontend) ← Bloque accès modules
    ↓
US-028 → US-029 → US-030 → US-031 (écrans métier)

US-025 (Tests backend) et US-037 (Intégration frontend) ← Peuvent être parallèles
    ↓
US-039, US-040 (Intégration) ← Recette initiale
    ↓
US-041, US-042, US-043 ← Validation fonctionnelle
    ↓
US-044, US-045 ← Déploiement
```

---

## 🚀 Recommandations d'exécution

### **Criticalité par phase**

1. **Sprint 1-2 (Spécification)** : Validation architecture CQRS + Clean
2. **Sprint 3 (UX/UML)** : Wireframes et diagrammes
3. **Sprint 4 (Démarrage)** : 
   - Backend : US-013 (CQRS setup) → US-014 (Auth) → US-015 (RBAC)
   - Frontend : US-026 (structure) → US-027 (auth)
4. **Sprint 5 (Modules critiques)** : 
   - Backend : US-016 (Contrôles), US-017 (Plans), US-018 (Audits)
   - Frontend : US-028-030 (Dashboard, Contrôles, Plans)
5. **Sprint 6 (Modules complémentaires)** : 
   - Backend : US-019 (Incidents), US-020 (Risques), US-021 (Cartographie/Actifs)
   - Frontend : US-031-033 (Audits, Incidents, Risques)
6. **Sprint 7 (Intégration & Qualité)** : 
   - Backend : US-022 (Doc/Sensib/PDCA), US-024 (Dashboard), US-025 (Tests)
   - Frontend : US-034-038 (Modules restants + Tests)
   - Cross-cutting : US-039-040 (Intégration frontend/backend)
7. **Sprint 8 (Tests/Prod)** : 
   - Backend : US-041-045 (Recette, corrections, déploiement)
   - Frontend : validation finale + smoke tests

### **Points de contrôle**

- **Fin sprint 2** : Architecture + spécifications validées
- **Fin sprint 3** : UX/UML approuvés
- **Fin sprint 4** : Backend authentification + frontend structure fonctionnels
- **Fin sprint 5** : Modules critiques (Contrôles, Plans, Audits) vérifiés
- **Fin sprint 6** : Tous modules métier implémentés
- **Fin sprint 7** : Zéro bugs P0, validations complètes
- **Fin sprint 8** : Production stable

---

## 📝 Notes d'implémentation

- **Architecture CQRS** : Tous handlers doivent avoir tests > 80% coverage
- **Isolation multi-société** : Vérifier SocieteId à chaque endpoint (middleware + handler)
- **Traçabilité** : Tous contrôles/audits/plans doivent avoir DateModification + ModifiePar
- **Tests** : Couvrir happy path + erreurs + cas limites
- **Performance** : Pagination obligatoire, indexes BDD sur SocieteId

---

**Dernière mise à jour** : 28 avril 2026  
**Statut** : Prêt pour import Jira  
**Version** : 2.0
