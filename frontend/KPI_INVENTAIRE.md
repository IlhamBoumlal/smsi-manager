# KPI Inventory (All App Pages)

Generated from routed pages in `frontend/src/App.js`.
Encoding note: ASCII-only text to avoid mojibake/encoding issues.

## 1) Main Functional Pages

### `/tableau-bord` -> `dashboard/ExecutiveDashboard`
- Global compliance
- Critical signals
- Control pass rate
- Document approval
- PDCA completion
- Training attendance

Source: `frontend/src/components/dashboard/useExecutiveDashboardData.js` (kpis array)

### `/controles` -> `Controles`
- Conformite globale
- Controles conformes
- NC Mineure
- Actions en retard

Source: `frontend/src/components/Controles.jsx` (`KpiStrip`)

### `/clauses` -> `ClausesDashboard`
- Conformite globale
- Clauses conformes
- Plans d'action
- Actions en retard

Source: `frontend/src/components/ClausesDashboard.jsx` (`KpiStrip`)

### `/clauses/:id` -> `ClauseDetail`
- Sous-clauses
- Plans d'action
- Termines
- En cours
- Conformite globale (score ring)

Source: `frontend/src/components/ClauseDetail.jsx` (hero stats + `ScoreRing`)

### `/actifs` -> `GestionActifs`
- Conformite globale
- Actifs recenses
- Actifs primaires
- A revoir

Source: `frontend/src/components/GestionActifs.jsx` (top stat cards)

### `/documentation` -> `Documentation`
- Conformite globale
- Documents approuves
- En validation
- A revoir

Source: `frontend/src/components/Documentation.jsx` (`statCards`)

### `/pdca` -> `Progression`
- Conformite PDCA
- Actions terminees
- Plan (Phase P)
- Do (Phase D)
- Check (Phase C)
- Act (Phase A)

Source: `frontend/src/components/Progression.jsx` (`KpiStrip`)

### `/audits` -> `Audits`
- Audits planifies
- Planifies
- En cours
- Termines
- NC Ouvertes
- Simulations

Source: `frontend/src/components/Audits.jsx` (top KPI cards array)

### `/sensibilisation` -> `sensibilisation`
- Taux de participation
- Formations totales
- Planifiees
- En cours

Source: `frontend/src/components/sensibilisation.jsx` (`KpiStrip`)

### `/incidents` -> `GestionIncidents`
- Total incidents
- En cours
- Resolus

Source: `frontend/src/components/GestionIncidents.jsx` (top stat cards)

## 2) Risk Module Pages

### `/risques` -> `RiskStudiesPage`
- Progression moyenne
- Etudes
- En cours
- Ateliers a valider
- Etudes terminees

Source: `frontend/src/components/risques/RiskStudiesPage.jsx`

### `/risques/etudes/:id` -> `RiskStudyDetailPage`
Global KPI strip:
- Progression globale
- Ateliers termines
- A valider
- Ateliers bloques

Workshop card KPIs (contextual by workshop):
- Workshop 1: Etapes, Missions, Evt redoutes
- Workshop 2: Etapes, Couples retenus, Sources
- Workshop 3: Etapes, Parties prenantes, Scenarios strat.
- Workshop 4: Etapes, Modes operatoires, Scenarios op.
- Workshop 5: Etapes, Risques registre, Risques critiques

Source: `frontend/src/components/risques/RiskStudyDetailPage.jsx`

### `/risques/etudes/:id/atelier/:atelierId` -> `RiskWorkshopPage`
- Finalisation atelier
- Etape active
- Etapes configurees

Source: `frontend/src/components/risques/RiskWorkshopPage.jsx`

## 3) Admin Pages

### `/admin/stats` -> `Admin/DashboardAdmin`
- Total utilisateurs
- Comptes actifs
- Comptes inactifs
- Nouveaux (30 jours)
- Societes
- Holdings

Source: `frontend/src/components/Admin/DashboardAdmin.jsx`

### `/admin/holdings` -> `Admin/GestionHoldings`
Current UI also contains the same 6 KPI cards:
- Total utilisateurs
- Comptes actifs
- Comptes inactifs
- Nouveaux (30 jours)
- Societes
- Holdings

Source: `frontend/src/components/Admin/GestionHoldings.jsx`

## 4) Routed Pages Without KPI Cards

- `/cartographie` (`CartographieProcessus`)
- `/gestion-risque` (redirect component)
- `/admin/utilisateurs` (`GestionUtilisateurs`)
- `/admin/societes` (`GestionSocietes`)
- `/login`, `/`, `/accueil`

## 5) Totals

- KPI items listed above (including contextual risk workshop KPIs and duplicate admin holdings cards): **85**
- Distinct pages with KPI display: **15**
