using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Controles;

public class ControleRepositoryTests
{
    private const int SocieteId = 91;
    private const int OtherSocieteId = 92;

    [Fact]
    public async Task Repository_ShouldReturnOnlyControlesForRequestedSociete()
    {
        await using var context = CreateContext();
        context.Controles.AddRange(
            Controle("A.5.1", "Societe courante", SocieteId),
            Controle("A.5.1", "Autre societe", OtherSocieteId),
            Controle("A.5.1", "Global", null));
        await context.SaveChangesAsync();
        var repository = new ControleRepository(context);

        var controles = await repository.GetAllAsync(SocieteId);
        var missingWithoutSociete = await repository.GetAllAsync();

        var controle = Assert.Single(controles);
        Assert.Equal("Societe courante", controle.Titre);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task Repository_ShouldReturnControleByIdOnlyForRequestedSociete()
    {
        await using var context = CreateContext();
        var current = Controle("A.8.3", "Courant", SocieteId);
        var other = Controle("A.8.3", "Autre", OtherSocieteId);
        context.Controles.AddRange(current, other);
        await context.SaveChangesAsync();
        var repository = new ControleRepository(context);

        var found = await repository.GetByIdAsync(current.Id, SocieteId);
        var forbidden = await repository.GetByIdAsync(other.Id, SocieteId);

        Assert.NotNull(found);
        Assert.Equal("Courant", found!.Titre);
        Assert.Null(forbidden);
    }

    [Fact]
    public async Task Repository_ShouldUpdateControleFields()
    {
        await using var context = CreateContext();
        var controle = Controle("A.5.1", "Initial", SocieteId);
        context.Controles.Add(controle);
        await context.SaveChangesAsync();
        var repository = new ControleRepository(context);

        controle.Titre = "Mis a jour";
        controle.Statut = Statut.Conforme;
        controle.JustificationConformite = "OK";
        controle.DateMiseAJour = new DateTime(2026, 5, 23, 12, 0, 0, DateTimeKind.Utc);
        var updated = await repository.UpdateAsync(controle);

        Assert.NotNull(updated);
        var saved = await context.Controles.SingleAsync(c => c.Id == controle.Id);
        Assert.Equal("Mis a jour", saved.Titre);
        Assert.Equal(Statut.Conforme, saved.Statut);
        Assert.Equal("OK", saved.JustificationConformite);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static backend.Domain.Entities.Controle Controle(string code, string titre, int? societeId) => new()
    {
        Id = Guid.NewGuid(),
        Code = code,
        Titre = titre,
        Description = "Description",
        Domaine = DomaineControle.Organisationnel,
        SocieteId = societeId,
        Applicable = true,
        Statut = Statut.NonEvalue
    };
}
