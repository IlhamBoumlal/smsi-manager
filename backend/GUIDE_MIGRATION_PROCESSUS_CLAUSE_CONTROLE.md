# 🔧 Guide Migration EF Core - ProcessusControle & ProcessusClause

## Étape 1 : Créer la migration

### Via Terminal/PowerShell

Depuis le dossier `backend/backend` :

```bash
dotnet ef migrations add AddProcessusControleClauseRelations
```

### Via IDE (Visual Studio)

1. **Package Manager Console** (Tools → NuGet Package Manager → Package Manager Console)
2. Définir le projet par défaut : `backend`
3. Exécuter :
```powershell
Add-Migration AddProcessusControleClauseRelations
```

## Étape 2 : Vérifier le fichier de migration

Un nouveau fichier sera créé dans `backend/Migrations/` :
`[timestamp]_AddProcessusControleClauseRelations.cs`

**Le fichier devrait contenir** :

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Créer table ProcessusControle
    migrationBuilder.CreateTable(
        name: "ProcessusControles",
        columns: table => new
        {
            // ... colonnes ...
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_ProcessusControles", x => x.Id);
            table.ForeignKey(
                name: "FK_ProcessusControles_Processus_ProcessusId",
                column: x => x.ProcessusId,
                principalTable: "Processus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
            // ... autres foreign keys ...
        });

    // Créer table ProcessusClause
    migrationBuilder.CreateTable(
        name: "ProcessusClauses",
        columns: table => new
        {
            // ... colonnes ...
        },
        constraints: table =>
        {
            table.PrimaryKey("PK_ProcessusClauses", x => x.Id);
            // ... foreign keys ...
        });

    // Créer indices
    migrationBuilder.CreateIndex(
        name: "IX_ProcessusControles_ProcessusId",
        table: "ProcessusControles",
        column: "ProcessusId");
    // ... autres indices ...
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.DropTable(
        name: "ProcessusControles");

    migrationBuilder.DropTable(
        name: "ProcessusClauses");
}
```

**Si le fichier est vide ou incorrecte**, vous pouvez le supprimer et réessayer :
```bash
rm Migrations/[timestamp]_AddProcessusControleClauseRelations.cs
dotnet ef migrations add AddProcessusControleClauseRelations
```

## Étape 3 : Appliquer la migration à la BD

```bash
dotnet ef database update
```

Ou via Package Manager Console :
```powershell
Update-Database
```

### Vérifier que ça a fonctionné

La base de données devrait maintenant contenir les deux nouvelles tables :
- `ProcessusControles`
- `ProcessusClauses`

Vous pouvez vérifier avec SQL Server Management Studio ou Azure Data Studio en consultant les tables.

## Étape 4 : Redémarrer l'application

```bash
dotnet run
```

## ⚠️ Troubleshooting

### Erreur : "No database provider has been configured"

- ✅ Vérifiez la chaîne de connexion dans `appsettings.json`
- ✅ Assurez-vous que SQL Server est accessible

### Erreur : "The entity type 'ProcessusControle' is missing a primary key"

- ✅ Vérifiez que l'entité définit bien la clé primaire (`public Guid Id`)

### Erreur : "Cannot use multiple aliases for the same entity"

- ✅ Vérifiez que les relations dans `OnModelCreating` ne se chevauchent pas

### La migration s'applique mais les tables ne sont pas créées

- ✅ Vérifiez la version de SQL Server (doit supporter les types de données utilisés)
- ✅ Vérifiez que la migration s'est bien exécutée : `SELECT * FROM __EFMigrationsHistory`

## 📊 Structure des tables créées

### ProcessusControles

| Colonne | Type | Description |
|---------|------|-------------|
| Id | GUID | Clé primaire |
| ProcessusId | GUID | FK vers Processus |
| ControleId | GUID | FK vers Controle |
| SocieteId | INT? | FK vers Societe (nullable) |
| CreatedAt | DATETIME2 | Date de création |
| UpdatedAt | DATETIME2 | Date de modification |
| Justification | NVARCHAR(MAX)? | Justification optionnelle |

**Indices** :
- PK : `Id`
- UK : `(ProcessusId, ControleId)` - Garantit pas de doublons
- FK : `ProcessusId` → Processus(Id)
- FK : `ControleId` → Controle(Id)
- FK : `SocieteId` → Societe(Id)

### ProcessusClauses

| Colonne | Type | Description |
|---------|------|-------------|
| Id | GUID | Clé primaire |
| ProcessusId | GUID | FK vers Processus |
| ClauseId | INT | FK vers IsoClause |
| SocieteId | INT? | FK vers Societe (nullable) |
| CreatedAt | DATETIME2 | Date de création |
| UpdatedAt | DATETIME2 | Date de modification |
| Justification | NVARCHAR(MAX)? | Justification optionnelle |

**Indices** :
- PK : `Id`
- UK : `(ProcessusId, ClauseId)` - Garantit pas de doublons
- FK : `ProcessusId` → Processus(Id)
- FK : `ClauseId` → IsoClause(Id)
- FK : `SocieteId` → Societe(Id)

## ✅ Vérification finale

Après l'application de la migration, vous devriez pouvoir :

1. Créer un processus
2. Naviguer vers `/cartographie`
3. Cliquer sur un processus
4. Voir les sections "Clauses ISO 27001" et "Contrôles associés" (vides)
5. Cliquer sur "Ajouter une clause" ou "Ajouter un contrôle"
6. Sélectionner et associer une clause/contrôle
7. Voir l'association apparaître dans la liste

Si tout fonctionne, les modifications sont réussies ! 🎉
