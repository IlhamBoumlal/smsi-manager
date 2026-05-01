using backend.Application.DTOs.Controles;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private sealed record DemoUserSeed(string Email, string Password, string NomComplet, string Role);

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

            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            string[] roles =
            {
                "Super Admin", "Admin Societe", "Auditeur", "Consultant", "RSSI",
                "Admin", "Chef de Projet", "Membre", "Lecteur",
                "Responsable Securite", "Auditeur Interne",
                "Gestionnaire de Projet", "Utilisateur Standard",
                "Responsable Conformite", "DPO", "Direction Generale",
                "Responsable DevOps", "Administrateur Infrastructure et Cloud",
                "DRH", "DSI", "Employe",
                "Responsable Developpement", "Responsable Cloud",
                "Responsable Infrastructure et Cloud"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                    Console.WriteLine($"Role created: {role}");
                }
            }

            // Seed users from configuration only (no hardcoded credentials)
            var adminEmail = config["SeedUsers:Admin:Email"];
            var adminPassword = config["SeedUsers:Admin:Password"];
            var adminName = config["SeedUsers:Admin:NomComplet"] ?? "Administrateur Système";
            var adminRole = config["SeedUsers:Admin:Role"] ?? "Admin";

            var standardEmail = config["SeedUsers:Standard:Email"];
            var standardPassword = config["SeedUsers:Standard:Password"];
            var standardName = config["SeedUsers:Standard:NomComplet"] ?? "Utilisateur Standard";
            var standardRole = config["SeedUsers:Standard:Role"] ?? "Utilisateur Standard";

            await EnsureRoleExistsAsync(roleManager, adminRole);
            await EnsureRoleExistsAsync(roleManager, standardRole);
            await EnsureRoleExistsAsync(roleManager, "Admin");

            await TrySeedConfiguredUserAsync(userManager, adminEmail, adminPassword, adminName, adminRole, "Admin");
            await TrySeedConfiguredUserAsync(userManager, standardEmail, standardPassword, standardName, standardRole, "Standard");

            var seedDemo = bool.TryParse(config["SeedUsers:EnableDemo"], out var enableDemo) && enableDemo;
            if (seedDemo)
            {
                await SeedDocumentationMvpDemoAsync(dbContext, userManager, roleManager, config);
            }

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
            const string demoSocieteName = "Societe Demo RBAC";
            var societe = await dbContext.Societes.FirstOrDefaultAsync(s => s.Nom == demoSocieteName);
            if (societe is null)
            {
                societe = new Societe
                {
                    Nom = demoSocieteName,
                    Logo = null
                };
                dbContext.Societes.Add(societe);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ Société créée: {demoSocieteName}");
            }

            var demoUsers = new[]
            {
                new DemoUserSeed("rssi.demo@smsi.local", "RssiDemo@123", "RSSI Demo", "RSSI"),
                new DemoUserSeed("drh.demo@smsi.local", "DrhDemo@123", "DRH Demo", "DRH"),
                new DemoUserSeed("dsi.demo@smsi.local", "DsiDemo@123", "DSI Demo", "DSI"),
                new DemoUserSeed("employe.demo@smsi.local", "EmployeDemo@123", "Employe Demo", "Employé"),
            };

            var usersByRole = new Dictionary<string, ApplicationUser>(StringComparer.OrdinalIgnoreCase);
            foreach (var demoUser in demoUsers)
            {
                await EnsureRoleExistsAsync(roleManager, demoUser.Role);
                var user = await EnsureDemoUserAsync(userManager, demoUser, societe.Id);
                usersByRole[demoUser.Role] = user;
            }

            var rssi = usersByRole["RSSI"];
            var drh = usersByRole["DRH"];
            var dsi = usersByRole["DSI"];

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
                    Author = drh.NomComplet,
                    Clause = "7.2",
                    Controle = "A.6.3",
                    Description = "Document RH non approuve pour tester les restrictions DRH.",
                    SocieteId = societe.Id,
                    CreatedByUserId = drh.Id,
                    LastModifiedByUserId = drh.Id,
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
                    Author = dsi.NomComplet,
                    Clause = "8.1",
                    Controle = "A.8.2",
                    Description = "Document technique en validation pour tester le perimetre DSI.",
                    SocieteId = societe.Id,
                    CreatedByUserId = dsi.Id,
                    LastModifiedByUserId = dsi.Id,
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
                    Description = "Document approuve par le RSSI, visible par tous les employes.",
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
                    Author = drh.NomComplet,
                    Approver = rssi.NomComplet,
                    Clause = "7.5.3",
                    Controle = "A.6.1",
                    Description = "Document RH cree par DRH et approuve par RSSI.",
                    SocieteId = societe.Id,
                    CreatedByUserId = drh.Id,
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
            Console.WriteLine($"✅ Documentation seed terminée");
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
                Console.WriteLine($"✅ Utilisateur demo créé: {seed.Email}");
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

        // À AJOUTER dans la classe DbInitializer
        public static async Task SeedControlesAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            
            if (await dbContext.Controles.AnyAsync())
            {
                Console.WriteLine("ℹ️ Contrôles déjà présents. Seed ignoré.");
                return;
            }

            // Chercher le fichier JSON à différents emplacements
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
                    Console.WriteLine("⚠️ Aucune donnée trouvée dans le fichier JSON");
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
                Console.WriteLine($"✅ {controles.Count} contrôles ISO 27001 insérés avec succès.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur lors du seed des contrôles: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }

    }
}






