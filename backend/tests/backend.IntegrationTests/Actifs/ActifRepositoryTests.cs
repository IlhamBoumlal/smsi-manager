using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Actifs;

public class ActifRepositoryTests
{
    private const int SocieteId = 61;
    private const int OtherSocieteId = 62;

    [Fact]
    public async Task Repository_ShouldReturnOnlyActifsForRequestedSociete()
    {
        await using var context = CreateContext();
        context.Actifs.AddRange(
            Actif("Serveur courant", SocieteId),
            Actif("Serveur autre societe", OtherSocieteId),
            Actif("Sans societe", null));
        await context.SaveChangesAsync();
        var repository = new ActifRepository(context);

        var actifs = await repository.GetAllAsync(SocieteId);
        var missingWithoutSociete = await repository.GetAllAsync();

        var actif = Assert.Single(actifs);
        Assert.Equal("Serveur courant", actif.Nom);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task Repository_ShouldReturnActifByIdOnlyForRequestedSociete()
    {
        await using var context = CreateContext();
        var current = Actif("Courant", SocieteId);
        var other = Actif("Autre", OtherSocieteId);
        context.Actifs.AddRange(current, other);
        await context.SaveChangesAsync();
        var repository = new ActifRepository(context);

        var found = await repository.GetByIdAsync(current.Id, SocieteId);
        var forbidden = await repository.GetByIdAsync(other.Id, SocieteId);

        Assert.NotNull(found);
        Assert.Equal("Courant", found!.Nom);
        Assert.Null(forbidden);
    }

    [Fact]
    public async Task Repository_ShouldRequireSocieteWhenCreating()
    {
        await using var context = CreateContext();
        var repository = new ActifRepository(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() => repository.CreateAsync(Actif("Sans societe", null)));
    }

    [Fact]
    public async Task Repository_ShouldCreateActifForSociete()
    {
        await using var context = CreateContext();
        var repository = new ActifRepository(context);

        var created = await repository.CreateAsync(Actif("Nouveau serveur", SocieteId));

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(SocieteId, created.SocieteId);
        Assert.Equal(1, await context.Actifs.CountAsync());
    }

    [Fact]
    public async Task Repository_ShouldUpdateActifOnlyForRequestedSociete()
    {
        await using var context = CreateContext();
        var actif = Actif("Initial", SocieteId);
        context.Actifs.Add(actif);
        await context.SaveChangesAsync();
        var repository = new ActifRepository(context);

        var otherSocieteUpdate = Actif("Tentative autre societe", OtherSocieteId);
        otherSocieteUpdate.Id = actif.Id;
        var rejected = await repository.UpdateAsync(otherSocieteUpdate);
        var updated = await repository.UpdateAsync(new Actif
        {
            Id = actif.Id,
            Nom = "Mis a jour",
            Description = "Description maj",
            Type = TypeActif.Primaire,
            Categorie = CategorieActif.Application,
            Classification = ClassificationActif.Secret,
            ProprietaireNom = "Metier",
            SocieteId = SocieteId
        });

        Assert.Null(rejected);
        Assert.NotNull(updated);
        var saved = await context.Actifs.SingleAsync(a => a.Id == actif.Id);
        Assert.Equal("Mis a jour", saved.Nom);
        Assert.Equal(ClassificationActif.Secret, saved.Classification);
    }

    [Fact]
    public async Task Repository_ShouldDeleteActifOnlyForRequestedSociete()
    {
        await using var context = CreateContext();
        var actif = Actif("A supprimer", SocieteId);
        context.Actifs.Add(actif);
        await context.SaveChangesAsync();
        var repository = new ActifRepository(context);

        var rejected = await repository.DeleteAsync(actif.Id, OtherSocieteId);
        var deleted = await repository.DeleteAsync(actif.Id, SocieteId);

        Assert.False(rejected);
        Assert.True(deleted);
        Assert.Empty(context.Actifs);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Actif Actif(string nom, int? societeId) => new()
    {
        Id = Guid.NewGuid(),
        Nom = nom,
        Description = "Description",
        Type = TypeActif.Support,
        Categorie = CategorieActif.Infrastructure,
        Classification = ClassificationActif.Confidentiel,
        ProprietaireNom = "Equipe IT",
        SocieteId = societeId
    };
}
