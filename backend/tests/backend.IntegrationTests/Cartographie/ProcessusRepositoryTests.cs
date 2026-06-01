using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.IntegrationTests.Cartographie;

public class ProcessusRepositoryTests
{
    private const int SocieteId = 77;
    private const int OtherSocieteId = 88;

    [Fact]
    public async Task Repository_ShouldReturnOnlyProcessusForRequestedSociete()
    {
        await using var context = CreateContext();
        context.Processus.AddRange(
            CreateProcessus("Processus societe 77", SocieteId),
            CreateProcessus("Processus societe 88", OtherSocieteId));
        await context.SaveChangesAsync();
        var repository = new ProcessusRepository(context);

        var processus = await repository.GetAllAsync(SocieteId);
        var missingWithoutSociete = await repository.GetAllAsync();

        var current = Assert.Single(processus);
        Assert.Equal("Processus societe 77", current.Nom);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task Repository_ShouldLoadProcessusWithDocumentsClausesAndControles()
    {
        await using var context = CreateContext();
        var processus = CreateProcessus("Processus complet", SocieteId);
        var document = processus.AddDocument("Procedure", "procedure", "REF-1", "valide", "procedure.pdf", "application/pdf", [1, 2, 3]);
        var clause = new IsoClause { Id = 41, Number = "4.1", Title = "Contexte" };
        var controle = Controle("A.5.1", "Politiques de securite");
        context.Processus.Add(processus);
        context.IsoClauses.Add(clause);
        context.Controles.Add(controle);
        context.ProcessusClauses.Add(new ProcessusClause { ProcessusId = processus.Id, ClauseId = clause.Id, SocieteId = SocieteId });
        context.ProcessusControles.Add(new ProcessusControle { ProcessusId = processus.Id, ControleId = controle.Id, SocieteId = SocieteId });
        await context.SaveChangesAsync();
        var repository = new ProcessusRepository(context);

        var loaded = await repository.GetByIdAsync(processus.Id, SocieteId);

        Assert.NotNull(loaded);
        Assert.Single(loaded!.Documents);
        Assert.Equal(document.Id, loaded.Documents.Single().Id);
        Assert.Single(loaded.ProcessusClauses);
        Assert.Equal("4.1", loaded.ProcessusClauses.Single().Clause!.Number);
        Assert.Single(loaded.ProcessusControles);
        Assert.Equal("A.5.1", loaded.ProcessusControles.Single().Controle!.Code);
    }

    [Fact]
    public async Task Repository_ShouldAddDocument()
    {
        await using var context = CreateContext();
        var processus = CreateProcessus("Processus document", SocieteId);
        context.Processus.Add(processus);
        await context.SaveChangesAsync();
        var repository = new ProcessusRepository(context);
        var document = Document.Create(processus.Id, "Politique", "politique", "REF-2", "brouillon", societeId: SocieteId);

        await repository.AddDocumentAsync(document);
        await repository.SaveChangesAsync();

        var saved = await context.Documents.SingleAsync();
        Assert.Equal("Politique", saved.Nom);
        Assert.Equal(SocieteId, saved.SocieteId);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static Processus CreateProcessus(string nom, int societeId)
        => Processus.Create("mgmt", nom, "RSSI", "Description", societeId);

    private static Controle Controle(string code, string titre) => new()
    {
        Id = Guid.NewGuid(),
        Code = code,
        Titre = titre,
        Domaine = DomaineControle.Organisationnel,
        SocieteId = SocieteId
    };
}
