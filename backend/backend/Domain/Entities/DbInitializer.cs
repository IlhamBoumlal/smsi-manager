using backend.Application.Security;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Application.Services
{
    public static class DbInitializer
    {
        private const string BootstrapEmailFallback = "superadmin@smsi.local";
        private const string BootstrapPasswordFallback = "ChangeMe@123!";
        private const string BootstrapNameFallback = "Super Admin";

        private static readonly string[] DeprecatedRoles =
        [
            "Admin",
            "DSI",
            "DRH",
            "Employé",
            "Utilisateur Standard",
        ];

        private static readonly string[] LegacySeedAccounts =
        [
            "admin@alexsys.com",
            "rssi.demo@smsi.local",
            "drh.demo@smsi.local",
            "dsi.demo@smsi.local",
            "employe.demo@smsi.local",
            "rssi@gmail.com",
            "consultant@gmail.com",
            "auditeur@gmail.com",
            "admin@smsi.local",
        ];

        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var cleanupLegacySeedAccounts = config.GetValue<bool>("Bootstrap:CleanupLegacySeedAccounts");

            try
            {
                await dbContext.Database.MigrateAsync();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
            {
                await dbContext.Database.EnsureCreatedAsync();
            }
            catch (Exception ex)
            {
                // Certaines bases legacy existent deja sans historique EF complet.
                // On continue afin d'appliquer les hotfixes SQL idempotents.
                Console.WriteLine($"⚠️ Migration EF ignoree (mode legacy): {ex.Message}");
            }

            await EnsureSchemaCompatibilityHotfixesAsync(dbContext);
            await EnsureDocumentStatusNormalizationHotfixesAsync(dbContext);

            await EnsureFinalRolesAsync(roleManager);
            await EnsureRbacCatalogAsync(dbContext);
            await EnsureBaselineRolePermissionsAsync(dbContext, roleManager);

            // ✅ AJOUT : Initialisation des contrôles ISO 27001 depuis le fichier JSON
            await SeedControlesAsync(serviceProvider);

            if (cleanupLegacySeedAccounts)
            {
                await RemoveLegacySeedAccountsAsync(userManager);
            }
            await RemoveDeprecatedRolesAsync(userManager, roleManager);
            await EnsureSingleSuperAdminAsync(userManager, roleManager, config);
            await SynchronizePrimaryRoleKeysAsync(userManager);
        }

        private static async Task EnsureFinalRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            foreach (var roleName in AppRoles.FinalRoles)
            {
                if (await roleManager.RoleExistsAsync(roleName))
                {
                    continue;
                }

                var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                ThrowIfFailed(result, $"Création du rôle '{roleName}'");
            }
        }

        private static async Task RemoveLegacySeedAccountsAsync(UserManager<ApplicationUser> userManager)
        {
            foreach (var email in LegacySeedAccounts.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var user = await userManager.FindByEmailAsync(email);
                if (user is null)
                {
                    continue;
                }

                var roles = await userManager.GetRolesAsync(user);
                if (roles.Count > 0)
                {
                    var removeRoleResult = await userManager.RemoveFromRolesAsync(user, roles);
                    ThrowIfFailed(removeRoleResult, $"Suppression des rôles de '{email}'");
                }

                var deleteResult = await userManager.DeleteAsync(user);
                ThrowIfFailed(deleteResult, $"Suppression du compte legacy '{email}'");
            }
        }

        private static async Task RemoveDeprecatedRolesAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            foreach (var deprecatedRole in DeprecatedRoles)
            {
                if (!await roleManager.RoleExistsAsync(deprecatedRole))
                {
                    continue;
                }

                var users = await userManager.GetUsersInRoleAsync(deprecatedRole);
                foreach (var user in users)
                {
                    var removeResult = await userManager.RemoveFromRoleAsync(user, deprecatedRole);
                    ThrowIfFailed(removeResult, $"Retrait du rôle legacy '{deprecatedRole}' pour '{user.Email}'");
                }

                var role = await roleManager.FindByNameAsync(deprecatedRole);
                if (role is null)
                {
                    continue;
                }

                var deleteRoleResult = await roleManager.DeleteAsync(role);
                ThrowIfFailed(deleteRoleResult, $"Suppression du rôle legacy '{deprecatedRole}'");
            }
        }

        private static async Task EnsureSingleSuperAdminAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config)
        {
            if (!await roleManager.RoleExistsAsync(AppRoles.SuperAdmin))
            {
                var createRoleResult = await roleManager.CreateAsync(new IdentityRole(AppRoles.SuperAdmin));
                ThrowIfFailed(createRoleResult, "Création du rôle Super Admin");
            }

            var bootstrapEmail = config["Bootstrap:SuperAdmin:Email"]?.Trim();
            if (string.IsNullOrWhiteSpace(bootstrapEmail))
            {
                bootstrapEmail = BootstrapEmailFallback;
            }

            var bootstrapPassword = config["Bootstrap:SuperAdmin:Password"];
            if (string.IsNullOrWhiteSpace(bootstrapPassword))
            {
                bootstrapPassword = BootstrapPasswordFallback;
            }

            var bootstrapName = config["Bootstrap:SuperAdmin:NomComplet"];
            if (string.IsNullOrWhiteSpace(bootstrapName))
            {
                bootstrapName = BootstrapNameFallback;
            }

            var superAdmins = (await userManager.GetUsersInRoleAsync(AppRoles.SuperAdmin)).ToList();

            ApplicationUser? primarySuperAdmin = await userManager.FindByEmailAsync(bootstrapEmail);
            if (primarySuperAdmin is null)
            {
                primarySuperAdmin = new ApplicationUser
                {
                    UserName = bootstrapEmail,
                    Email = bootstrapEmail,
                    NomComplet = bootstrapName,
                    PrimaryRoleKey = AppRoles.SuperAdminRoleKey,
                    EmailConfirmed = true,
                    IsActive = true,
                    SocieteId = null,
                    CreatedAt = DateTime.UtcNow,
                };

                var createResult = await userManager.CreateAsync(primarySuperAdmin, bootstrapPassword);
                ThrowIfFailed(createResult, "Création du Super Admin initial");
            }

            if (!await userManager.IsInRoleAsync(primarySuperAdmin, AppRoles.SuperAdmin))
            {
                var addRoleResult = await userManager.AddToRoleAsync(primarySuperAdmin, AppRoles.SuperAdmin);
                ThrowIfFailed(addRoleResult, $"Attribution du rôle Super Admin à '{primarySuperAdmin.Email}'");
            }

            await NormalizePrimarySuperAdminAsync(userManager, primarySuperAdmin, bootstrapName);

            superAdmins = (await userManager.GetUsersInRoleAsync(AppRoles.SuperAdmin))
                .OrderBy(u => u.CreatedAt)
                .ThenBy(u => u.Id, StringComparer.Ordinal)
                .ToList();

            foreach (var user in superAdmins)
            {
                if (user.Id == primarySuperAdmin.Id)
                {
                    continue;
                }

                var removeRoleResult = await userManager.RemoveFromRoleAsync(user, AppRoles.SuperAdmin);
                ThrowIfFailed(removeRoleResult, $"Retrait du rôle Super Admin de '{user.Email}'");

                user.IsActive = false;
                user.PrimaryRoleKey = AppRoles.ConsultantRoleKey;
                var updateResult = await userManager.UpdateAsync(user);
                ThrowIfFailed(updateResult, $"Désactivation du compte Super Admin en doublon '{user.Email}'");
            }
        }

        private static async Task NormalizePrimarySuperAdminAsync(
            UserManager<ApplicationUser> userManager,
            ApplicationUser primarySuperAdmin,
            string bootstrapName)
        {
            var primaryRoles = await userManager.GetRolesAsync(primarySuperAdmin);
            var rolesToRemove = primaryRoles
                .Where(role => !AppRoles.IsSuperAdminRole(role))
                .ToList();

            if (rolesToRemove.Count > 0)
            {
                var removeOtherRolesResult = await userManager.RemoveFromRolesAsync(primarySuperAdmin, rolesToRemove);
                ThrowIfFailed(removeOtherRolesResult, $"Nettoyage des rôles non Super Admin pour '{primarySuperAdmin.Email}'");
            }

            if (!await userManager.IsInRoleAsync(primarySuperAdmin, AppRoles.SuperAdmin))
            {
                var addRoleResult = await userManager.AddToRoleAsync(primarySuperAdmin, AppRoles.SuperAdmin);
                ThrowIfFailed(addRoleResult, $"Attribution du rôle Super Admin à '{primarySuperAdmin.Email}'");
            }

            var needsUpdate = false;

            if (primarySuperAdmin.SocieteId.HasValue)
            {
                primarySuperAdmin.SocieteId = null;
                needsUpdate = true;
            }

            if (!primarySuperAdmin.IsActive)
            {
                primarySuperAdmin.IsActive = true;
                needsUpdate = true;
            }

            if (!string.Equals(primarySuperAdmin.PrimaryRoleKey, AppRoles.SuperAdminRoleKey, StringComparison.OrdinalIgnoreCase))
            {
                primarySuperAdmin.PrimaryRoleKey = AppRoles.SuperAdminRoleKey;
                needsUpdate = true;
            }

            if (!primarySuperAdmin.EmailConfirmed)
            {
                primarySuperAdmin.EmailConfirmed = true;
                needsUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(primarySuperAdmin.NomComplet))
            {
                primarySuperAdmin.NomComplet = bootstrapName;
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                var updateResult = await userManager.UpdateAsync(primarySuperAdmin);
                ThrowIfFailed(updateResult, $"Mise à jour du Super Admin principal '{primarySuperAdmin.Email}'");
            }
        }

        private static async Task SynchronizePrimaryRoleKeysAsync(UserManager<ApplicationUser> userManager)
        {
            var users = await userManager.Users.ToListAsync();

            foreach (var user in users)
            {
                var roles = await userManager.GetRolesAsync(user);
                var resolvedRoleName = AppRoles.ResolvePrimaryRole(roles, user.SocieteId);
                var targetRoleKey = AppRoles.ToPrimaryRoleKey(resolvedRoleName, user.SocieteId);

                var needsUpdate = false;

                if (!string.Equals(user.PrimaryRoleKey, targetRoleKey, StringComparison.OrdinalIgnoreCase))
                {
                    user.PrimaryRoleKey = targetRoleKey;
                    needsUpdate = true;
                }

                if (AppRoles.IsSuperAdminRoleKey(targetRoleKey))
                {
                    if (user.SocieteId.HasValue)
                    {
                        user.SocieteId = null;
                        needsUpdate = true;
                    }
                }
                else if (!user.SocieteId.HasValue && user.IsActive)
                {
                    // Active société-scoped users must be bound to a company.
                    user.IsActive = false;
                    needsUpdate = true;
                }

                if (!needsUpdate)
                {
                    continue;
                }

                var updateResult = await userManager.UpdateAsync(user);
                ThrowIfFailed(updateResult, $"Synchronisation PrimaryRoleKey pour '{user.Email}'");
            }
        }

        private static async Task EnsureRbacCatalogAsync(AppDbContext dbContext)
        {
            var now = DateTime.UtcNow;

            var modules = new (string Code, string Name)[]
            {
                ("dashboard", "Dashboard SMSI"),
                ("cartographie", "Cartographie"),
                ("pdca", "PDCA"),
                ("clauses", "Clauses"),
                ("controles", "Controles"),
                ("risques", "Risques"),
                ("documentation", "Documentation"),
                ("actifs", "Actifs"),
                ("incidents", "Incidents"),
                ("sensibilisation", "Sensibilisation"),
                ("audit", "Audits"),
                ("chatbot", "Chatbot"),
                ("tracabilite", "Tracabilite Utilisateurs"),
                ("users", "Gestion Utilisateurs"),
                ("roles", "Gestion Roles"),
                ("holdings", "Gestion Holdings"),
                ("societes", "Gestion Societes"),
                ("statistiques", "Dashboard Plateforme")
            };

            var actions = new (string Code, string Name)[]
            {
                (PermissionCatalog.Actions.Read, "Lire"),
                (PermissionCatalog.Actions.Create, "Creer"),
                (PermissionCatalog.Actions.Edit, "Modifier"),
                (PermissionCatalog.Actions.Delete, "Supprimer"),
                (PermissionCatalog.Actions.Import, "Importer"),
                (PermissionCatalog.Actions.Export, "Exporter"),
                (PermissionCatalog.Actions.Approve, "Approuver"),
                (PermissionCatalog.Actions.Administer, "Administrer"),
            };

            var existingModules = await dbContext.Modules.ToListAsync();
            var existingByCode = existingModules
                .ToDictionary(
                    m => PermissionCatalog.CanonicalizeModule(m.Code),
                    m => m,
                    StringComparer.OrdinalIgnoreCase);

            var existingActions = await dbContext.Actions.ToListAsync();
            var actionsByCode = existingActions
                .ToDictionary(
                    a => PermissionCatalog.Actions.Canonicalize(a.Code),
                    a => a,
                    StringComparer.OrdinalIgnoreCase);

            foreach (var module in modules)
            {
                var key = PermissionCatalog.CanonicalizeModule(module.Code);
                if (existingByCode.ContainsKey(key))
                {
                    continue;
                }

                dbContext.Modules.Add(new backend.Domain.Entities.Module
                {
                    Id = Guid.NewGuid().ToString(),
                    Code = module.Code,
                    Name = module.Name,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }

            foreach (var action in actions)
            {
                var key = PermissionCatalog.Actions.Canonicalize(action.Code);
                if (actionsByCode.ContainsKey(key))
                {
                    continue;
                }

                dbContext.Actions.Add(new backend.Domain.Entities.Action
                {
                    Id = Guid.NewGuid().ToString(),
                    Code = action.Code,
                    Name = action.Name
                });
            }

            await dbContext.SaveChangesAsync();
        }

        private static async Task EnsureBaselineRolePermissionsAsync(
            AppDbContext dbContext,
            RoleManager<IdentityRole> roleManager)
        {
            var roles = await roleManager.Roles
                .AsNoTracking()
                .Where(r => AppRoles.FinalRoles.Contains(r.Name!))
                .ToListAsync();

            if (roles.Count == 0)
            {
                return;
            }

            var modules = await dbContext.Modules
                .AsNoTracking()
                .ToListAsync();

            var actions = await dbContext.Actions
                .AsNoTracking()
                .ToListAsync();

            var moduleIdByCode = modules.ToDictionary(
                m => PermissionCatalog.CanonicalizeModule(m.Code),
                m => m.Id,
                StringComparer.OrdinalIgnoreCase);

            var actionIdByCode = actions.ToDictionary(
                a => PermissionCatalog.Actions.Canonicalize(a.Code),
                a => a.Id,
                StringComparer.OrdinalIgnoreCase);

            var readAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Read);
            var createAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Create);
            var editAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Edit);
            var deleteAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Delete);
            var importAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Import);
            var exportAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Export);
            var approveAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Approve);
            var administerAction = ResolveActionId(actionIdByCode, PermissionCatalog.Actions.Administer);

            var smsiModules = PermissionCatalog.SmsiModules
                .Where(moduleIdByCode.ContainsKey)
                .ToArray();

            var platformModules = PermissionCatalog.PlatformModules
                .Where(moduleIdByCode.ContainsKey)
                .ToArray();

            var templates = new Dictionary<string, Dictionary<string, string[]>>(StringComparer.OrdinalIgnoreCase)
            {
                [AppRoles.SuperAdmin] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["holdings"] = [readAction, createAction, editAction, deleteAction, administerAction],
                    ["societes"] = [readAction, createAction, editAction, deleteAction, administerAction],
                    ["users"] = [readAction, createAction, editAction, deleteAction, administerAction],
                    ["statistiques"] = [readAction, exportAction],
                },
                [AppRoles.AdminSociete] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dashboard"] = [readAction, createAction, editAction, deleteAction, exportAction],
                    ["cartographie"] = [readAction],
                    ["pdca"] = [readAction],
                    ["clauses"] = [readAction],
                    ["controles"] = [readAction],
                    ["risques"] = [readAction],
                    ["documentation"] = [readAction],
                    ["actifs"] = [readAction],
                    ["incidents"] = [readAction],
                    ["sensibilisation"] = [readAction],
                    ["audit"] = [readAction],
                    ["chatbot"] = [readAction],
                    ["tracabilite"] = [readAction, exportAction],
                    ["users"] = [readAction, createAction, editAction, deleteAction, administerAction],
                    ["roles"] = [readAction, editAction, administerAction],
                },
                [AppRoles.Rssi] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dashboard"] = [readAction, createAction, editAction, deleteAction, exportAction],
                    ["cartographie"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["pdca"] = [readAction, createAction, editAction, deleteAction, exportAction],
                    ["clauses"] = [readAction, createAction, editAction, deleteAction, exportAction],
                    ["controles"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["risques"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["documentation"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction, approveAction],
                    ["actifs"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["incidents"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["sensibilisation"] = [readAction, createAction, editAction, deleteAction, importAction, exportAction],
                    ["audit"] = [readAction, createAction, editAction, deleteAction, exportAction],
                    ["chatbot"] = [readAction],
                },
                [AppRoles.Consultant] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dashboard"] = [readAction],
                    ["cartographie"] = [readAction],
                    ["pdca"] = [readAction],
                    ["clauses"] = [readAction],
                    ["controles"] = [readAction],
                    ["risques"] = [readAction],
                    ["documentation"] = [readAction],
                    ["actifs"] = [readAction],
                    ["incidents"] = [readAction],
                    ["sensibilisation"] = [readAction],
                    ["audit"] = [readAction],
                    ["chatbot"] = [readAction],
                },
                [AppRoles.Auditeur] = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dashboard"] = [readAction],
                    ["cartographie"] = [readAction],
                    ["pdca"] = [readAction],
                    ["clauses"] = [readAction],
                    ["controles"] = [readAction],
                    ["risques"] = [readAction],
                    ["documentation"] = [readAction],
                    ["actifs"] = [readAction],
                    ["incidents"] = [readAction],
                    ["sensibilisation"] = [readAction],
                    ["audit"] = [readAction],
                    ["chatbot"] = [readAction],
                },
            };

            var roleIdByName = roles.ToDictionary(r => r.Name!, r => r.Id, StringComparer.OrdinalIgnoreCase);

            var desiredPermissionsByRoleId = new Dictionary<string, HashSet<(string ModuleId, string ActionId)>>();

            foreach (var template in templates)
            {
                if (!roleIdByName.TryGetValue(template.Key, out var roleId))
                {
                    continue;
                }

                var set = new HashSet<(string ModuleId, string ActionId)>();
                foreach (var moduleEntry in template.Value)
                {
                    if (!moduleIdByCode.TryGetValue(PermissionCatalog.CanonicalizeModule(moduleEntry.Key), out var moduleId))
                    {
                        continue;
                    }

                    foreach (var actionId in moduleEntry.Value.Distinct(StringComparer.Ordinal))
                    {
                        if (string.IsNullOrWhiteSpace(actionId))
                        {
                            continue;
                        }

                        set.Add((moduleId, actionId));
                    }
                }

                desiredPermissionsByRoleId[roleId] = set;
            }

            var allPermissions = await dbContext.Permissions.ToListAsync();

            foreach (var roleEntry in desiredPermissionsByRoleId)
            {
                var roleId = roleEntry.Key;
                var desired = roleEntry.Value;

                var current = allPermissions
                    .Where(p => p.RoleId == roleId)
                    .ToList();

                foreach (var permission in current)
                {
                    var key = (permission.ModuleId, permission.ActionId);
                    if (desired.Contains(key))
                    {
                        continue;
                    }

                    dbContext.Permissions.Remove(permission);
                }

                foreach (var key in desired)
                {
                    var exists = current.Any(p => p.ModuleId == key.ModuleId && p.ActionId == key.ActionId);
                    if (exists)
                    {
                        continue;
                    }

                    dbContext.Permissions.Add(new backend.Domain.Entities.Permission
                    {
                        Id = Guid.NewGuid().ToString(),
                        RoleId = roleId,
                        ModuleId = key.ModuleId,
                        ActionId = key.ActionId
                    });
                }
            }

            // Règle absolue: super admin jamais sur les modules SMSI.
            if (roleIdByName.TryGetValue(AppRoles.SuperAdmin, out var superAdminRoleId))
            {
                var smsiModuleIds = smsiModules
                    .Where(moduleIdByCode.ContainsKey)
                    .Select(code => moduleIdByCode[code])
                    .ToArray();

                if (smsiModuleIds.Length > 0)
                {
                    await dbContext.Permissions
                        .Where(p => p.RoleId == superAdminRoleId && smsiModuleIds.Contains(p.ModuleId))
                        .ExecuteDeleteAsync();
                }
            }

            // Règle stricte: rôles société jamais sur les modules plateforme.
            var societeRoleNames = new[] { AppRoles.AdminSociete, AppRoles.Rssi, AppRoles.Consultant, AppRoles.Auditeur };
            var societeRoleIds = societeRoleNames
                .Where(roleIdByName.ContainsKey)
                .Select(name => roleIdByName[name])
                .ToArray();

            var platformModuleIds = platformModules
                .Where(moduleIdByCode.ContainsKey)
                .Select(code => moduleIdByCode[code])
                .ToArray();

            if (societeRoleIds.Length > 0 && platformModuleIds.Length > 0)
            {
                await dbContext.Permissions
                    .Where(p => societeRoleIds.Contains(p.RoleId) && platformModuleIds.Contains(p.ModuleId))
                    .ExecuteDeleteAsync();
            }

            await dbContext.SaveChangesAsync();
        }

        private static string ResolveActionId(
            IReadOnlyDictionary<string, string> actionIdByCode,
            string expectedActionCode)
        {
            var key = PermissionCatalog.Actions.Canonicalize(expectedActionCode);
            if (actionIdByCode.TryGetValue(key, out var actionId))
            {
                return actionId;
            }

            throw new InvalidOperationException($"Action RBAC manquante: {expectedActionCode}");
        }

        private static void ThrowIfFailed(IdentityResult result, string operation)
        {
            if (result.Succeeded)
            {
                return;
            }

            var details = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"{operation} a échoué: {details}");
        }

        private static async Task EnsureSchemaCompatibilityHotfixesAsync(AppDbContext dbContext)
        {
            const string sql = """
IF OBJECT_ID(N'[ActionPlans]', N'U') IS NOT NULL
AND COL_LENGTH(N'ActionPlans', N'GuidId') IS NULL
BEGIN
    ALTER TABLE [ActionPlans]
    ADD [GuidId] uniqueidentifier NOT NULL
        CONSTRAINT [DF_ActionPlans_GuidId] DEFAULT NEWID();
END

IF OBJECT_ID(N'[ProcessusClauses]', N'U') IS NULL
BEGIN
    CREATE TABLE [ProcessusClauses] (
        [Id] uniqueidentifier NOT NULL,
        [ProcessusId] uniqueidentifier NOT NULL,
        [ClauseId] int NOT NULL,
        [SocieteId] int NULL,
        [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_ProcessusClauses_CreatedAt] DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_ProcessusClauses_UpdatedAt] DEFAULT SYSUTCDATETIME(),
        [Justification] nvarchar(max) NULL,
        CONSTRAINT [PK_ProcessusClauses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProcessusClauses_Processus_ProcessusId] FOREIGN KEY ([ProcessusId]) REFERENCES [Processus]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProcessusClauses_IsoClauses_ClauseId] FOREIGN KEY ([ClauseId]) REFERENCES [IsoClauses]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProcessusClauses_Societes_SocieteId] FOREIGN KEY ([SocieteId]) REFERENCES [Societes]([Id]) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX [IX_ProcessusClauses_ProcessusId_ClauseId] ON [ProcessusClauses]([ProcessusId], [ClauseId]);
    CREATE INDEX [IX_ProcessusClauses_SocieteId] ON [ProcessusClauses]([SocieteId]);
END

IF OBJECT_ID(N'[ProcessusControles]', N'U') IS NULL
BEGIN
    CREATE TABLE [ProcessusControles] (
        [Id] uniqueidentifier NOT NULL,
        [ProcessusId] uniqueidentifier NOT NULL,
        [ControleId] uniqueidentifier NOT NULL,
        [SocieteId] int NULL,
        [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_ProcessusControles_CreatedAt] DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NOT NULL CONSTRAINT [DF_ProcessusControles_UpdatedAt] DEFAULT SYSUTCDATETIME(),
        [Justification] nvarchar(max) NULL,
        CONSTRAINT [PK_ProcessusControles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProcessusControles_Processus_ProcessusId] FOREIGN KEY ([ProcessusId]) REFERENCES [Processus]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProcessusControles_controles_ControleId] FOREIGN KEY ([ControleId]) REFERENCES [controles]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProcessusControles_Societes_SocieteId] FOREIGN KEY ([SocieteId]) REFERENCES [Societes]([Id]) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX [IX_ProcessusControles_ProcessusId_ControleId] ON [ProcessusControles]([ProcessusId], [ControleId]);
    CREATE INDEX [IX_ProcessusControles_SocieteId] ON [ProcessusControles]([SocieteId]);
END
""";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        private static async Task EnsureDocumentStatusNormalizationHotfixesAsync(AppDbContext dbContext)
        {
            const string sql = """
IF OBJECT_ID(N'[Documents]', N'U') IS NOT NULL
BEGIN
    UPDATE [Documents]
    SET [Statut] = 'brouillon'
    WHERE [Statut] IS NULL OR LTRIM(RTRIM([Statut])) = '';

    UPDATE [Documents]
    SET [Statut] = CASE
        WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('approuve', 'approuver', 'en vigueur', 'envigueur') THEN 'approuve'
        WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('en-validation', 'en validation') THEN 'en-validation'
        WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('brouillon', 'en cours', 'encours', 'en cours de redaction') THEN 'brouillon'
        WHEN LOWER(LTRIM(RTRIM([Statut]))) COLLATE Latin1_General_100_CI_AI IN ('a-revoir', 'a revoir', 'a reviser', 'obsolete') THEN 'a-revoir'
        ELSE [Statut]
    END
    WHERE [Statut] IS NOT NULL;
END

IF OBJECT_ID(N'[DocumentationDocuments]', N'U') IS NOT NULL
BEGIN
    UPDATE [DocumentationDocuments]
    SET [Status] = 'brouillon'
    WHERE [Status] IS NULL OR LTRIM(RTRIM([Status])) = '';

    UPDATE [DocumentationDocuments]
    SET [Status] = CASE
        WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('approuve', 'approuver') THEN 'approuve'
        WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('en-validation', 'en validation') THEN 'en-validation'
        WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('brouillon') THEN 'brouillon'
        WHEN LOWER(LTRIM(RTRIM([Status]))) COLLATE Latin1_General_100_CI_AI IN ('a-revoir', 'a revoir', 'a reviser') THEN 'a-revoir'
        ELSE [Status]
    END
    WHERE [Status] IS NOT NULL;
END
""";

            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }

        // =====================================================================
        //  INITIALISATION DES CONTRÔLES ISO 27001 À PARTIR D'UN FICHIER JSON
        // =====================================================================

        public static async Task SeedControlesAsync(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

            if (await dbContext.Controles.AnyAsync())
            {
                Console.WriteLine("ℹ️  Contrôles déjà présents — seed ignoré.");
                return;
            }

            var candidatePaths = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "controles.json"),
                Path.Combine(AppContext.BaseDirectory, "Infrastructure", "SeedData", "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "controles.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "SeedData", "controles.json"),
            };

            var jsonPath = candidatePaths.FirstOrDefault(File.Exists);
            if (string.IsNullOrWhiteSpace(jsonPath))
            {
                Console.WriteLine("⚠️  Fichier controles.json non trouvé.");
                return;
            }

            Console.WriteLine($"📄 Fichier trouvé : {jsonPath}");

            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    Converters = { new JsonStringEnumConverter() }
                };

                var jsonContent = await File.ReadAllTextAsync(jsonPath);
                var dtos = JsonSerializer.Deserialize<List<ControleSeedDto>>(jsonContent, options);

                if (dtos is null || dtos.Count == 0)
                {
                    Console.WriteLine("⚠️  Aucune donnée trouvée dans controles.json.");
                    return;
                }

                var controles = new List<Controle>();

                foreach (var dto in dtos)
                {
                    // Mapping DomaineControle
                    var domaine = dto.Domaine?.Trim() switch
                    {
                        "Organisationnel" => DomaineControle.Organisationnel,
                        "Personnes" => DomaineControle.Personnes,
                        "Physique" => DomaineControle.Physique,
                        "Technologique" => DomaineControle.Technologique,
                        _ => DomaineControle.Organisationnel
                    };

                    // Mapping Statut
                    if (!Enum.TryParse<Statut>(dto.Statut, true, out var statut))
                    {
                        Console.WriteLine($"⚠️ Statut invalide pour {dto.Code}: {dto.Statut}, utilisation de NonEvalue");
                        statut = Statut.NonEvalue;
                    }

                    // Mapping StatutPlan (nullable)
                    StatutPlan? statutPlan = null;
                    if (!string.IsNullOrWhiteSpace(dto.StatutPlan))
                    {
                        if (!Enum.TryParse<StatutPlan>(dto.StatutPlan, true, out var sp))
                            Console.WriteLine($"⚠️ StatutPlan invalide pour {dto.Code}: {dto.StatutPlan}, laissé null");
                        else
                            statutPlan = sp;
                    }

                    var controle = new Controle
                    {
                        Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                        Code = dto.Code,
                        Titre = dto.Titre,
                        Description = dto.Description,
                        Domaine = domaine,
                        Applicable = dto.Applicable,
                        RaisonsApplicabilite = dto.RaisonsApplicabilite?.Any() == true
                            ? JsonSerializer.Serialize(dto.RaisonsApplicabilite)
                            : null,
                        RaisonExclusion = dto.RaisonExclusion,
                        Statut = statut,
                        JustificationConformite = dto.JustificationConformite,
                        Remarque = dto.Remarque,
                        Preuves = dto.Preuves,
                        Steps = dto.Steps?.Any() == true ? JsonSerializer.Serialize(dto.Steps) : null,
                        Priorite = dto.Priorite,
                        StatutPlan = statutPlan,
                        ResponsablePlan = dto.ResponsablePlan,
                        DateEcheance = dto.DateEcheance,
                        DateMiseAJour = dto.DateMiseAJour ?? DateTime.UtcNow,
                        DernierModificateurId = dto.DernierModificateurId,
                        DernierModificateurNom = dto.DernierModificateurNom,
                    };

                    controles.Add(controle);
                }

                await dbContext.Controles.AddRangeAsync(controles);
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"✅ {controles.Count} contrôles ISO 27001 insérés.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur seed contrôles : {ex.Message}");
                Console.WriteLine($"   Stack trace : {ex.StackTrace}");
            }
        }

        private class ControleSeedDto
        {
            public Guid Id { get; set; }
            public string Code { get; set; } = string.Empty;
            public string Titre { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Domaine { get; set; } = string.Empty;
            public bool Applicable { get; set; }
            public List<string>? RaisonsApplicabilite { get; set; }
            public string? RaisonExclusion { get; set; }
            public string Statut { get; set; } = "NonEvalue";
            public string? JustificationConformite { get; set; }
            public string? Remarque { get; set; }
            public string? Preuves { get; set; }
            public List<string>? Steps { get; set; }
            public string? Priorite { get; set; }
            public string? StatutPlan { get; set; }
            public string? ResponsablePlan { get; set; }
            public DateTime? DateEcheance { get; set; }
            public DateTime? DateMiseAJour { get; set; }
            public string? DernierModificateurId { get; set; }
            public string? DernierModificateurNom { get; set; }
        }
    }
}
