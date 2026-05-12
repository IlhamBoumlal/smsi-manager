# ✅ Checklist de validation - Modifications Cartographie Processus

## 📋 Pré-conditions

- [ ] Backend C# accessible et fonctionnel
- [ ] Frontend React accessible et fonctionnel
- [ ] SQL Server accessible et migré
- [ ] Utilisateur avec permissions `cartographie` (read/write/delete)

## 🔧 Installation Backend

### Étape 1 : Migration EF Core
- [ ] Ouvert le terminal dans `backend/backend`
- [ ] Exécuté : `dotnet ef migrations add AddProcessusControleClauseRelations`
- [ ] Vérifié que le fichier migration est créé dans `Migrations/`
- [ ] Exécuté : `dotnet ef database update`
- [ ] Vérifié que les 2 nouvelles tables sont créées en BD

### Étape 2 : Fichiers créés/modifiés
- [ ] ✅ `Domain/Entities/ProcessusControle.cs` - Créé
- [ ] ✅ `Domain/Entities/ProcessusClause.cs` - Créé
- [ ] ✅ `Domain/Entities/Processus.cs` - Modifié (collections + méthodes)
- [ ] ✅ `Domain/Entities/Controle.cs` - Modifié (collection inverse)
- [ ] ✅ `Infrastructure/Data/AppDbContext.cs` - Modifié (DbSets + OnModelCreating)
- [ ] ✅ `Application/DTOs/Cartographie/*.cs` - 3 fichiers créés
- [ ] ✅ `Application/Cartographie/Commands/*.cs` - 2 fichiers créés
- [ ] ✅ `Application/Cartographie/Queries/*.cs` - 5 fichiers créés
- [ ] ✅ `API/Controllers/CartographieController.cs` - Modifié (8 nouveaux endpoints)

### Étape 3 : Redémarrage
- [ ] Compilé le projet : `dotnet build`
- [ ] Démarré le backend : `dotnet run`
- [ ] Vérifié les logs (pas d'erreur de démarrage)
- [ ] Testé la santé de l'API : `http://localhost:5006/health`

## 🎨 Installation Frontend

### Étape 1 : Fichiers modifiés
- [ ] ✅ `src/api/cartographie.js` - Modifié (11 nouvelles fonctions)
- [ ] ✅ `src/components/CartographieProcessus.jsx` - Modifié
  - [ ] Imports actualisés
  - [ ] Nouveaux états ajoutés
  - [ ] useEffect pour charger les référentiels
  - [ ] selectProc modifiée (chargement contrôles/clauses)
  - [ ] Fonctions d'ajout/suppression ajoutées
  - [ ] Panneau détail amélioré
  - [ ] CSS pour nouveaux éléments

### Étape 2 : Déploiement
- [ ] Frontend recompilé : `npm run build`
- [ ] Frontend redémarré : `npm start`
- [ ] Vérifié l'absence d'erreurs console (F12)

## 🧪 Tests fonctionnels

### Test 1 : Affichage initial
- [ ] Navigué vers `/cartographie`
- [ ] Cartographie affichée correctement
- [ ] Processus visibles (Management, Réalisation, Support)

### Test 2 : Sélection d'un processus
- [ ] Cliqué sur un processus
- [ ] Panneau détail s'ouvre à droite
- [ ] Description du processus visible
- [ ] Responsable affiché

### Test 3 : Affichage des clauses
- [ ] Section "Clauses ISO 27001" visible dans le panneau
- [ ] Compteur affiche "0" (aucune clause associée initialement)
- [ ] Message "Aucune clause" affiché
- [ ] Bouton "Ajouter une clause" visible

### Test 4 : Ajout d'une clause
- [ ] Cliqué sur "Ajouter une clause"
- [ ] Panneau de sélection s'affiche
- [ ] Liste des clauses visible
- [ ] Au clic sur une clause, l'association s'ajoute
- [ ] Panneau de sélection se ferme automatiquement
- [ ] La clause apparaît dans la liste
- [ ] Compteur passe à "1"

### Test 5 : Affichage des contrôles
- [ ] Section "Contrôles associés" visible
- [ ] Compteur affiche "0"
- [ ] Message "Aucun contrôle" affiché
- [ ] Bouton "Ajouter un contrôle" visible

### Test 6 : Ajout d'un contrôle
- [ ] Cliqué sur "Ajouter un contrôle"
- [ ] Panneau de sélection affiche liste des contrôles
- [ ] Au clic, l'association s'ajoute
- [ ] Contrôle affiche : Code + Titre + Domaine + Statut
- [ ] Compteur passe à "1"

### Test 7 : Suppression d'une association
- [ ] Cliqué sur le bouton ❌ d'une clause
- [ ] Clause disparaît de la liste
- [ ] Compteur décrémente (ex: 1→0)
- [ ] Même test pour un contrôle

### Test 8 : Documents (existant)
- [ ] Documents toujours affichés dans la section "Documents associés"
- [ ] Ajout/suppression de documents fonctionne
- [ ] Pas de régression sur la fonctionnalité existante

### Test 9 : Permissions
- [ ] ✅ Avec permission d'écriture : boutons "Ajouter" visibles
- [ ] ✅ Avec permission de lecture seule : boutons cachés
- [ ] ✅ Avec permission de suppression : bouton ❌ visible
- [ ] ✅ Avec permission limitée : message de refus en cas de tentative

### Test 10 : États de chargement
- [ ] Au clic "Ajouter", bouton désactivé pendant l'API call
- [ ] Spinner ou indication de chargement visible
- [ ] Après succès, UI mise à jour
- [ ] En cas d'erreur, message d'erreur affiché

### Test 11 : Navigation & fermeture
- [ ] Changement de processus : données mises à jour correctement
- [ ] Fermeture du panneau (X) : données conservées pour réouverture
- [ ] Clique sur "Ajouter" plusieurs fois : pas de duplication

## 🌐 Tests d'intégration

### Test 12 : API calls
- [ ] `GET /api/cartographie/processus/{id}/clauses` - Retourne liste vide ou clauses
- [ ] `GET /api/cartographie/processus/{id}/controles` - Retourne liste vide ou contrôles
- [ ] `POST /api/cartographie/processus/{id}/clauses/{clauseId}` - Crée l'association
- [ ] `DELETE /api/cartographie/processus/{id}/clauses/{clauseId}` - Supprime l'association
- [ ] `POST /api/cartographie/processus/{id}/controles/{controleId}` - Crée l'association
- [ ] `DELETE /api/cartographie/processus/{id}/controles/{controleId}` - Supprime l'association
- [ ] `GET /api/cartographie/clauses-selection` - Retourne liste des clauses
- [ ] `GET /api/cartographie/controles-selection` - Retourne liste des contrôles

### Test 13 : Base de données
- [ ] Tables ProcessusControles créées en BD
- [ ] Tables ProcessusClauses créées en BD
- [ ] Indices uniques créés
- [ ] Foreign keys correctes
- [ ] Données persistent après rechargement de l'app

## 🔐 Tests de sécurité

### Test 14 : Isolation multi-sociétés
- [ ] Utilisateur Société A ne voit que les processus de Société A
- [ ] Associations d'une société n'affectent pas les autres sociétés
- [ ] Les données sont filtrées par SocieteId

### Test 15 : Validation des entrées
- [ ] Tentative d'associer un contrôle inexistant : erreur 404
- [ ] Tentative de dupliquer une association : erreur validation
- [ ] Tentative d'accès sans permission : erreur 401/403

## 📊 Tests de performance

### Test 16 : Chargement des référentiels
- [ ] Premier chargement <2s
- [ ] Chargement en cache (pas de rechargement au changement de processus)
- [ ] Scrolling dans les listes : fluide

### Test 17 : Gestion de liste de grande taille
- [ ] 100 clauses : affichage fluide
- [ ] 500 contrôles : scrollable sans lag
- [ ] (Note : À considérer virtualisation si >1000)

## 📝 Tests de contenu

### Test 18 : Données correctes
- [ ] Clauses affichent le bon numéro et titre de la BD
- [ ] Contrôles affichent les bons code/titre/domaine/statut
- [ ] Métadonnées à jour et cohérentes

### Test 19 : Affichage multilangue (si applicable)
- [ ] Clauses affichent dans la bonne langue
- [ ] Libellés UI en français

## 🔄 Tests de regression

### Test 20 : Fonctionnalités existantes
- [ ] Ajout/modification/suppression de processus fonctionne
- [ ] Ajout/suppression de documents fonctionne
- [ ] Téléchargement de fichiers fonctionne
- [ ] Affichage de la cartographie fonctionne
- [ ] Filterrage par catégorie fonctionne

## 📚 Documentation

### Livrables documentaires
- [ ] ✅ `MODIFICATION_CARTOGRAPHIE_PROCESSUS.md` - Créé
- [ ] ✅ `GUIDE_MIGRATION_PROCESSUS_CLAUSE_CONTROLE.md` - Créé (dans backend/)
- [ ] ✅ `RESUME_MODIFICATIONS_CARTOGRAPHIE.md` - Créé
- [ ] ✅ `UI_AVANT_APRES_CARTOGRAPHIE.md` - Créé

### Documentation technique
- [ ] [ ] Commentaires XML ajoutés aux nouvelles classes C#
- [ ] [ ] DTOs documentés
- [ ] [ ] Endpoints documentés

## 🎬 Post-livraison

### Formation utilisateurs
- [ ] [ ] Screenshots des nouvelles fonctionnalités
- [ ] [ ] Guide d'utilisation utilisateurs
- [ ] [ ] Démonstration en direct

### Monitoring
- [ ] [ ] Logs de l'API surveillés pour erreurs
- [ ] [ ] Performance monitoriée
- [ ] [ ] Erreurs client (F12) vérifiées

## 🐛 Troubleshooting courant

### Si la migration échoue :
- [ ] Vérifier la chaîne de connexion dans `appsettings.json`
- [ ] Vérifier la syntaxe des fichiers C# (erreurs de compilation)
- [ ] Vérifier la version de SQL Server
- [ ] Rollback : `dotnet ef database update [NomMigrationPrecedente]`

### Si les clauses/contrôles ne s'affichent pas :
- [ ] Vérifier les logs du navigateur (F12)
- [ ] Vérifier les logs du backend
- [ ] Vérifier que la requête API retourne des données
- [ ] Vérifier le cache du navigateur (hard refresh F5)

### Si les associations ne persistent pas :
- [ ] Vérifier que la migration a été appliquée
- [ ] Vérifier les foreign keys en BD
- [ ] Vérifier les logs d'erreur API

## ✨ Signature

Date de validation : ____________________

Validé par : ____________________

Notes : 

_________________________________________________________________

_________________________________________________________________

---

**Total de tests** : 20+ points de vérification

**Statut** : ❌ Pas commencé | ⏳ En cours | ✅ Validé
