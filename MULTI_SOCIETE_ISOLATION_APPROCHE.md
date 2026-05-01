# Approche d'isolation multi-société

Ce document explique la stratégie suivie pour isoler les données par `SocieteId` dans le backend du projet.
Il est conçu pour que tes collègues comprennent le pattern et puissent le répliquer sur d'autres modules.

## Objectif

Garantir que chaque utilisateur ne puisse lire, créer, modifier ou supprimer que les entités appartenant à sa société.

## Principe général

1. Extraire l'identifiant de la société depuis le JWT de l'utilisateur.
2. Passer cette valeur (`CurrentSocieteId`) aux requêtes et aux commandes.
3. Sur le backend, appliquer un filtre `SocieteId` sur les opérations de lecture.
4. Lors de la création, fixer `SocieteId` sur l'entité nouvellement créée.
5. Lors de la mise à jour/suppression, valider que l'entité appartient bien à la société courante.

## Pattern utilisé

- `CurrentSocieteId` est lu dans le contrôleur via :
  - `User.FindFirstValue("SocieteId")`
  - `int.TryParse(...)` pour conserver `int?`

- Les commandes et requêtes deviennent porteuses de `SocieteId` :
  - `GetAllXQuery(int? SocieteId)`
  - `GetXByIdQuery(Guid id, int? SocieteId)`
  - `CreateXCommand(..., int? SocieteId)`
  - `UpdateXCommand(Guid id, ..., int? SocieteId)`
  - `DeleteXCommand(Guid id, int? SocieteId)`

- Les handlers et repository se chargent de filtrer la donnée :
  - lecture = `Where(entity => entity.SocieteId == request.SocieteId)`
  - création = `SocieteId = request.SocieteId`
  - modification = recherche par `Id` + `SocieteId`
  - suppression = recherche par `Id` + `SocieteId`

## Modules déjà traités

### Dashboard

- Le dashboard reçoit `CurrentSocieteId` pour calculer les résumés et les compteurs.
- Les données affichées sont filtrées par société.

### Sensibilisation

- `GetFormationsQuery(CurrentSocieteId)`
- `CreateFormationCommand(..., SocieteId)`
- `UpdateFormationCommand(..., SocieteId)`
- `DeleteFormationCommand(..., SocieteId)`

### Actifs

- `Actif` possède désormais un champ nullable `SocieteId`.
- Le repository filtre les actifs par société.
- Les commandes CRUD passent `SocieteId`.

### Incidents

- Entité `Incident` enrichie avec `SocieteId`.
- Le contrôleur `IncidentsController` transmet `CurrentSocieteId` à toutes les requêtes/commandes.
- Les handlers d'`Incident` filtrent par `SocieteId` sur lecture, mise à jour et suppression.

### Cartographie

- `Processus` et `Document` ont été enrichis avec `SocieteId`.
- `IProcessusRepository` accepte maintenant `int? societeId` pour les lectures.
- Les actions du contrôleur utilisent `CurrentSocieteId` sur tous les endpoints :
  - `GetAll` / `GetById`
  - `Create` / `Update` / `Delete`
  - `AddDocument` / `DeleteDocument` / `DownloadFichier`

## Raisons du choix

- Ce pattern est simple et prévisible.
- Il est facile à audit en examinant les handlers et les requêtes.
- Il protège les données au niveau applicatif, même si la base de données contient des enregistrements inter-sociétés.

## Bonnes pratiques à respecter

- Toujours ajouter `SocieteId` aux entités métier qui doivent être isolées.
- Ne jamais exposer de requête sans filtre `SocieteId` pour les endpoints internes.
- Utiliser `int?` pour permettre des données globales (société null) si nécessaire.
- Ne pas utiliser `CurrentSocieteId` directement dans les repositories : passer-la via les requêtes/commandes.

## Prochaines évolutions possibles

- Ajouter un middleware ou un service dédié pour centraliser l'extraction de `CurrentSocieteId`.
- Implémenter un `QueryFilter` EF Core global pour automatiser le filtrage par `SocieteId`.
- Ajouter des tests d'intégration couvrant les accès interdits entre sociétés.

## Exemple de flux

1. Le contrôleur reçoit une requête.
2. Il lit le claim `SocieteId` dans le JWT.
3. Il instancie une commande ou une requête avec `SocieteId`.
4. Le handler interroge le repository ou le DbContext.
5. Le repository filtre par `SocieteId`.
6. L'opération ne fonctionne que si l'entité appartient à la bonne société.

---

Ce document décrit l'approche que tu as suivie dans le backend pour rendre le système multi-société.
N'hésite pas à l'envoyer tel quel à tes collègues ou à le compléter avec des exemples de fichiers si nécessaire.
