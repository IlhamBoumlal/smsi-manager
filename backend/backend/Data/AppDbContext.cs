using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    // Plus besoin de créer la table Users manuellement dans SSMS !
    // Identity génère tout via les migrations EF Core

    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Holding> Holdings => Set<Holding>();
        public DbSet<Societe> Societes => Set<Societe>();
    }
}
