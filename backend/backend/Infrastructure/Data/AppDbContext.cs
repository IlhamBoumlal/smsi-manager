using backend.Domain.Entities;
using Domain.Entities;
using Domain.Enumerations;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Holding> Holdings { get; set; }
    public DbSet<Societe> Societes { get; set; }
    public DbSet<Controle> Controles { get; set; }
    public DbSet<Actif> Actifs { get; set; }
    public DbSet<IsoClause> IsoClauses { get; set; }
    public DbSet<ConformityStatus> ConformityStatuses { get; set; }
    public DbSet<ActionPlan> ActionPlans { get; set; }
    public DbSet<PdcaCycle> PdcaCycles { get; set; }
    public DbSet<PdcaItem> PdcaItems { get; set; }
    public DbSet<Phase> Phases { get; set; }
    public DbSet<PlanStep> PlanSteps { get; set; }
    public DbSet<Section> Sections { get; set; }
    public DbSet<ConformityProof> ConformityProofs => Set<ConformityProof>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
    public DbSet<Profil> Profils { get; set; }
    public DbSet<ControleHistorique> ControleHistoriques { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Configuration de la table CONTROLE ──────────────────────────────
        modelBuilder.Entity<Controle>(e =>
        {
            e.ToTable("controles");
            e.HasKey(c => c.Id);

            e.Property(c => c.Code).IsRequired().HasMaxLength(10);
            e.Property(c => c.Titre).IsRequired().HasMaxLength(255);

            // Conversion des Enums en String pour la base de données
            e.Property(c => c.Domaine).HasConversion<string>();
            e.Property(c => c.Statut).HasConversion<string>();
            e.Property(c => c.StatutPlan).HasConversion<string>();

            e.HasIndex(c => c.Code).IsUnique();

           
        });

        // ── Configuration de ConformityProof ────────────────────────────────
        modelBuilder.Entity<ConformityProof>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Clause)
             .WithMany()
             .HasForeignKey(p => p.IsoClauseId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(p => new { p.IsoClauseId, p.UserId });
        });

        // ── Configuration de FileAttachment ─────────────────────────────────
        modelBuilder.Entity<FileAttachment>(e =>
        {
            e.HasKey(f => f.Id);
            e.Property(f => f.Content).IsRequired();

            e.HasOne(f => f.ConformityProof)
             .WithMany(p => p.Files)
             .HasForeignKey(f => f.ConformityProofId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(f => f.ActionPlan)
             .WithMany()
             .HasForeignKey(f => f.ActionPlanId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Configuration ApplicationUser ───────────────────────────────────
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Societe)
            .WithMany()
            .HasForeignKey(u => u.SocieteId);

        // ── Configuration IsoClause ─────────────────────────────────────────
        modelBuilder.Entity<IsoClause>()
            .HasIndex(c => c.Number);

        // ── Configuration ActionPlan (Relations doubles vers IsoClause) ──────
        modelBuilder.Entity<ActionPlan>(e =>
        {
            e.HasOne(ap => ap.Clause)
             .WithMany(c => c.ActionPlans)
             .HasForeignKey(ap => ap.IsoClauseId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ap => ap.SubClause)
             .WithMany()
             .HasForeignKey(ap => ap.SubClauseId)
             .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<ControleHistorique>(entity =>
        {
            entity.HasIndex(h => h.ControleId);
            entity.HasIndex(h => h.DateModification);

            entity.HasOne(h => h.Controle)
                  .WithMany()               // ou .WithMany(c => c.Historiques) si tu ajoutes la navigation
                  .HasForeignKey(h => h.ControleId)
                  .OnDelete(DeleteBehavior.Cascade); // suppression cascade si le contrôle est supprimé
        });
    }
}