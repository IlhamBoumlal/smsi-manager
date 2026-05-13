using backend.Application.Security;
using backend.Domain.Entities;
using backend.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

var email = args.Length > 0 ? args[0] : "admin@smsi.local";
var newPassword = args.Length > 1 ? args[1] : "ChangeMe@123!";

var backendRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));

var configuration = new ConfigurationBuilder()
    .SetBasePath(backendRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var connectionString = configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("ConnectionStrings:DefaultConnection introuvable.");
    return 1;
}

var services = new ServiceCollection();

services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
services.AddDataProtection();
services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

using var provider = services.BuildServiceProvider();
using var scope = provider.CreateScope();

var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

if (!await roleManager.RoleExistsAsync(AppRoles.SuperAdmin))
{
    var createRole = await roleManager.CreateAsync(new IdentityRole(AppRoles.SuperAdmin));
    if (!createRole.Succeeded)
    {
        Console.Error.WriteLine("Impossible de creer le role Super Admin: " + string.Join(", ", createRole.Errors.Select(e => e.Description)));
        return 2;
    }
}

var user = await userManager.FindByEmailAsync(email);
if (user is null)
{
    var existingActiveSuperAdmin = await userManager.Users
        .FirstOrDefaultAsync(u => u.IsActive && u.PrimaryRoleKey == AppRoles.SuperAdminRoleKey);

    if (existingActiveSuperAdmin is not null)
    {
        existingActiveSuperAdmin.UserName = email;
        existingActiveSuperAdmin.Email = email;
        existingActiveSuperAdmin.EmailConfirmed = true;
        existingActiveSuperAdmin.PrimaryRoleKey = AppRoles.SuperAdminRoleKey;
        existingActiveSuperAdmin.SocieteId = null;
        existingActiveSuperAdmin.IsActive = true;

        var renameResult = await userManager.UpdateAsync(existingActiveSuperAdmin);
        if (!renameResult.Succeeded)
        {
            Console.Error.WriteLine("Echec renommage Super Admin actif: " + string.Join(", ", renameResult.Errors.Select(e => e.Description)));
            return 3;
        }

        user = existingActiveSuperAdmin;
    }
    else
    {
        user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            NomComplet = "Super Admin",
            PrimaryRoleKey = AppRoles.SuperAdminRoleKey,
            EmailConfirmed = true,
            IsActive = true,
            SocieteId = null,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, newPassword);
        if (!createResult.Succeeded)
        {
            Console.Error.WriteLine("Echec creation utilisateur: " + string.Join(", ", createResult.Errors.Select(e => e.Description)));
            return 3;
        }
    }
}

var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
var resetResult = await userManager.ResetPasswordAsync(user, resetToken, newPassword);
if (!resetResult.Succeeded)
{
    Console.Error.WriteLine("Echec reset password: " + string.Join(", ", resetResult.Errors.Select(e => e.Description)));
    return 4;
}

if (!await userManager.IsInRoleAsync(user, AppRoles.SuperAdmin))
{
    var addRole = await userManager.AddToRoleAsync(user, AppRoles.SuperAdmin);
    if (!addRole.Succeeded)
    {
        Console.Error.WriteLine("Echec attribution role Super Admin: " + string.Join(", ", addRole.Errors.Select(e => e.Description)));
        return 5;
    }
}

user.PrimaryRoleKey = AppRoles.SuperAdminRoleKey;
user.SocieteId = null;
user.IsActive = true;
user.LockoutEnd = null;
user.AccessFailedCount = 0;

var update = await userManager.UpdateAsync(user);
if (!update.Succeeded)
{
    Console.Error.WriteLine("Echec mise a jour utilisateur: " + string.Join(", ", update.Errors.Select(e => e.Description)));
    return 6;
}

Console.WriteLine($"Mot de passe reinitialise pour {email}");
return 0;
