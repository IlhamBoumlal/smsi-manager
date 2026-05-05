# Guide d'implémentation : Isolation multi-société

## Vue d'ensemble

Ce guide détaille l'approche suivie pour implémenter l'isolation des données par société dans l'application SMSI Manager. L'objectif est d'assurer que chaque utilisateur ne puisse accéder qu'aux données de sa propre société, garantissant ainsi la confidentialité et la séparation des données.

## Objectif

- **Sécurité des données** : Empêcher l'accès aux données d'autres sociétés
- **Conformité** : Respecter les exigences de séparation des données
- **Évolutivité** : Fournir un pattern réutilisable pour tous les modules

## Principe général

### Architecture

1. **JWT enrichi** : Le token d'authentification contient le `SocieteId` de l'utilisateur
2. **Filtrage automatique** : Toutes les requêtes incluent le `SocieteId` et filtrent les données
3. **Validation côté serveur** : Le backend vérifie toujours l'appartenance des données

### Flux de données

```
Utilisateur authentifié → JWT avec SocieteId → Contrôleur → Commande/Requête avec SocieteId → Handler → Repository filtré
```

## Pattern d'implémentation

### 1. Prérequis : Structure de base de données

#### Entités métier
Toutes les entités nécessitant une isolation doivent avoir un champ `SocieteId` nullable :

```csharp
public class Incident
{
    public Guid Id { get; set; }
    // ... autres propriétés
    public int? SocieteId { get; set; }
    public Societe? Societe { get; set; }
}
```

#### Configuration EF Core
Dans `AppDbContext.cs` :

```csharp
builder.Entity<Incident>()
    .HasOne(i => i.Societe)
    .WithMany()
    .HasForeignKey(i => i.SocieteId)
    .OnDelete(DeleteBehavior.SetNull);

builder.Entity<Incident>()
    .HasIndex(i => i.SocieteId);
```

### 2. Authentification et JWT

#### Service JWT
Le `JwtTokenService` génère automatiquement le claim `SocieteId` :

```csharp
public async Task<string> GenerateTokenAsync(ApplicationUser user)
{
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id),
        new(ClaimTypes.Email, user.Email!),
        new("NomComplet", user.NomComplet),
        new("SocieteId", user.SocieteId?.ToString() ?? "")
    };
    // ... reste du code
}
```

#### Extraction dans les contrôleurs
Tous les contrôleurs doivent extraire `CurrentSocieteId` :

```csharp
[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private int? CurrentSocieteId => 
        int.TryParse(User.FindFirstValue("SocieteId"), out var value) ? value : null;
    
    // ... actions
}
```

### 3. Pattern CQRS avec isolation

#### Commandes et requêtes
Toutes les commandes et requêtes incluent `SocieteId` :

```csharp
// Requête
public record GetAllIncidentsQuery(int? SocieteId) : IRequest<IEnumerable<IncidentDto>>;

// Commande
public record CreateIncidentCommand(IncidentDto Incident, int? SocieteId) : IRequest<Guid>;
```

#### Handlers
Les handlers appliquent le filtrage :

```csharp
public class GetAllIncidentsHandler : IRequestHandler<GetAllIncidentsQuery, IEnumerable<IncidentDto>>
{
    private readonly AppDbContext _context;

    public async Task<IEnumerable<IncidentDto>> Handle(GetAllIncidentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Incidents.AsQueryable();
        
        // Filtrage par société
        query = request.SocieteId.HasValue
            ? query.Where(i => i.SocieteId == request.SocieteId.Value)
            : query.Where(i => i.SocieteId == null);

        return await query
            .Select(i => new IncidentDto { /* mapping */ })
            .ToListAsync(cancellationToken);
    }
}
```

#### Création d'entités
Lors de la création, assigner le `SocieteId` :

```csharp
public class CreateIncidentHandler : IRequestHandler<CreateIncidentCommand, Guid>
{
    public async Task<Guid> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Titre = request.Incident.Titre,
            // ... autres propriétés
            SocieteId = request.SocieteId  // Assignation obligatoire
        };

        await _context.Incidents.AddAsync(incident, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        
        return incident.Id;
    }
}
```

### 4. Repository pattern

#### Interface
Les repositories acceptent `SocieteId` pour les lectures :

```csharp
public interface IIncidentRepository
{
    Task<IEnumerable<Incident>> GetAllAsync(int? societeId, CancellationToken ct = default);
    Task<Incident?> GetByIdAsync(Guid id, int? societeId, CancellationToken ct = default);
    // ... autres méthodes
}
```

#### Implémentation
Toujours filtrer par `SocieteId` :

```csharp
public class IncidentRepository : IIncidentRepository
{
    private readonly AppDbContext _context;

    public async Task<IEnumerable<Incident>> GetAllAsync(int? societeId, CancellationToken ct)
    {
        var query = _context.Incidents.AsQueryable();
        
        query = societeId.HasValue
            ? query.Where(i => i.SocieteId == societeId.Value)
            : query.Where(i => i.SocieteId == null);
            
        return await query.ToListAsync(ct);
    }

    public async Task<Incident?> GetByIdAsync(Guid id, int? societeId, CancellationToken ct)
    {
        return await _context.Incidents
            .Where(i => i.Id == id)
            .Where(i => societeId.HasValue 
                ? i.SocieteId == societeId.Value 
                : i.SocieteId == null)
            .FirstOrDefaultAsync(ct);
    }
}
```

## Modules déjà implémentés

### 1. Dashboard
- Requêtes agrégées filtrées par société
- Statistiques isolées

### 2. Sensibilisation
- Formations et participants isolés
- Documents de formation par société

### 3. Actifs
- Gestion des actifs par société
- Historique et classifications isolés

### 4. Incidents
- Déclaration et traitement d'incidents
- Notifications isolées

### 5. Cartographie
- Processus et documents par société
- Arborescence isolée

### 6. Contrôles
- Évaluations et plans d'action
- Suivi par société
### 7. Clauses
### 8. Audits
### 9. Documentations
### 10. risques
### 11. PDCA

## Checklist d'implémentation pour un nouveau module

### Phase 1 : Préparation
- [ ] Ajouter `SocieteId` nullable à l'entité principale
- [ ] Mettre à jour le `AppDbContext` avec FK et index
- [ ] Créer et appliquer la migration EF Core

### Phase 2 : Authentification
- [ ] Vérifier que le contrôleur extrait `CurrentSocieteId`
- [ ] Ajouter logs de débogage si nécessaire

### Phase 3 : CQRS
- [ ] Modifier toutes les requêtes pour inclure `int? SocieteId`
- [ ] Modifier toutes les commandes pour inclure `int? SocieteId`
- [ ] Mettre à jour les handlers pour filtrer par `SocieteId`
- [ ] Assigner `SocieteId` lors de la création

### Phase 4 : Repository
- [ ] Mettre à jour l'interface pour accepter `societeId`
- [ ] Implémenter le filtrage dans toutes les méthodes de lecture
- [ ] Valider l'appartenance lors des modifications/suppressions

### Phase 5 : Tests
- [ ] Tester avec utilisateur ayant `SocieteId = null` → accès limité
- [ ] Tester avec utilisateur ayant `SocieteId = X` → accès aux données de X uniquement
- [ ] Vérifier les logs pour confirmer le filtrage

## Bonnes pratiques

### Sécurité
- **Jamais de données globales** : Tout doit être filtré par société
- **Validation côté serveur** : Ne pas se fier au frontend
- **Logs de sécurité** : Tracer les accès pour audit

### Performance
- **Index sur SocieteId** : Essentiel pour les performances
- **Requêtes optimisées** : Éviter les N+1 queries
- **Cache intelligent** : Si applicable, par société

### Maintenance
- **Pattern cohérent** : Respecter le même pattern partout
- **Tests automatisés** : Couvrir les scénarios d'isolation
- **Documentation** : Mettre à jour ce guide

### Évolutivité
- **Migration progressive** : Implémenter module par module
- **Données existantes** : Gérer les enregistrements sans `SocieteId`
- **API backward compatible** : Si nécessaire pour les anciens clients

## Dépannage courant

### Problème : CurrentSocieteId = null
**Cause** : Utilisateur sans société assignée ou JWT expiré
**Solution** : Assigner une société à l'utilisateur et se reconnecter

### Problème : Données visibles partout
**Cause** : Filtrage manquant dans un handler
**Solution** : Vérifier tous les handlers et repositories

### Problème : Erreur de migration
**Cause** : Conflit de clés étrangères
**Solution** : Vérifier les relations et utiliser `OnDelete(DeleteBehavior.SetNull)`

## Prochaines étapes

1. **Finaliser les modules restants** : Audits, Risques, Documentation
2. **Tests d'intégration** : Scénarios multi-utilisateurs
3. **Audit de sécurité** : Revue complète de l'isolation
4. **Optimisation** : Requêtes et indexes
5. **Formation équipe** : Atelier sur le pattern

## Ressources

- [EF Core Migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Dernière mise à jour** : 26 avril 2026
**Version** : 1.0
**Auteur** : Équipe développement SMSI Manager</content>
<parameter name="filePath">c:\Users\PC\Desktop\smsi-manager\GUIDE_MULTI_SOCIETE_DETAILLE.md