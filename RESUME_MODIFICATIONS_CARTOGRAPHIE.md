# 🎯 Résumé Exécutif - Cartographie Processus + Clauses/Contrôles ISO 27001

## 🎨 Nouvelles Fonctionnalités

### 1. Affichage des Clauses Associées
- **Où** : Panneau détail droit (section "Clauses ISO 27001")
- **Affiche** : Numéro de clause + Titre
- **Actions** : 
  - 👁️ Voir les clauses associées
  - ➕ Ajouter une clause (si permission d'écriture)
  - ❌ Supprimer une association (si permission de suppression)

### 2. Affichage des Contrôles Associés
- **Où** : Panneau détail droit (section "Contrôles associés")
- **Affiche** : Code + Titre + Domaine + Statut
- **Actions** :
  - 👁️ Voir les contrôles associés
  - ➕ Ajouter un contrôle (si permission d'écriture)
  - ❌ Supprimer une association (si permission de suppression)

### 3. Panneaux de Sélection Intégrés
- **Déclenchement** : Cliquer sur "Ajouter une clause" ou "Ajouter un contrôle"
- **Affichage** : Liste scrollable des clauses/contrôles disponibles
- **Sélection** : Un clic pour associer
- **Fermeture** : Cliquer sur le bouton à nouveau ou sélectionner une association

### 4. Organisation dans le Panneau Détail
Le panneau détail droitaffiche maintenant 3 sections en cascade :
1. **Description du processus** (existant)
2. **Clauses ISO 27001** (nouveau)
3. **Contrôles associés** (nouveau)
4. **Documents associés** (existant)

## 📊 Archithecture des modifications

```
┌─────────────────────────────────────────┐
│         FRONTEND (React)                │
├─────────────────────────────────────────┤
│ CartographieProcessus.jsx               │
│  ├─ États pour contrôles/clauses       │
│  ├─ Appel API pour référentiels        │
│  ├─ Panneau détail amélioré            │
│  └─ Sélection + suppression            │
│                                         │
│ cartographie.js (API)                   │
│  ├─ getProcessusControles()            │
│  ├─ getProcessusClauses()              │
│  ├─ addControleToProcessus()           │
│  ├─ removeControleFromProcessus()      │
│  ├─ addClauseToProcessus()             │
│  ├─ removeClauseFromProcessus()        │
│  ├─ getAllControlesForSelection()      │
│  └─ getAllClausesForSelection()        │
└────────────────────┬────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────┐
│      BACKEND (C# / ASP.NET Core)       │
├─────────────────────────────────────────┤
│ CartographieController.cs               │
│  ├─ GET /processus/{id}/clauses        │
│  ├─ POST /processus/{id}/clauses/{cid} │
│  ├─ DELETE /processus/{id}/clauses/{c} │
│  ├─ GET /processus/{id}/controles      │
│  ├─ POST /processus/{id}/controles/{id}│
│  ├─ DELETE /processus/{id}/controles/  │
│  ├─ GET /clauses-selection             │
│  ├─ GET /controles-selection           │
│  └─ GET /processus/{id}/detail         │
│                                         │
│ MediatR Queries/Commands                │
│  ├─ GetProcessusControlesQuery         │
│  ├─ GetProcessusClausesQuery           │
│  ├─ AddControleToProcessusCommand      │
│  ├─ RemoveControleFromProcessusCommand │
│  ├─ AddClauseToProcessusCommand        │
│  ├─ RemoveClauseFromProcessusCommand   │
│  ├─ GetAllControlesForSelectionQuery   │
│  └─ GetAllClausesForSelectionQuery     │
│                                         │
│ DTOs (Cartographie)                     │
│  ├─ ControleAssocieDto                 │
│  ├─ ClauseAssocieeDto                  │
│  ├─ ProcessusDetailDto                 │
│  ├─ ControleSelectDto                  │
│  └─ ClauseSelectDto                    │
└────────────────────┬────────────────────┘
                     │ EF Core
┌────────────────────▼────────────────────┐
│      DATABASE (SQL Server)              │
├─────────────────────────────────────────┤
│ Tables existantes                       │
│  ├─ Processus                           │
│  ├─ Controle                            │
│  ├─ IsoClause                           │
│  └─ ...                                 │
│                                         │
│ Nouvelles tables (Pivot)                │
│  ├─ ProcessusControles (M2M)           │
│  └─ ProcessusClauses (M2M)             │
└─────────────────────────────────────────┘
```

## 🔄 Flux de données

### Affichage initial
```
1. Utilisateur clique sur un processus
2. selectProc() déclenche:
   - getProcessusControles(processusId)
   - getProcessusClauses(processusId)
3. Données mises en cache dans controlesClauses{}
4. Rendu du panneau détail avec les listes
```

### Ajout d'une association
```
1. Utilisateur clique "Ajouter une clause"
2. Panneau de sélection s'affiche
3. Utilisateur clique sur une clause
4. addClauseAssociation() déclenche:
   - addClauseToProcessus(processusId, clauseId)
   - getProcessusClauses(processusId) [rechargement]
5. Liste mise à jour dans le UI
6. Panneau de sélection se ferme automatiquement
```

### Suppression d'une association
```
1. Utilisateur clique sur le bouton ❌ d'une clause
2. removeClauseAssociation() déclenche:
   - removeClauseFromProcessus(processusId, clauseId)
   - État local mis à jour en direct
3. L'association disparaît de la liste
```

## 📝 Données retournées

### GET /processus/{id}/clauses
```json
[
  {
    "id": 5,
    "number": "5.1",
    "title": "Policies for information security",
    "description": "Organization must establish...",
    "justification": null,
    "associatedAt": "2026-05-11T10:30:00.000Z"
  }
]
```

### GET /processus/{id}/controles
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "A.5.1.1",
    "titre": "Politique de sécurité informatique",
    "description": "Une politique doit être définie...",
    "domaine": "Politiques",
    "statut": "Conforme",
    "justification": null,
    "associatedAt": "2026-05-11T10:30:00.000Z"
  }
]
```

### GET /clauses-selection
```json
[
  {
    "id": 1,
    "number": "5",
    "title": "Organization of information security"
  },
  {
    "id": 5,
    "number": "5.1",
    "title": "Policies for information security"
  }
]
```

### GET /controles-selection
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "A.5.1.1",
    "titre": "Politique de sécurité informatique",
    "domaine": "Politiques",
    "statut": "Conforme"
  }
]
```

## 🛡️ Sécurité & Permissions

### Contrôle d'accès
- ✅ Lecture (canRead) : Affichage des clauses/contrôles
- ✅ Écriture (canWrite) : Ajouter des associations
- ✅ Suppression (canDelete) : Supprimer des associations

### Isolation multi-sociétés
- Chaque association stocke un `SocieteId`
- Les requêtes filtre automatiquement par société de l'utilisateur
- Pas de risque de fuite de données entre sociétés

### Validation des données
- Vérification que le processus existe
- Vérification que la clause/contrôle existe
- Vérification que l'association n'existe pas déjà (UK sur ProcessusId + ControleId)

## 🚀 Performance

### Optimisations
- ✅ Chargement des référentiels une seule fois au montage
- ✅ Cache local des contrôles/clauses par processus
- ✅ Indices uniques pour éviter les doublons
- ✅ Indices FK pour les jointures rapides

### Limitations
- ❌ Si un processus a >1000 clauses : sera lent à afficher
  - **Solution future** : Pagination ou virtualisation

## 📚 Documentation

Voir aussi :
- [MODIFICATION_CARTOGRAPHIE_PROCESSUS.md](./MODIFICATION_CARTOGRAPHIE_PROCESSUS.md) - Guide technique complet
- [GUIDE_MIGRATION_PROCESSUS_CLAUSE_CONTROLE.md](../backend/GUIDE_MIGRATION_PROCESSUS_CLAUSE_CONTROLE.md) - Migration EF Core

## ✨ Améliorations futures

- [ ] Bulk operations (associer plusieurs à la fois)
- [ ] Recherche/filtre dans les panneaux de sélection
- [ ] Justification texte pour chaque association
- [ ] Historique des associations (qui a associé, quand)
- [ ] Export cartographie avec clauses/contrôles
- [ ] Graphique montrant la couverture clauses/contrôles
