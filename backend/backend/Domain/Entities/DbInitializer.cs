using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace backend.Application.Services
{
   public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Création des rôles
            string[] roles = {
                "Admin", "Chef de Projet", "Membre", "Lecteur",
                "Responsable Sécurité", "Auditeur Interne",
                "Gestionnaire de Projet", "Consultant", "Utilisateur Standard",
                "Responsable Conformité", "DPO", "Direction Générale",
                "Responsable DevOps",
                "Administrateur Infrastructure et Cloud",
                "RSSI",
                "Responsable Développement",
                "Responsable Cloud",
                "Responsable Infrastructure et Cloud"
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));
            }

            // Création de l'administrateur
            var adminEmail = "admin@alexsys.com";
            var adminPassword = "Admin@123456!";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    NomComplet = "Administrateur Système",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Création de l'utilisateur standard
            var userEmail = "user@alexsys.com";
            var userPassword = "User@123456!";

            var normalUser = await userManager.FindByEmailAsync(userEmail);
            if (normalUser == null)
            {
                normalUser = new ApplicationUser
                {
                    UserName = userEmail,
                    Email = userEmail,
                    NomComplet = "Utilisateur Standard",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(normalUser, userPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(normalUser, "Utilisateur Standard");
                }
            }
        }
    }
}