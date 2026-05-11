# 🔧 Guide Backend - Implémentation Traçabilité Contrôles

## Vue d'ensemble
Le frontend envoie maintenant deux champs supplémentaires lors de la mise à jour d'un contrôle :
- `DateModification` : Timestamp ISO 8601 (ex: "2026-01-15T14:30:45Z")
- `ModifiePar` : Nom/identifiant utilisateur (ex: "Jean Dupont")

---

## 📦 Étape 1 : Modifier le Modèle Entité

**Fichier : `Models/Controle.cs`**

```csharp
public class Controle
{
    // Propriétés existantes...
    public int Id { get; set; }
    public string Code { get; set; }
    public string Titre { get; set; }
    public string Description { get; set; }
    public string Domaine { get; set; }
    public bool? Applicable { get; set; }
    public string Statut { get; set; }
    // ... autres propriétés ...

    // ═══════════════════════════════════════════════════════════
    // NOUVEAU : Champs de traçabilité
    // ═══════════════════════════════════════════════════════════
    
    /// <summary>
    /// Date de la dernière modification du contrôle.
    /// Mis à jour automatiquement à chaque changement.
    /// </summary>
    public DateTime? DateModification { get; set; }

    /// <summary>
    /// Identifiant/nom de l'utilisateur ayant effectué la dernière modification.
    /// Exemple : "jean.dupont@company.com" ou "Jean Dupont"
    /// </summary>
    public string? ModifiePar { get; set; }

    /// <summary>
    /// Date de création du contrôle.
    /// Définie une seule fois, jamais modifiée par la suite.
    /// </summary>
    public DateTime? DateCreation { get; set; }

    /// <summary>
    /// Identifiant/nom de l'utilisateur créateur du contrôle.
    /// Défini une seule fois, jamais modifié par la suite.
    /// </summary>
    public string? CreePar { get; set; }
}
```

---

## 🗄️ Étape 2 : Créer la Migration de Base de Données

**Commande à exécuter :**
```bash
dotnet ef migrations add AddTraceabilityToControles
```

**Fichier généré automatiquement :** `Migrations/[timestamp]_AddTraceabilityToControles.cs`

**Vérifier/éditer le fichier de migration :**

```csharp
public partial class AddTraceabilityToControles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Ajouter les colonnes si elles n'existent pas
        migrationBuilder.AddColumn<DateTime?>(
            name: "DateModification",
            table: "Controles",
            type: "datetime2",
            nullable: true,
            comment: "Date de la dernière modification");

        migrationBuilder.AddColumn<string>(
            name: "ModifiePar",
            table: "Controles",
            type: "nvarchar(255)",
            nullable: true,
            comment: "Utilisateur ayant effectué la dernière modification");

        migrationBuilder.AddColumn<DateTime?>(
            name: "DateCreation",
            table: "Controles",
            type: "datetime2",
            nullable: true,
            comment: "Date de création du contrôle");

        migrationBuilder.AddColumn<string>(
            name: "CreePar",
            table: "Controles",
            type: "nvarchar(255)",
            nullable: true,
            comment: "Utilisateur créateur du contrôle");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("DateModification", "Controles");
        migrationBuilder.DropColumn("ModifiePar", "Controles");
        migrationBuilder.DropColumn("DateCreation", "Controles");
        migrationBuilder.DropColumn("CreePar", "Controles");
    }
}
```

**Appliquer la migration :**
```bash
dotnet ef database update
```

---

## 📝 Étape 3 : Mettre à Jour le DTO de Commande

**Fichier : `Dtos/CreateControleCommand.cs`**

```csharp
public class CreateControleCommand
{
    // Propriétés existantes...
    public int Id { get; set; }
    public string Titre { get; set; }
    public string Description { get; set; }
    public string Domaine { get; set; }
    public bool? Applicable { get; set; }
    public string Statut { get; set; }
    // ... autres propriétés ...

    // ═══════════════════════════════════════════════════════════
    // NOUVEAU : Champs envoyés par le frontend
    // ═══════════════════════════════════════════════════════════
    
    [JsonPropertyName("dateModification")]
    public DateTime? DateModification { get; set; }

    [JsonPropertyName("modifiePar")]
    public string? ModifiePar { get; set; }
}
```

---

## 🎯 Étape 4 : Mettre à Jour le Contrôleur

**Fichier : `Controllers/ControlesController.cs`**

### Méthode PUT (Mise à jour d'un contrôle)

```csharp
[HttpPut("{id}")]
[Authorize]
public async Task<ActionResult<ControleDto>> UpdateControle(int id, CreateControleCommand command)
{
    try
    {
        var controle = await _context.Controles.FindAsync(id);
        if (controle == null)
            return NotFound();

        // ═══════════════════════════════════════════════════════════
        // Mise à jour des champs métier existants
        // ═══════════════════════════════════════════════════════════
        controle.Titre = command.Titre ?? controle.Titre;
        controle.Description = command.Description ?? controle.Description;
        controle.Domaine = command.Domaine ?? controle.Domaine;
        controle.Applicable = command.Applicable ?? controle.Applicable;
        controle.Statut = command.Statut ?? controle.Statut;
        // ... mettre à jour les autres champs du command ...
        controle.RaisonsApplicabilite = command.RaisonsApplicabilite ?? controle.RaisonsApplicabilite;
        controle.RaisonExclusion = command.RaisonExclusion ?? controle.RaisonExclusion;
        controle.JustificationConformite = command.JustificationConformite ?? controle.JustificationConformite;
        // ... etc ...

        // ═══════════════════════════════════════════════════════════
        // IMPORTANT : Mise à jour de la traçabilité
        // ═══════════════════════════════════════════════════════════
        
        // 1. Toujours mettre à jour DateModification et ModifiePar
        controle.DateModification = command.DateModification ?? DateTime.UtcNow;
        controle.ModifiePar = command.ModifiePar ?? User?.Identity?.Name ?? "Système";

        // 2. Définir DateCreation et CreePar seulement à la première création
        if (controle.DateCreation == null)
        {
            controle.DateCreation = DateTime.UtcNow;
            controle.CreePar = controle.ModifiePar;
            
            _logger.LogInformation(
                "Contrôle {ControleId} créé par {User} le {Date}",
                id, controle.CreePar, controle.DateCreation
            );
        }

        // 3. Enregistrer les changements
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Contrôle {ControleId} modifié par {User} le {Date}",
            id, controle.ModifiePar, controle.DateModification
        );

        return Ok(MapToDto(controle));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erreur lors de la mise à jour du contrôle {Id}", id);
        return BadRequest(new { error = ex.Message });
    }
}
```

### Méthode POST (Création d'un contrôle)

```csharp
[HttpPost]
[Authorize]
public async Task<ActionResult<ControleDto>> CreateControle(CreateControleCommand command)
{
    try
    {
        var controle = new Controle
        {
            // Initialiser les champs métier
            Code = command.Code,
            Titre = command.Titre,
            Description = command.Description,
            Domaine = command.Domaine,
            Applicable = command.Applicable,
            Statut = command.Statut ?? "NonEvalue",
            // ... autres champs ...

            // ═══════════════════════════════════════════════════════
            // Initialiser la traçabilité à la création
            // ═══════════════════════════════════════════════════════
            DateCreation = DateTime.UtcNow,
            CreePar = command.ModifiePar ?? User?.Identity?.Name ?? "Système",
            DateModification = DateTime.UtcNow,
            ModifiePar = command.ModifiePar ?? User?.Identity?.Name ?? "Système",
        };

        _context.Controles.Add(controle);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Contrôle {Code} créé par {User} le {Date}",
            controle.Code, controle.CreePar, controle.DateCreation
        );

        return CreatedAtAction(nameof(GetControle), new { id = controle.Id }, MapToDto(controle));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erreur lors de la création du contrôle");
        return BadRequest(new { error = ex.Message });
    }
}
```

---

## 📤 Étape 5 : Mettre à Jour le DTO de Réponse

**Fichier : `Dtos/ControleDto.cs`**

```csharp
public class ControleDto
{
    // Propriétés existantes...
    public int Id { get; set; }
    public string Code { get; set; }
    public string Titre { get; set; }
    public string Description { get; set; }
    // ... autres propriétés ...

    // ═══════════════════════════════════════════════════════════
    // NOUVEAU : Champs de traçabilité sérialisés
    // ═══════════════════════════════════════════════════════════
    
    [JsonPropertyName("dateModification")]
    public DateTime? DateModification { get; set; }

    [JsonPropertyName("modifiePar")]
    public string? ModifiePar { get; set; }

    [JsonPropertyName("dateCreation")]
    public DateTime? DateCreation { get; set; }

    [JsonPropertyName("creePar")]
    public string? CreePar { get; set; }
}
```

---

## 🔄 Étape 6 : Mettre à Jour le Mapper

**Fichier : `Profiles/ControleProfile.cs` (ou votre équivalent)**

```csharp
public class ControleProfile : Profile
{
    public ControleProfile()
    {
        // Mapping du modèle entité vers DTO
        CreateMap<Controle, ControleDto>()
            .ForMember(dest => dest.DateModification, opt => opt.MapFrom(src => src.DateModification))
            .ForMember(dest => dest.ModifiePar, opt => opt.MapFrom(src => src.ModifiePar))
            .ForMember(dest => dest.DateCreation, opt => opt.MapFrom(src => src.DateCreation))
            .ForMember(dest => dest.CreePar, opt => opt.MapFrom(src => src.CreePar));

        // Mapping du command vers entité
        CreateMap<CreateControleCommand, Controle>()
            .ForMember(dest => dest.DateModification, opt => opt.MapFrom(src => src.DateModification ?? DateTime.UtcNow))
            .ForMember(dest => dest.ModifiePar, opt => opt.MapFrom(src => src.ModifiePar))
            .ForMember(dest => dest.Id, opt => opt.Ignore()); // Id généré
    }
}
```

---

## 🧪 Étape 7 : Tests

### Test d'API - Mise à Jour

```bash
curl -X PUT http://localhost:5006/api/controles/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "titre": "Titre mis à jour",
    "description": "Description",
    "domaine": "Organisationnel",
    "statut": "Conforme",
    "dateModification": "2026-01-15T14:30:00Z",
    "modifiePar": "Jean Dupont"
  }'
```

### Réponse Attendue

```json
{
  "id": 1,
  "code": "A.1",
  "titre": "Titre mis à jour",
  "dateModification": "2026-01-15T14:30:00Z",
  "modifiePar": "Jean Dupont",
  "dateCreation": "2026-01-13T09:15:00Z",
  "creePar": "Marie Durand",
  ...
}
```

---

## 📊 Logs Recommandés

Ajouter des logs structurés pour l'audit :

```csharp
_logger.LogInformation(
    "Contrôle {ControleId} ({Code}) modifié | Champs: {ChampModifies} | Par: {User} | Date: {DateTime}",
    controle.Id,
    controle.Code,
    string.Join(", ", changesTracked),  // Liste des champs modifiés
    controle.ModifiePar,
    controle.DateModification
);
```

---

## ⚠️ Points d'Attention

### 1. **Identité Utilisateur**
- Le frontend envoie `ModifiePar` 
- Le backend peut utiliser `User.Identity.Name` du token JWT
- **Préférence** : Prendre `command.ModifiePar` si fourni, sinon `User.Identity.Name`

```csharp
controle.ModifiePar = command.ModifiePar 
    ?? User?.Identity?.Name 
    ?? "Système";
```

### 2. **Format de Date**
- Frontend envoie en **ISO 8601** (UTC) : `"2026-01-15T14:30:00Z"`
- Backend stocke en **datetime2** SQL Server
- Frontend affiche en **formatage français local**

### 3. **Intégrité des Dates**
- `DateCreation` : **Immuable** après la première création
- `DateModification` : **Mise à jour** à chaque modification
- **Jamais** laisser le frontend générer les timestamps côté serveur

```csharp
// ✅ BON : Le serveur de temps s'impose
controle.DateModification = command.DateModification ?? DateTime.UtcNow;

// ❌ MAUVAIS : Faire confiance au client
controle.DateModification = command.DateModification;
```

### 4. **Backward Compatibility**
- Les anciens contrôles auront `DateCreation` et `DateModification` à `null`
- À la première modification, `DateCreation` sera défini
- Le frontend affiche `null` comme "—"

---

## ðŸ“‹ Checklist Backend

- [ ] Ajouter les 4 propriétés au modèle `Controle`
- [ ] Créer et appliquer la migration EF Core
- [ ] Mettre à jour `CreateControleCommand` DTO
- [ ] Mettre à jour `ControleDto` DTO
- [ ] Mettre à jour le contrôleur (PUT et POST)
- [ ] Mettre à jour le mapper AutoMapper
- [ ] Ajouter les logs d'audit
- [ ] Tester via Postman/Insomnia
- [ ] Vérifier que les dates s'affichent correctement front
- [ ] Documenter les changements

---

## ðŸ”— Liens Utiles

- Frontend : `src/components/Controles.jsx`
- Documentation Frontend : `TRAÇABILITE_MODIFICATIONS.md`
- Modèle Entité : `Models/Controle.cs`
- Contrôleur : `Controllers/ControlesController.cs`

---

## 💡 Améliorations Futures

1. **Historique complet** : Créer table `ControleModificationHistorique` pour tracer chaque changement
2. **Diff automatique** : Afficher quels champs ont été modifiés
3. **Notification d'audit** : Envoyer les modifications à un système d'audit centralisé
4. **Export d'audit** : Permettre l'export du journal de modifications

