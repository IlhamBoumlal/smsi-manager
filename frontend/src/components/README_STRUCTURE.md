# 📋 Architecture des Composants de Gestion des Contrôles ISO 27001

## ðŸ“ Fichiers Principaux

### 1. **Controles.jsx** - Tableau de Bord Principal
Composant React d'évaluation de conformité des contrôles ISO 27001 (Annexe A).

#### Structure Interne :
```
ðŸŽ¯ Configuration Globale
├── const API = 'http://localhost:5006/api/controles'
├── const T = { ... } // Thème de couleurs
├── const DOMAIN_THEMES { ... } // Styles par domaine
└── const STATUTS = [ ... ] // États de conformité

ðŸ› ï¸ Fonctions Utilitaires
├── hexToRgba() // Conversion couleur hex → rgba
├── StyledSelect() // Composant select personnalisé
├── StatutBadge() // Badge d'affichage du statut
├── KpiStrip() // Bande de KPIs statistiques
└── FilterBar() // Barre de filtrage par statut

ðŸŽ¨ Composant Principal
└── Controles()
    ├── STATE
    │   ├── controles : Array // Tous les contrôles
    │   ├── loading : Boolean // État de chargement
    │   ├── searchTerm : String // Recherche
    │   ├── activeTab : String // Filtre par statut
    │   ├── evaluationCtrl : Object // Contrôle en édition
    │   └── filterDomain : String // Filtre par domaine
    │
    ├── EFFETS
    │   └── useEffect() // Initialisation (fonts + fetch)
    │
    ├── FONCTIONS
    │   ├── fetchData() // Récupère les contrôles
    │   └── handleSaveEvaluation() // Sauvegarde l'évaluation
    │
    ├── CALCULS
    │   ├── totalControles // Nombre total
    │   ├── conformeCount // Conformes
    │   ├── nonConformeCount // Non-conformes
    │   ├── averageConformity // % de conformité
    │   └── stats // Objet de statistiques
    │
    ├── FILTRAGE
    │   ├── Filtre par recherche
    │   ├── Filtre par domaine
    │   └── Filtre par statut
    │
    └── AFFICHAGE
        ├── KpiStrip // Bandeau statistiques
        ├── Filtres domaines // Boutons domaines
        ├── Filtres statuts // Barre FilterBar
        ├── Recherche // Input search
        └── Grille contrôles // Affichage des cartes
```

#### Flux de Données :
```
1. Chargement (useEffect)
   ↓
2. Fetch API → Normalisation → Tri par code
   ↓
3. Affichage dans grille (cartes)
   ↓
4. Click sur contrôle → Ouverture EvaluationPanel
   ↓
5. Modification + Sauvegarde → PUT API
   ↓
6. Recharge données (fetchData)
```

#### Sélection Classée des Contrôles :
- **Domaines** : Organisationnel, Personnes, Physique, Technologique
- **Statuts** : NonEvalue, Conforme, Remarque, NCMineure, NCMajeure
- **Filtres** : Recherche textuelle (code + titre)

---

### 2. **PlanActionNC.js** - Gestion des Plans d'Action
Composant pour les plans d'action des non-conformités selon ISO 27001.

#### Structure Interne :
```
ðŸ“š Dictionnaire PLANS_ACTION
├── A.5.1 à A.5.37 (Organisationnel) → 37 contrôles
├── A.6.1 à A.6.8 (Personnes) → 8 contrôles
├── A.7.1 à A.7.14 (Physique) → 14 contrôles
└── A.8.1 à A.8.34 (Technologique) → 34 contrôles
    
    Chaque contrôle : {
      actionImmediate  : String // Mesure 24-72h
      causesRacines    : String // Analyse 5-pourquoi
      planCorrectif    : String // Actions numérotées
      verification     : String // Critères de preuve
      responsable      : String // Rôles responsables
      delai           : String // Durée (via delai())
    }

ðŸ”§ Outils
├── delai(months) // Calcule une date d'échéance
└── getDefaultPlan() // Plan générique fallback

6️⃣ 6 ÉTAPES DU PROCESSUS
├── Étape 1 : Identification de la NC
├── Étape 2 : Action immédiate (conservatoire)
├── Étape 3 : Analyse des causes (5-pourquoi)
├── Étape 4 : Plan correctif structuré
├── Étape 5 : Vérification par preuves
└── Étape 6 : Clôture et archivage

ðŸŽ¨ Composant Principal
└── PlanActionNC({ ctrl, statut, onChange })
    ├── STATE
    │   ├── currentStep : Number (1-6)
    │   └── plan : Object (tous les champs)
    │
    ├── FONCTIONS
    │   ├── update(key, val) // Met à jour le plan
    │   └── renderStep() // Affiche l'étape actuelle
    │
    └── AFFICHAGE
        ├── Navigation étapes (chevrons)
        ├── Contenu conditionnel par étape
        ├── Boutons action/cancel
        └── Indicateur de progression
```

#### Champs du Plan d'Action :
```
Métadonnées :
├── NcDescription // Description de la NC
├── Impact // Impact estimé
└── ncType // Type (mineure/majeure)

Action Immédiate (Étape 2) :
├── ActionImmediate // Texte de l'action
├── ResponsableImm // Responsable
└── DelaiActionImm // Délai

Causes (Étape 3) :
├── CausesRacines // Description détaillée
├── MethodeAnalyse // 5-pourquoi, Ishikawa, AMDEC
└── (icône pour chaque méthode)

Plan Correctif (Étape 4) :
├── PlanCorrectif // Actions numérotées
├── ResponsablePlan // Responsable principal
├── DateEcheance // Date cible
└── StatutPlan // En cours, En attente, Terminé, Annulé

Vérification (Étape 5) :
├── Preuves // Critères de vérification
├── Indicateurs // KPIs de mesure
└── DateVerification // Date prévue

Clôture (Étape 6) :
├── CommentaireCloture // Validation
├── CloturePar // Auditeur
└── DateCloture // Date réelle
```

---

## ðŸ”— Interaction Entre Composants

```
Controles.jsx
    ↓
    └─→ setEvaluationCtrl(ctrl)
         ↓
         └─→ EvaluationPanel (voir plus bas)
              ↓
              ├─ Étapes guide
              │
              └─ Si NC → PlanActionNC.js
                   ↓
                   └─→ onChange callback
                       ↓
                       └─→ handleSaveEvaluation()
                            ↓
                            └─→ PUT /api/controles/{id}
```

---

## 👥 Données de Base d'un Contrôle

```typescript
interface Controle {
  // Identité
  id: string
  code: string (ex: "A.5.1")
  titre: string
  description: string
  
  // Classification
  domaine: "Organisationnel" | "Personnes" | "Physique" | "Technologique"
  applicable: boolean | null
  
  // Évaluation
  statut: "NonEvalue" | "Conforme" | "Remarque" | "NCMineure" | "NCMajeure"
  
  // Justifications
  justificationApplicabilite?: string
  justificationConformite?: string
  remarque?: string
  
  // Plan d'action (si NC)
  ncDescription?: string
  impact?: string
  actionImmediate?: string
  causesRacines?: string
  planCorrectif?: string
  // ... autres champs plan d'action
}
```

---

## 🎨 Système de Couleurs

### Par Domaine :
- **Organisationnel** : Indigo (#4f46e5)
- **Personnes** : Vert (#059669)
- **Physique** : Orange (#ea580c)
- **Technologique** : Violet (#9333ea)

### Par Statut :
- **Conforme** : Vert clair (#f0fdf4, #059669)
- **NCMineure** : Ambre (#fffbeb, #d97706)
- **NCMajeure** : Rouge (#fef2f2, #dc2626)
- **NonEvalue** : Gris (#f9fafb, #6b7280)
- **Remarque** : Bleu (#eff6ff, #2563eb)

---

## 🔄 Flux d'une Évaluation

```
1. APPARITION DU PANNEAU
   └─ Contrôle sélectionné
   
2. ÉTAPE 1 : APPLICABILITÉ
   ├─ Oui → Applicable (continue vers étape 2)
   ├─ Non → Non applicable (justification + documents)
   └─ ? → Indéfini (peut modifier plus tard)

3. ÉTAPE 2 : JUSTIFICATION (si applicable)
   └─ Texte + documents prouvant l'applicabilité

4. ÉTAPE 3 : STATUT
   ├─ Conforme → Passer à justification de conformité
   ├─ Remarque → Détailler l'observation
   ├─ NC Mineure/Majeure → Proposer plan d'action
   └─ NonEvalue → Reste à évaluer

5. ÉTAPE 4 : PREUVES (selon statut)
   ├─ Si Conforme : Preuves de conformité
   ├─ Si Remarque : Détails de l'observation
   └─ Si NC : 6 étapes du plan (voir PlanActionNC.js)

6. SAUVEGARDE
   └─ PUT /api/controles/{id} avec tous les champs
   └─ Recharge des données
   └─ Fermeture du panneau
```

---

## 📊 KPIs Affichés

```
┌─────────────────────────────────────────────────────┐
│ 1. CONFORMITÉ GLOBALE (%) + Barre de progression  │
│ 2. CONTRÔLES CONFORMES (nb) + Non-conformes       │
│ 3. NC MINEURES (nb) + NC majeure                  │
│ 4. ACTIONS EN RETARD (nb) + En cours              │
└─────────────────────────────────────────────────────┘
```

---

## ðŸš€ Points de Personnalisation

### Ajouter un Contrôle :
1. Trouver le domaine (A.5, A.6, A.7, A.8)
2. Créer un objet dans `PLANS_ACTION` avec la structure complète
3. Le plan générique s'appliquera automatiquement si oublié

### Modifier les Couleurs :
```javascript
const T = { ... }               // Couleurs globales
const DOMAIN_THEMES = { ... }   // Par domaine
const STATUTS = [ ... ]         // Par statut
```

### Ajouter un Filtre :
1. Ajouter un `useState` pour le nouvel état
2. Modifier la fonction `filtered` de filtrage
3. Ajouter un bouton de contrôle dans l'interface

---

## ⚠️ Points d'Attention

1. **Normalisation des données** : Les champs du backend peuvent avoir différents formats (camelCase, PascalCase)
2. **Token d'authentification** : Récupéré depuis `localStorage.getItem('token')`
3. **Gestion des états multi-étapes** : Navigation fluide entre les 6 étapes du plan
4. **Performances** : La liste peut contenir 93 contrôles → animations et virtualisation
5. **Responsive** : Tests sur mobile (filtres, cartes, panneau)

---

## ðŸ“š Ressources

- **ISO 27001 Annexe A** : https://www.iso.org/standard/54534.html
- **Norme sur les plans d'action** : ISO 14644-1 (sérialisation)
- **Format de date** : YYYY-MM-DD (ISO 8601)
- **Police** : Google Fonts "Sora" (400, 600, 700, 800)

