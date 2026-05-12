# 📋 Guide d'intégration - Cartographie Processus + Clauses/Contrôles ISO 27001

## ✅ Modifications complétées

### Backend (.NET/C#)
- ✅ **Créé** : `Domain/Entities/ProcessusControle.cs` - Table pivot M2M
- ✅ **Créé** : `Domain/Entities/ProcessusClause.cs` - Table pivot M2M
- ✅ **Modifié** : `Domain/Entities/Processus.cs` - Ajout collections et méthodes
- ✅ **Modifié** : `Domain/Entities/Controle.cs` - Ajout collection inverse
- ✅ **Modifié** : `Infrastructure/Data/AppDbContext.cs` - Configuration DbSets + OnModelCreating
- ✅ **Créé** : DTOs pour réponses API
  - `Application/DTOs/Cartographie/ControleAssocieDto.cs`
  - `Application/DTOs/Cartographie/ClauseAssocieeDto.cs`
  - `Application/DTOs/Cartographie/ProcessusDetailDto.cs`
- ✅ **Créé** : Commands MediatR
  - `Application/Cartographie/Commands/ProcessusControleCommands.cs`
  - `Application/Cartographie/Commands/ProcessusClauseCommands.cs`
- ✅ **Créé** : Queries MediatR
  - `Application/Cartographie/Queries/GetProcessusControlesQuery.cs`
  - `Application/Cartographie/Queries/GetProcessusClausesQuery.cs`
  - `Application/Cartographie/Queries/GetProcessusDetailQuery.cs`
  - `Application/Cartographie/Queries/GetAllControlesForSelectionQuery.cs`
  - `Application/Cartographie/Queries/GetAllClausesForSelectionQuery.cs`
- ✅ **Modifié** : `API/Controllers/CartographieController.cs` - Nouveaux endpoints

### Frontend (React)
- ✅ **Modifié** : `src/api/cartographie.js` - Nouvelles fonctions API
- ✅ **Modifié** : `src/components/CartographieProcessus.jsx`
  - Imports des nouvelles API
  - États pour contrôles/clauses
  - Chargement des référentiels à l'initialisation
  - Affichage des clauses et contrôles associés dans le panneau détail
  - Panneaux de sélection pour ajouter clauses/contrôles
  - Boutons pour supprimer les associations
  - CSS pour les nouveaux éléments UI

## 🚀 Prochaines étapes

### 1. Appliquer la migration EF Core

**Windows (PowerShell dans le dossier backend):**

```powershell
cd backend
dotnet ef migrations add AddProcessusControleClauseRelations
dotnet ef database update
```

**Linux/Mac:**

```bash
cd backend
dotnet ef migrations add AddProcessusControleClauseRelations
dotnet ef database update
```

### 2. Redémarrer le backend

```bash
dotnet run
```

### 3. Tester l'application

1. **Naviguer vers** : `/cartographie`
2. **Cliquer sur un processus** pour ouvrir le panneau détail
3. **Vous devriez voir** :
   - Section "Clauses ISO 27001" avec liste vide initialement
   - Section "Contrôles associés" avec liste vide initialement
   - Boutons "Ajouter une clause" et "Ajouter un contrôle"
4. **Cliquer sur les boutons** pour voir les panneaux de sélection
5. **Sélectionner** une clause ou un contrôle pour l'associer

## 📊 Nouveaux Endpoints API

### Clauses

```http
GET    /api/cartographie/processus/{processusId}/clauses
POST   /api/cartographie/processus/{processusId}/clauses/{clauseId}
DELETE /api/cartographie/processus/{processusId}/clauses/{clauseId}
GET    /api/cartographie/clauses-selection
```

### Contrôles

```http
GET    /api/cartographie/processus/{processusId}/controles
POST   /api/cartographie/processus/{processusId}/controles/{controleId}
DELETE /api/cartographie/processus/{processusId}/controles/{controleId}
GET    /api/cartographie/controles-selection
```

### Détail Complet

```http
GET    /api/cartographie/processus/{processusId}/detail
```

## 🗂️ Structure des données renvoyées

### GetProcessusControles

```json
[
  {
    "id": "guid",
    "code": "A.5.1",
    "titre": "Politique de sécurité",
    "description": "...",
    "domaine": "Politiques",
    "statut": "Conforme",
    "justification": null,
    "associatedAt": "2026-05-11T10:30:00Z"
  }
]
```

### GetProcessusClauses

```json
[
  {
    "id": 1,
    "number": "5.1",
    "title": "Politique de sécurité",
    "description": "...",
    "justification": null,
    "associatedAt": "2026-05-11T10:30:00Z"
  }
]
```

## 🔍 Points importants

1. **Relations Many-to-Many** : Utilisées via tables pivot (ProcessusControle, ProcessusClause)
2. **Suppression en cascade** : Si un processus est supprimé, les associations sont supprimées aussi
3. **Isolation multi-sociétés** : Les données sont filtrées par `SocieteId`
4. **Validation des permissions** : Seuls les utilisateurs autorisés peuvent ajouter/supprimer
5. **Ordre de chargement** : Les clauses sont chargées en premier (triées par numéro)

## ⚠️ Troubleshooting

### Les clauses/contrôles ne s'affichent pas
- ✅ Vérifiez que la migration a été appliquée (`dotnet ef database update`)
- ✅ Vérifiez que le backend est redémarré
- ✅ Vérifiez les logs du navigateur (F12) et du backend

### Les boutons "Ajouter" ne fonctionnent pas
- ✅ Vérifiez vos permissions (module "cartographie")
- ✅ Vérifiez que le processus est bien sélectionné (`activeId` n'est pas null)

### La migration échoue
- ✅ Vérifiez la syntaxe du fichier AppDbContext.cs
- ✅ Vérifiez que vous êtes dans le bon répertoire (`backend/backend`)
- ✅ Vérifiez la chaîne de connexion dans `appsettings.json`

## 📝 Notes de développement

- Les fichiers créés/modifiés suivent la structure existante de l'application
- Les nouveaux endpoints suivent les conventions REST existantes
- Les styles CSS suivent la convention de nommage existante (préfixe `cx-`)
- Les DTOs utilisant `record` (C# 9+) pour l'immuabilité

## 🎯 Fonctionnalités futures possibles

1. Afficher les clauses/contrôles en lecture seule dans la cartographie (sans modification)
2. Bulk operations pour associer plusieurs contrôles à la fois
3. Filtrage/recherche dans les panneaux de sélection
4. Export de la cartographie avec clauses/contrôles associés
5. Validation croisée (un contrôle doit être associé à au moins une clause)
