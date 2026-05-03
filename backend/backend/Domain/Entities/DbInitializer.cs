using backend.Application.DTOs.Controles;
using backend.Application.Security;
using backend.Application.Societes;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private sealed record DemoUserSeed(string Email, string Password, string NomComplet, string Role);
        private sealed record RbacModuleSeed(string Code, string Name, bool AdminOnly = false);
        private sealed record RbacActionSeed(string Code, string Name);
        private static readonly string[] DemoSeedEmails = ["rssi.demo@smsi.local", "consultant.demo@smsi.local"];
        private const string DemoSocieteName = SocieteNamePolicy.ReservedDemoName;
        private static readonly string[] AlexsysSocieteNames = ["Alexsys Solutions", "Alexsys Solution"];
        private static readonly RbacModuleSeed[] DefaultRbacModules =
        [
            new("cartographie", "Cartographie"),
            new("dashbord", "Tableau de bord"),
            new("pdca", "PDCA"),
            new("clauses", "Clauses"),
            new("controles", "Controles"),
            new("documentation", "Documentation"),
            new("risques", "Risques"),
            new("audits", "Audits"),
            new("actifs", "Actifs"),
            new("sensibilisation", "Sensibilisation"),
            new("incidents", "Incidents"),
            new("statistiques", "Statistiques", AdminOnly: true),
            new("utilisateurs", "Utilisateurs", AdminOnly: true),
            new("societes", "Societes", AdminOnly: true),
            new("holdings", "Holdings", AdminOnly: true),
        ];

        private static readonly RbacActionSeed[] DefaultRbacActions =
        [
            new("view", "Lecture"),
            new("create", "Creation"),
            new("edit", "Modification"),
            new("delete", "Suppression"),
            new("export", "Export"),
        ];

        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();

            try
            {
                await dbContext.Database.MigrateAsync();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
            {
                // In local development, allow startup even when a migration is missing.
                await dbContext.Database.EnsureCreatedAsync();
            }
            catch (Exception ex)
            {
                // Do not block startup for modules that can self-heal via compatibility patches below.
                Console.WriteLine($"Database migration skipped: {ex.Message}");
            }

            // Legacy databases may contain older schemas.
            // Run compatibility patches independently so one failure does not block the others.
            try
            {
                await EnsureControlesSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Controles schema compatibility failed: {ex.Message}");
            }

            try
            {
                await EnsureDocumentationProofSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Documentation proof schema compatibility failed: {ex.Message}");
            }

            try
            {
                await EnsureCartographieSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Cartographie schema compatibility failed: {ex.Message}");
            }

            try
            {
                await EnsureIncidentsSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Incidents schema compatibility failed: {ex.Message}");
            }

            try
            {
                await EnsureSocieteSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Societe schema compatibility failed: {ex.Message}");
            }

            try
            {
                await EnsureRbacSchemaCompatibilityAsync(dbContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"RBAC schema compatibility failed: {ex.Message}");
            }

            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            await EnsureOfficialRolesAsync(roleManager);

            // Seed users from configuration only (no hardcoded credentials)
            var adminEmail = config["SeedUsers:SuperAdmin:Email"];
            var adminPassword = config["SeedUsers:SuperAdmin:Password"];
            var adminName = config["SeedUsers:SuperAdmin:NomComplet"] ?? "Super Administrateur";
            var adminRole = AppRoles.ResolveCanonicalRoleName(
                config["SeedUsers:SuperAdmin:Role"] ?? AppRoles.SuperAdmin,
                societeId: null);

            var standardEmail = config["SeedUsers:Consultant:Email"];
            var standardPassword = config["SeedUsers:Consultant:Password"];
            var standardName = config["SeedUsers:Consultant:NomComplet"] ?? "Consultant Standard";
            var standardRole = AppRoles.ResolveCanonicalRoleName(
                config["SeedUsers:Consultant:Role"] ?? AppRoles.Consultant,
                societeId: 1);

            await EnsureRoleExistsAsync(roleManager, adminRole);
            await EnsureRoleExistsAsync(roleManager, standardRole);

            await TrySeedConfiguredUserAsync(userManager, adminEmail, adminPassword, adminName, adminRole, "SuperAdmin");
            await TrySeedConfiguredUserAsync(userManager, standardEmail, standardPassword, standardName, standardRole, "Consultant");

            var seedDemo = bool.TryParse(config["SeedUsers:EnableDemo"], out var enableDemo) && enableDemo;
            if (seedDemo)
            {
                Console.WriteLine("SeedUsers:EnableDemo=true detecte, mais le seed demo est bloque par politique.");
            }
            await CleanupDocumentationMvpDemoAsync(dbContext, userManager);
            await SeedAlexsysUsersAsync(dbContext, userManager, roleManager);
            await MigrateUsersAndCleanupRolesAsync(dbContext, userManager, roleManager);
            await EnsureRbacCatalogAndPermissionsAsync(dbContext, roleManager);

            await SeedControlesAsync(serviceProvider);
        }

        private static async Task EnsureControlesSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
DECLARE @fullTableName NVARCHAR(300);

SELECT TOP (1) @fullTableName = QUOTENAME(s.name) + N'.' + QUOTENAME(t.name)
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE t.name = N'controles';

IF @fullTableName IS NOT NULL
BEGIN
    IF COL_LENGTH(@fullTableName, N'SocieteId') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [SocieteId] int NULL;');

    IF COL_LENGTH(@fullTableName, N'DateEcheance') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [DateEcheance] datetime2 NULL;');

    IF COL_LENGTH(@fullTableName, N'DernierModificateurId') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [DernierModificateurId] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'DernierModificateurNom') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [DernierModificateurNom] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'JustificationConformite') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [JustificationConformite] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'Priorite') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [Priorite] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'RaisonExclusion') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [RaisonExclusion] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'RaisonsApplicabilite') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [RaisonsApplicabilite] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'Remarque') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [Remarque] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'ResponsablePlan') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [ResponsablePlan] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'StatutPlan') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [StatutPlan] int NULL;');

    IF COL_LENGTH(@fullTableName, N'Steps') IS NULL
        EXEC(N'ALTER TABLE ' + @fullTableName + N' ADD [Steps] nvarchar(max) NULL;');

    IF COL_LENGTH(@fullTableName, N'JustificationApplicabilite') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.columns
            WHERE object_id = OBJECT_ID(@fullTableName)
              AND name = N'JustificationApplicabilite'
              AND is_nullable = 0
        )
            EXEC(N'ALTER TABLE ' + @fullTableName + N' ALTER COLUMN [JustificationApplicabilite] nvarchar(max) NULL;');
    END;

    DECLARE @legacyNullableSql nvarchar(max) = N'';

    ;WITH legacy_not_null AS
    (
        SELECT
            c.name,
            TypeDefinition = CASE
                WHEN t.name IN (N'nvarchar', N'nchar')
                    THEN t.name + N'(' + CASE WHEN c.max_length = -1 THEN N'max' ELSE CAST(c.max_length / 2 AS nvarchar(10)) END + N')'
                WHEN t.name IN (N'varchar', N'char', N'varbinary', N'binary')
                    THEN t.name + N'(' + CASE WHEN c.max_length = -1 THEN N'max' ELSE CAST(c.max_length AS nvarchar(10)) END + N')'
                WHEN t.name IN (N'decimal', N'numeric')
                    THEN t.name + N'(' + CAST(c.[precision] AS nvarchar(10)) + N',' + CAST(c.scale AS nvarchar(10)) + N')'
                WHEN t.name IN (N'datetime2', N'datetimeoffset', N'time')
                    THEN t.name + N'(' + CAST(c.scale AS nvarchar(10)) + N')'
                ELSE t.name
            END
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(@fullTableName)
          AND c.is_nullable = 0
          AND c.is_identity = 0
          AND c.is_computed = 0
          AND c.name NOT IN (N'Id', N'Code', N'Titre', N'Domaine', N'Applicable', N'Statut')
    )
    SELECT @legacyNullableSql = @legacyNullableSql
        + N'ALTER TABLE ' + @fullTableName + N' ALTER COLUMN ' + QUOTENAME(name) + N' ' + TypeDefinition + N' NULL;'
    FROM legacy_not_null;

    IF LEN(@legacyNullableSql) > 0
        EXEC sp_executesql @legacyNullableSql;

    IF OBJECT_ID(N'[dbo].[ControleHistoriques]', N'U') IS NULL
    BEGIN
        CREATE TABLE [dbo].[ControleHistoriques](
            [Id] uniqueidentifier NOT NULL,
            [ControleId] uniqueidentifier NOT NULL,
            [DateModification] datetime2 NOT NULL,
            [ModificateurId] nvarchar(max) NULL,
            [ModificateurNom] nvarchar(max) NULL,
            [AvantJson] nvarchar(max) NULL,
            [ApresJson] nvarchar(max) NULL,
            [ChampsModifies] nvarchar(max) NULL,
            CONSTRAINT [PK_ControleHistoriques] PRIMARY KEY ([Id]),
            CONSTRAINT [FK_ControleHistoriques_controles_ControleId] FOREIGN KEY ([ControleId]) REFERENCES [dbo].[controles]([Id]) ON DELETE CASCADE
        );
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_ControleHistoriques_ControleId'
          AND object_id = OBJECT_ID(N'[dbo].[ControleHistoriques]')
    )
        CREATE INDEX [IX_ControleHistoriques_ControleId] ON [dbo].[ControleHistoriques]([ControleId]);
END";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureSocieteSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
DECLARE @targetTables TABLE (TableName sysname NOT NULL);
INSERT INTO @targetTables (TableName)
VALUES
    (N'Actifs'),
    (N'ActionPlans'),
    (N'Audits'),
    (N'ConformityProofs'),
    (N'ConformityStatuses'),
    (N'controles'),
    (N'DocumentationDocuments'),
    (N'Documents'),
    (N'FileAttachments'),
    (N'Formations'),
    (N'Incidents'),
    (N'NonConformites'),
    (N'PdcaCycles'),
    (N'Processus'),
    (N'RiskStudies'),
    (N'SimulationAudits');

DECLARE @tableName sysname;
DECLARE @fullTableName nvarchar(300);
DECLARE @indexName sysname;
DECLARE @sql nvarchar(max);

DECLARE table_cursor CURSOR FAST_FORWARD FOR
SELECT TableName
FROM @targetTables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @fullTableName = NULL;

    SELECT TOP (1) @fullTableName = QUOTENAME(s.name) + N'.' + QUOTENAME(t.name)
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = @tableName;

    IF @fullTableName IS NOT NULL
    BEGIN
        IF COL_LENGTH(@fullTableName, N'SocieteId') IS NULL
        BEGIN
            SET @sql = N'ALTER TABLE ' + @fullTableName + N' ADD [SocieteId] int NULL;';
            EXEC(@sql);
        END;

        SET @indexName = N'IX_' + REPLACE(@tableName, N' ', N'') + N'_SocieteId';
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes i
            WHERE i.object_id = OBJECT_ID(@fullTableName)
              AND i.name = @indexName
        )
        BEGIN
            SET @sql = N'CREATE INDEX ' + QUOTENAME(@indexName) + N' ON ' + @fullTableName + N'([SocieteId]);';
            EXEC(@sql);
        END;
    END;

    FETCH NEXT FROM table_cursor INTO @tableName;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureDocumentationProofSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
IF OBJECT_ID(N'[dbo].[DocumentationDocuments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'[dbo].[DocumentationDocuments]', N'FileHash') IS NULL
        ALTER TABLE [dbo].[DocumentationDocuments] ADD [FileHash] nvarchar(128) NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_DocumentationDocuments_SocieteId_FileHash'
          AND object_id = OBJECT_ID(N'[dbo].[DocumentationDocuments]')
    )
        CREATE INDEX [IX_DocumentationDocuments_SocieteId_FileHash]
        ON [dbo].[DocumentationDocuments]([SocieteId], [FileHash]);
END;

IF OBJECT_ID(N'[dbo].[FileAttachments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'[dbo].[FileAttachments]', N'DocumentationDocumentId') IS NULL
        ALTER TABLE [dbo].[FileAttachments] ADD [DocumentationDocumentId] uniqueidentifier NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_FileAttachments_DocumentationDocumentId'
          AND object_id = OBJECT_ID(N'[dbo].[FileAttachments]')
    )
        CREATE INDEX [IX_FileAttachments_DocumentationDocumentId]
        ON [dbo].[FileAttachments]([DocumentationDocumentId]);

    IF OBJECT_ID(N'[dbo].[FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId]', N'F') IS NULL
        ALTER TABLE [dbo].[FileAttachments] WITH CHECK
        ADD CONSTRAINT [FK_FileAttachments_DocumentationDocuments_DocumentationDocumentId]
        FOREIGN KEY([DocumentationDocumentId])
        REFERENCES [dbo].[DocumentationDocuments]([Id])
        ON DELETE SET NULL;
END;";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureCartographieSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
IF OBJECT_ID(N'[dbo].[Processus]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Processus](
        [Id] uniqueidentifier NOT NULL,
        [Categorie] nvarchar(10) NOT NULL,
        [Nom] nvarchar(200) NOT NULL,
        [Responsable] nvarchar(100) NULL,
        [Description] nvarchar(500) NULL,
        CONSTRAINT [PK_Processus] PRIMARY KEY ([Id])
    );
END;

IF COL_LENGTH(N'[dbo].[Processus]', N'Categorie') IS NULL
    ALTER TABLE [dbo].[Processus] ADD [Categorie] nvarchar(10) NOT NULL CONSTRAINT [DF_Processus_Categorie] DEFAULT N'mgmt';
IF COL_LENGTH(N'[dbo].[Processus]', N'Nom') IS NULL
    ALTER TABLE [dbo].[Processus] ADD [Nom] nvarchar(200) NOT NULL CONSTRAINT [DF_Processus_Nom] DEFAULT N'';
IF COL_LENGTH(N'[dbo].[Processus]', N'Responsable') IS NULL
    ALTER TABLE [dbo].[Processus] ADD [Responsable] nvarchar(100) NULL;
IF COL_LENGTH(N'[dbo].[Processus]', N'Description') IS NULL
    ALTER TABLE [dbo].[Processus] ADD [Description] nvarchar(500) NULL;

IF OBJECT_ID(N'[dbo].[Documents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Documents](
        [Id] uniqueidentifier NOT NULL,
        [ProcessusId] uniqueidentifier NOT NULL,
        [Nom] nvarchar(200) NOT NULL,
        [Type] nvarchar(50) NULL,
        [Reference] nvarchar(50) NULL,
        [Statut] nvarchar(30) NULL,
        [FichierNom] nvarchar(260) NULL,
        [FichierType] nvarchar(100) NULL,
        [FichierData] varbinary(max) NULL,
        CONSTRAINT [PK_Documents] PRIMARY KEY ([Id])
    );
END;

IF COL_LENGTH(N'[dbo].[Documents]', N'ProcessusId') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [ProcessusId] uniqueidentifier NOT NULL CONSTRAINT [DF_Documents_ProcessusId] DEFAULT '00000000-0000-0000-0000-000000000000';
IF COL_LENGTH(N'[dbo].[Documents]', N'Nom') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [Nom] nvarchar(200) NOT NULL CONSTRAINT [DF_Documents_Nom] DEFAULT N'';
IF COL_LENGTH(N'[dbo].[Documents]', N'Type') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [Type] nvarchar(50) NULL;
IF COL_LENGTH(N'[dbo].[Documents]', N'Reference') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [Reference] nvarchar(50) NULL;
IF COL_LENGTH(N'[dbo].[Documents]', N'Statut') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [Statut] nvarchar(30) NULL;
IF COL_LENGTH(N'[dbo].[Documents]', N'FichierNom') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [FichierNom] nvarchar(260) NULL;
IF COL_LENGTH(N'[dbo].[Documents]', N'FichierType') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [FichierType] nvarchar(100) NULL;
IF COL_LENGTH(N'[dbo].[Documents]', N'FichierData') IS NULL
    ALTER TABLE [dbo].[Documents] ADD [FichierData] varbinary(max) NULL;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Documents_ProcessusId'
      AND object_id = OBJECT_ID(N'[dbo].[Documents]')
)
    CREATE INDEX [IX_Documents_ProcessusId] ON [dbo].[Documents]([ProcessusId]);

IF OBJECT_ID(N'[dbo].[FK_Documents_Processus_ProcessusId]', N'F') IS NULL
   AND OBJECT_ID(N'[dbo].[Documents]', N'U') IS NOT NULL
   AND OBJECT_ID(N'[dbo].[Processus]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Documents] WITH NOCHECK
    ADD CONSTRAINT [FK_Documents_Processus_ProcessusId]
    FOREIGN KEY([ProcessusId]) REFERENCES [dbo].[Processus]([Id]) ON DELETE CASCADE;
END;";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureIncidentsSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
IF OBJECT_ID(N'[dbo].[Incidents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Incidents](
        [Id] uniqueidentifier NOT NULL,
        [Titre] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [Date] datetime2 NULL,
        [Priorite] nvarchar(max) NULL,
        [Statut] nvarchar(max) NULL,
        [Resolution] nvarchar(max) NULL,
        CONSTRAINT [PK_Incidents] PRIMARY KEY ([Id])
    );
END;

IF COL_LENGTH(N'[dbo].[Incidents]', N'Resolution') IS NULL
    ALTER TABLE [dbo].[Incidents] ADD [Resolution] nvarchar(max) NULL;

IF COL_LENGTH(N'[dbo].[Incidents]', N'Priorite') IS NULL
    ALTER TABLE [dbo].[Incidents] ADD [Priorite] nvarchar(max) NULL;

IF COL_LENGTH(N'[dbo].[Incidents]', N'Statut') IS NULL
    ALTER TABLE [dbo].[Incidents] ADD [Statut] nvarchar(max) NULL;
";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureRbacSchemaCompatibilityAsync(AppDbContext dbContext)
        {
            const string sql = @"
IF OBJECT_ID(N'[dbo].[Modules]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Modules](
        [Id] nvarchar(450) NOT NULL,
        [Code] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Modules] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[dbo].[Actions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Actions](
        [Id] nvarchar(450) NOT NULL,
        [Code] nvarchar(450) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Actions] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[dbo].[Permissions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Permissions](
        [Id] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        [ModuleId] nvarchar(450) NOT NULL,
        [ActionId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Modules_Code'
      AND object_id = OBJECT_ID(N'[dbo].[Modules]')
)
    CREATE UNIQUE INDEX [IX_Modules_Code] ON [dbo].[Modules]([Code]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Actions_Code'
      AND object_id = OBJECT_ID(N'[dbo].[Actions]')
)
    CREATE UNIQUE INDEX [IX_Actions_Code] ON [dbo].[Actions]([Code]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Permissions_ActionId'
      AND object_id = OBJECT_ID(N'[dbo].[Permissions]')
)
    CREATE INDEX [IX_Permissions_ActionId] ON [dbo].[Permissions]([ActionId]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Permissions_ModuleId'
      AND object_id = OBJECT_ID(N'[dbo].[Permissions]')
)
    CREATE INDEX [IX_Permissions_ModuleId] ON [dbo].[Permissions]([ModuleId]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Permissions_RoleId'
      AND object_id = OBJECT_ID(N'[dbo].[Permissions]')
)
    CREATE INDEX [IX_Permissions_RoleId] ON [dbo].[Permissions]([RoleId]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Permissions_RoleId_ModuleId_ActionId'
      AND object_id = OBJECT_ID(N'[dbo].[Permissions]')
)
    CREATE UNIQUE INDEX [IX_Permissions_RoleId_ModuleId_ActionId]
    ON [dbo].[Permissions]([RoleId], [ModuleId], [ActionId]);

IF OBJECT_ID(N'[dbo].[FK_Permissions_Modules_ModuleId]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[Permissions] WITH NOCHECK
    ADD CONSTRAINT [FK_Permissions_Modules_ModuleId]
    FOREIGN KEY([ModuleId]) REFERENCES [dbo].[Modules]([Id]) ON DELETE CASCADE;
END;

IF OBJECT_ID(N'[dbo].[FK_Permissions_Actions_ActionId]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[Permissions] WITH NOCHECK
    ADD CONSTRAINT [FK_Permissions_Actions_ActionId]
    FOREIGN KEY([ActionId]) REFERENCES [dbo].[Actions]([Id]) ON DELETE CASCADE;
END;";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureRbacCatalogAndPermissionsAsync(
            AppDbContext dbContext,
            RoleManager<IdentityRole> roleManager)
        {
            var modules = await dbContext.Modules.ToListAsync();
            var moduleByCode = modules
                .Where(m => !string.IsNullOrWhiteSpace(m.Code))
                .GroupBy(m => m.Code.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var moduleChanges = 0;
            foreach (var seed in DefaultRbacModules)
            {
                if (moduleByCode.TryGetValue(seed.Code, out var existingModule))
                {
                    if (string.IsNullOrWhiteSpace(existingModule.Name))
                    {
                        existingModule.Name = seed.Name;
                        moduleChanges++;
                    }
                    continue;
                }

                var module = new Module
                {
                    Id = Guid.NewGuid().ToString(),
                    Code = seed.Code,
                    Name = seed.Name,
                    CreatedAt = DateTime.UtcNow,
                };

                dbContext.Modules.Add(module);
                moduleByCode[seed.Code] = module;
                moduleChanges++;
            }

            var actions = await dbContext.Actions.ToListAsync();
            var actionByCode = actions
                .Where(a => !string.IsNullOrWhiteSpace(a.Code))
                .GroupBy(a => a.Code.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var actionChanges = 0;
            foreach (var seed in DefaultRbacActions)
            {
                if (actionByCode.TryGetValue(seed.Code, out var existingAction))
                {
                    if (string.IsNullOrWhiteSpace(existingAction.Name))
                    {
                        existingAction.Name = seed.Name;
                        actionChanges++;
                    }
                    continue;
                }

                var action = new backend.Domain.Entities.Action
                {
                    Id = Guid.NewGuid().ToString(),
                    Code = seed.Code,
                    Name = seed.Name,
                };

                dbContext.Actions.Add(action);
                actionByCode[seed.Code] = action;
                actionChanges++;
            }

            if (moduleChanges > 0 || actionChanges > 0)
            {
                await dbContext.SaveChangesAsync();
            }

            modules = await dbContext.Modules.AsNoTracking().ToListAsync();
            actions = await dbContext.Actions.AsNoTracking().ToListAsync();
            moduleByCode = modules
                .Where(m => !string.IsNullOrWhiteSpace(m.Code))
                .GroupBy(m => m.Code.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            actionByCode = actions
                .Where(a => !string.IsNullOrWhiteSpace(a.Code))
                .GroupBy(a => a.Code.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var roleByName = (await roleManager.Roles.AsNoTracking().ToListAsync())
                .Where(r => !string.IsNullOrWhiteSpace(r.Name))
                .ToDictionary(r => r.Name!, StringComparer.OrdinalIgnoreCase);

            var existingPermissions = await dbContext.Permissions.ToListAsync();
            if (existingPermissions.Count > 0)
            {
                dbContext.Permissions.RemoveRange(existingPermissions);
                await dbContext.SaveChangesAsync();
            }

            var adminSocieteAdminModules = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "statistiques",
                "utilisateurs",
            };
            var superAdminGlobalModules = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "statistiques",
                "utilisateurs",
                "societes",
                "holdings",
            };

            var permissionsToAdd = new List<Permission>();

            foreach (var roleName in AppRoles.FinalRoles)
            {
                if (!roleByName.TryGetValue(roleName, out var role))
                {
                    continue;
                }

                foreach (var moduleSeed in DefaultRbacModules)
                {
                    var includeModule = string.Equals(roleName, AppRoles.SuperAdmin, StringComparison.OrdinalIgnoreCase)
                        ? superAdminGlobalModules.Contains(moduleSeed.Code)
                        : string.Equals(roleName, AppRoles.AdminSociete, StringComparison.OrdinalIgnoreCase)
                            ? (!moduleSeed.AdminOnly || adminSocieteAdminModules.Contains(moduleSeed.Code))
                            : !moduleSeed.AdminOnly;

                    if (!includeModule)
                    {
                        continue;
                    }

                    if (!moduleByCode.TryGetValue(moduleSeed.Code, out var module))
                    {
                        continue;
                    }

                    foreach (var actionCode in DefaultRbacActions.Select(a => a.Code))
                    {
                        if (!actionByCode.TryGetValue(actionCode, out var action))
                        {
                            continue;
                        }

                        permissionsToAdd.Add(new Permission
                        {
                            Id = Guid.NewGuid().ToString(),
                            RoleId = role.Id,
                            ModuleId = module.Id,
                            ActionId = action.Id,
                        });
                    }
                }
            }

            if (permissionsToAdd.Count > 0)
            {
                dbContext.Permissions.AddRange(permissionsToAdd);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"RBAC permissions regenerees: {permissionsToAdd.Count} permissions creees pour les roles officiels.");
            }
        }

        private static async Task EnsureOfficialRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            foreach (var role in AppRoles.FinalRoles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    var result = await roleManager.CreateAsync(new IdentityRole(role));
                    if (!result.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de creer le role {role}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }
                }
            }
        }

        private static async Task MigrateUsersAndCleanupRolesAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            await EnsureOfficialRolesAsync(roleManager);

            var defaultSocieteId = await dbContext.Societes
                .AsNoTracking()
                .OrderBy(s => s.Id)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            var users = await userManager.Users.ToListAsync();
            foreach (var user in users)
            {
                var currentRoles = await userManager.GetRolesAsync(user);
                var targetRole = AppRoles.ResolvePrimaryRole(currentRoles, user.SocieteId);

                var targetSocieteId = AppRoles.IsSuperAdminRole(targetRole)
                    ? (int?)null
                    : (user.SocieteId ?? defaultSocieteId);

                if (AppRoles.IsSocieteRequiredRole(targetRole) && !targetSocieteId.HasValue)
                {
                    targetRole = AppRoles.SuperAdmin;
                    targetSocieteId = null;
                }

                var roleChangeRequired = currentRoles.Count != 1
                    || !string.Equals(currentRoles[0], targetRole, StringComparison.OrdinalIgnoreCase);

                if (roleChangeRequired)
                {
                    if (currentRoles.Count > 0)
                    {
                        var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                        if (!removeResult.Succeeded)
                        {
                            throw new InvalidOperationException(
                                $"Impossible de retirer les roles de {user.Email}: {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
                        }
                    }

                    var addResult = await userManager.AddToRoleAsync(user, targetRole);
                    if (!addResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible d'assigner le role {targetRole} a {user.Email}: {string.Join(", ", addResult.Errors.Select(e => e.Description))}");
                    }
                }

                if (user.SocieteId != targetSocieteId)
                {
                    user.SocieteId = targetSocieteId;
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de mettre a jour la societe de {user.Email}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            var roles = await roleManager.Roles.ToListAsync();
            foreach (var role in roles)
            {
                var roleName = role.Name ?? string.Empty;
                var isCanonicalOfficialRole = AppRoles.FinalRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase);
                if (isCanonicalOfficialRole)
                {
                    continue;
                }

                var usersInRole = await userManager.GetUsersInRoleAsync(roleName);
                foreach (var user in usersInRole)
                {
                    var currentUserRoles = await userManager.GetRolesAsync(user);
                    if (currentUserRoles.Count > 0)
                    {
                        await userManager.RemoveFromRolesAsync(user, currentUserRoles);
                    }

                    var fallbackRole = AppRoles.ResolvePrimaryRole(currentUserRoles, user.SocieteId);
                    if (AppRoles.IsSocieteRequiredRole(fallbackRole) && !user.SocieteId.HasValue)
                    {
                        fallbackRole = AppRoles.SuperAdmin;
                    }

                    await userManager.AddToRoleAsync(user, fallbackRole);
                }

                var rolePermissions = await dbContext.Permissions
                    .Where(p => p.RoleId == role.Id)
                    .ToListAsync();
                if (rolePermissions.Count > 0)
                {
                    dbContext.Permissions.RemoveRange(rolePermissions);
                }

                var deleteResult = await roleManager.DeleteAsync(role);
                if (!deleteResult.Succeeded)
                {
                    Console.WriteLine(
                        $"Suppression du role legacy '{roleName}' echouee: {string.Join(", ", deleteResult.Errors.Select(e => e.Description))}");
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private static async Task EnsureRoleExistsAsync(RoleManager<IdentityRole> roleManager, string role)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                Console.WriteLine($"Role created: {role}");
            }
        }

        private static async Task TrySeedConfiguredUserAsync(
            UserManager<ApplicationUser> userManager,
            string? email,
            string? password,
            string nomComplet,
            string role,
            string label)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                Console.WriteLine($"Skipping {label} seed user: missing SeedUsers configuration.");
                return;
            }

            await SeedUserIfMissingAsync(userManager, email, password, nomComplet, role);
        }

        private static async Task SeedUserIfMissingAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string password,
            string nomComplet,
            string role)
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null)
            {
                Console.WriteLine($"User already exists: {email}");
                return;
            }

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                NomComplet = nomComplet,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
                Console.WriteLine($"User created: {email} ({role})");
            }
            else
            {
                Console.WriteLine($"Failed creating user {email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
        private static async Task SeedDocumentationMvpDemoAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config)
        {
            var societe = await dbContext.Societes.FirstOrDefaultAsync(s => s.Nom == DemoSocieteName);
            if (societe is null)
            {
                societe = new Societe
                {
                    Nom = DemoSocieteName,
                    Logo = null
                };
                dbContext.Societes.Add(societe);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"Societe creee: {DemoSocieteName}");
            }

            var demoUsers = new[]
            {
                new DemoUserSeed("rssi.demo@smsi.local", "RssiDemo@123", "RSSI Demo", "RSSI"),
                new DemoUserSeed("consultant.demo@smsi.local", "ConsultantDemo@123", "Consultant Demo", "Consultant"),
            };

            var usersByRole = new Dictionary<string, ApplicationUser>(StringComparer.OrdinalIgnoreCase);
            foreach (var demoUser in demoUsers)
            {
                await EnsureRoleExistsAsync(roleManager, demoUser.Role);
                var user = await EnsureDemoUserAsync(userManager, demoUser, societe.Id);
                usersByRole[demoUser.Role] = user;
            }

            var rssi = usersByRole["RSSI"];
            var consultant = usersByRole["Consultant"];

            var documentSeeds = new[]
            {
                new DocumentationDocument
                {
                    Name = "[DEMO] Procedure RH - Formation securite",
                    Type = "Procedure",
                    Category = "RH",
                    Status = "brouillon",
                    Version = "1.0",
                    Classification = "Interne",
                    Author = consultant.NomComplet,
                    Clause = "7.2",
                    Controle = "A.6.3",
                    Description = "Document RH non approuve pour tester les restrictions Consultant.",
                    SocieteId = societe.Id,
                    CreatedByUserId = consultant.Id,
                    LastModifiedByUserId = consultant.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-8),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Guide Technique - Gestion des acces",
                    Type = "Guide",
                    Category = "Technique",
                    Status = "en-validation",
                    Version = "0.9",
                    Classification = "Interne",
                    Author = consultant.NomComplet,
                    Clause = "8.1",
                    Controle = "A.8.2",
                    Description = "Document technique en validation pour tester le perimetre Consultant.",
                    SocieteId = societe.Id,
                    CreatedByUserId = consultant.Id,
                    LastModifiedByUserId = consultant.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Politique SMSI - Gouvernance",
                    Type = "Politique",
                    Category = "Gouvernance",
                    Status = "approuve",
                    Version = "2.0",
                    Classification = "Interne",
                    Author = rssi.NomComplet,
                    Approver = rssi.NomComplet,
                    Clause = "5.2",
                    Controle = "A.5.1",
                    Description = "Document approuve par le RSSI, visible par les utilisateurs de la societe.",
                    SocieteId = societe.Id,
                    CreatedByUserId = rssi.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId = rssi.Id,
                    ApprovedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new DocumentationDocument
                {
                    Name = "[DEMO] Registre RH - Habilitations",
                    Type = "Registre",
                    Category = "RH",
                    Status = "approuve",
                    Version = "1.1",
                    Classification = "Interne",
                    Author = consultant.NomComplet,
                    Approver = rssi.NomComplet,
                    Clause = "7.5.3",
                    Controle = "A.6.1",
                    Description = "Document RH cree par Consultant et approuve par RSSI.",
                    SocieteId = societe.Id,
                    CreatedByUserId = consultant.Id,
                    LastModifiedByUserId = rssi.Id,
                    ApprovedByUserId = rssi.Id,
                    ApprovedAt = DateTime.UtcNow.AddDays(-4),
                    CreatedAt = DateTime.UtcNow.AddDays(-9),
                    UpdatedAt = DateTime.UtcNow.AddDays(-4)
                }
            };

            foreach (var seedDoc in documentSeeds)
            {
                var exists = await dbContext.DocumentationDocuments.AnyAsync(d =>
                    d.SocieteId == societe.Id && d.Name == seedDoc.Name);

                if (!exists)
                {
                    dbContext.DocumentationDocuments.Add(seedDoc);
                }
            }

            await dbContext.SaveChangesAsync();
            Console.WriteLine("Documentation seed terminee");
        }

        private static async Task<ApplicationUser> EnsureDemoUserAsync(
            UserManager<ApplicationUser> userManager,
            DemoUserSeed seed,
            int societeId)
        {
            var user = await userManager.FindByEmailAsync(seed.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = seed.Email,
                    Email = seed.Email,
                    NomComplet = seed.NomComplet,
                    SocieteId = societeId,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, seed.Password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de creer l'utilisateur demo {seed.Email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }
                Console.WriteLine($"Utilisateur demo cree: {seed.Email}");
            }
            else
            {
                var changed = false;
                if (!string.Equals(user.NomComplet, seed.NomComplet, StringComparison.Ordinal))
                {
                    user.NomComplet = seed.NomComplet;
                    changed = true;
                }
                if (user.SocieteId != societeId)
                {
                    user.SocieteId = societeId;
                    changed = true;
                }
                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    changed = true;
                }
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    changed = true;
                }
                if (changed)
                {
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de mettre a jour l'utilisateur demo {seed.Email}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                    }
                }

                var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await userManager.ResetPasswordAsync(user, resetToken, seed.Password);
                if (!resetResult.Succeeded && !await userManager.HasPasswordAsync(user))
                {
                    var addPwdResult = await userManager.AddPasswordAsync(user, seed.Password);
                    if (!addPwdResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de definir le mot de passe demo pour {seed.Email}: {string.Join(", ", addPwdResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de reinitialiser les roles pour {seed.Email}: {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
                }
            }

            var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
            if (!addRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Impossible d'assigner le role {seed.Role} a {seed.Email}: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
            }

            return user;
        }

        private static async Task CleanupDocumentationMvpDemoAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager)
        {
            var demoUsers = await userManager.Users
                .Where(u => u.Email != null && DemoSeedEmails.Contains(u.Email))
                .ToListAsync();

            foreach (var user in demoUsers)
            {
                var roles = await userManager.GetRolesAsync(user);
                if (roles.Count > 0)
                {
                    await userManager.RemoveFromRolesAsync(user, roles);
                }

                var deleteResult = await userManager.DeleteAsync(user);
                if (!deleteResult.Succeeded)
                {
                    Console.WriteLine($"Impossible de supprimer l'utilisateur demo {user.Email}: {string.Join(", ", deleteResult.Errors.Select(e => e.Description))}");
                }
            }

            var demoSociete = await dbContext.Societes.FirstOrDefaultAsync(s => s.Nom == DemoSocieteName);
            if (demoSociete is null)
            {
                return;
            }

            var usersOnDemoSociete = await userManager.Users
                .Where(u => u.SocieteId == demoSociete.Id)
                .ToListAsync();

            foreach (var user in usersOnDemoSociete)
            {
                user.SocieteId = null;
            }

            if (usersOnDemoSociete.Count > 0)
            {
                await dbContext.SaveChangesAsync();
            }

            var demoDocs = await dbContext.DocumentationDocuments
                .Where(d => d.SocieteId == demoSociete.Id && d.Name.StartsWith("[DEMO]"))
                .ToListAsync();

            if (demoDocs.Count > 0)
            {
                dbContext.DocumentationDocuments.RemoveRange(demoDocs);
            }

            dbContext.Societes.Remove(demoSociete);
            await dbContext.SaveChangesAsync();

            Console.WriteLine($"Societe demo supprimee: {DemoSocieteName}");
        }

        private static async Task SeedAlexsysUsersAsync(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            var societes = await dbContext.Societes
                .Select(s => new { s.Id, s.Nom })
                .ToListAsync();

            var alexsys = societes.FirstOrDefault(s =>
                AlexsysSocieteNames.Any(target =>
                    string.Equals(s.Nom?.Trim(), target, StringComparison.OrdinalIgnoreCase)));

            if (alexsys is null)
            {
                Console.WriteLine("Societe Alexsys introuvable. Seed des comptes Alexsys ignore.");
                return;
            }

            var accounts = new[]
            {
                new DemoUserSeed("admin.alexsys@smsi.local", "AlexsysAdmin@123", "Admin Alexsys", AppRoles.AdminSociete),
                new DemoUserSeed("rssi.alexsys@smsi.local", "AlexsysRssi@123", "RSSI Alexsys", "RSSI"),
                new DemoUserSeed("consultant.alexsys@smsi.local", "AlexsysConsultant@123", "Consultant Alexsys", "Consultant"),
                new DemoUserSeed("user.alexsys@smsi.local", "AlexsysUser@123", "Utilisateur Alexsys", AppRoles.Consultant),
            };

            foreach (var account in accounts)
            {
                await EnsureRoleExistsAsync(roleManager, account.Role);
                await EnsureAlexsysUserAsync(userManager, account, alexsys.Id);
            }

            Console.WriteLine($"Comptes Alexsys verifies: {accounts.Length} utilisateur(s) pour {alexsys.Nom}.");
        }

        private static async Task EnsureAlexsysUserAsync(
            UserManager<ApplicationUser> userManager,
            DemoUserSeed seed,
            int societeId)
        {
            var user = await userManager.FindByEmailAsync(seed.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = seed.Email,
                    Email = seed.Email,
                    NomComplet = seed.NomComplet,
                    SocieteId = societeId,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user, seed.Password);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de creer l'utilisateur Alexsys {seed.Email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }

                var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
                if (!addRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible d'assigner le role {seed.Role} a {seed.Email}: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
                }

                Console.WriteLine($"Utilisateur Alexsys cree: {seed.Email}");
                return;
            }

            var changed = false;
            if (!string.Equals(user.NomComplet, seed.NomComplet, StringComparison.Ordinal))
            {
                user.NomComplet = seed.NomComplet;
                changed = true;
            }
            if (user.SocieteId != societeId)
            {
                user.SocieteId = societeId;
                changed = true;
            }
            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                changed = true;
            }
            if (!user.IsActive)
            {
                user.IsActive = true;
                changed = true;
            }
            if (changed)
            {
                var updateResult = await userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible de mettre a jour l'utilisateur Alexsys {seed.Email}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                }
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(seed.Role, StringComparer.OrdinalIgnoreCase) || currentRoles.Count != 1)
            {
                if (currentRoles.Count > 0)
                {
                    var removeRoleResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                    if (!removeRoleResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Impossible de retirer les roles de {seed.Email}: {string.Join(", ", removeRoleResult.Errors.Select(e => e.Description))}");
                    }
                }

                var addRoleResult = await userManager.AddToRoleAsync(user, seed.Role);
                if (!addRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Impossible d'assigner le role {seed.Role} a {seed.Email}: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
                }
            }
        }

        public static async Task SeedControlesAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            
            if (await dbContext.Controles.AnyAsync())
            {
                Console.WriteLine("Controles deja presents. Seed ignore.");
                return;
            }

            // Chercher le fichier JSON a differents emplacements
            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "controles.json"),
                Path.Combine(AppContext.BaseDirectory, "Infrastructure", "SeedData", "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "backend", "Infrastructure", "SeedData", "controles.json")
            };

            var jsonPath = candidatePaths.FirstOrDefault(File.Exists);
            if (string.IsNullOrWhiteSpace(jsonPath))
            {
                Console.WriteLine("Fichier controles.json non trouve. Chemins testes:");
                foreach (var path in candidatePaths)
                {
                    Console.WriteLine($" - {path}");
                }

                return;
            }

            Console.WriteLine($"Fichier trouve: {jsonPath}");

            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            };

            try
            {
                var jsonContent = await File.ReadAllTextAsync(jsonPath);
                var dtos = System.Text.Json.JsonSerializer.Deserialize<List<ControleDto>>(jsonContent, options);

                if (dtos is null || dtos.Count == 0)
                {
                    Console.WriteLine("Aucune donnee trouvee dans le fichier JSON");
                    return;
                }

                var controles = new List<Controle>();

                foreach (var dto in dtos)
                {
                    var controle = new Controle
                    {
                        Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                        Code = dto.Code,
                        Titre = dto.Titre,
                        Description = dto.Description,
                        Domaine = dto.Domaine,
                        Applicable = dto.Applicable,
                        RaisonsApplicabilite = dto.RaisonsApplicabilite != null && dto.RaisonsApplicabilite.Any()
                            ? System.Text.Json.JsonSerializer.Serialize(dto.RaisonsApplicabilite)
                            : null,
                        RaisonExclusion = dto.RaisonExclusion,
                        Statut = dto.Statut,
                        JustificationConformite = dto.JustificationConformite,
                        Remarque = dto.Remarque,
                        Preuves = dto.Preuves,
                        Steps = dto.Steps != null
                            ? System.Text.Json.JsonSerializer.Serialize(dto.Steps)
                            : null,
                        Priorite = dto.Priorite,
                        StatutPlan = dto.StatutPlan,
                        ResponsablePlan = dto.ResponsablePlan,
                        DateEcheance = dto.DateEcheance,
                        DateMiseAJour = dto.DateMiseAJour ?? DateTime.UtcNow,
                        DernierModificateurId = dto.DernierModificateurId,
                        DernierModificateurNom = dto.DernierModificateurNom
                    };

                    controles.Add(controle);
                }

                await dbContext.Controles.AddRangeAsync(controles);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"OK: {controles.Count} controles ISO 27001 inseres.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors du seed des controles: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

    }
}
