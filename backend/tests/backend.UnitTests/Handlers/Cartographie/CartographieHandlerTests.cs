using Application.Cartographie.Commands;
using Application.Cartographie.Queries;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace backend.UnitTests.Handlers.Cartographie;

public class CartographieHandlerTests
{
    [Fact]
    public async Task CreateProcessus_ShouldCreateProcessusAndSyncIsoReferences()
    {
        await using var db = CartographieTestHelper.CreateDbContext();
        db.IsoClauses.Add(new IsoClause { Id = 41, Number = "4.1", Title = "Contexte" });
        var controle = Controle("A.5.1", "Politiques de securite");
        db.Controles.Add(controle);
        await db.SaveChangesAsync();
        var repo = new ProcessusRepository(db);
        var handler = new CreateProcessusCommandHandler(
            repo,
            db,
            Mock.Of<ILogger<CreateProcessusCommandHandler>>());

        var result = await handler.Handle(
            new CreateProcessusCommand(
                "mgmt",
                "Gouvernance SMSI",
                "RSSI",
                "Piloter le SMSI",
                ["4.1 - Contexte", "A.5.1 - Politiques de securite"],
                CartographieTestHelper.SocieteId),
            CancellationToken.None);

        result.Nom.Should().Be("Gouvernance SMSI");
        result.IsoReferences.Should().Contain("4.1 - Contexte");
        result.IsoReferences.Should().Contain("A.5.1 - Politiques de securite");
        (await db.Processus.SingleAsync()).SocieteId.Should().Be(CartographieTestHelper.SocieteId);
        (await db.ProcessusClauses.SingleAsync()).SocieteId.Should().Be(CartographieTestHelper.SocieteId);
        (await db.ProcessusControles.SingleAsync()).ControleId.Should().Be(controle.Id);
    }

    [Fact]
    public async Task GetAllProcessus_ShouldMapDocumentsAndIsoReferences()
    {
        await using var db = CartographieTestHelper.CreateDbContext();
        var clause = new IsoClause { Id = 41, Number = "4.1", Title = "Contexte" };
        var controle = Controle("A.8.3", "Gestion des mots de passe");
        var processus = CartographieTestHelper.CreateProcessus();
        var doc = processus.AddDocument("Procedure", "procedure", "REF-1", "valide", "procedure.pdf", "application/pdf", [1, 2, 3]);
        db.IsoClauses.Add(clause);
        db.Controles.Add(controle);
        db.Processus.Add(processus);
        db.ProcessusClauses.Add(new ProcessusClause { ProcessusId = processus.Id, ClauseId = clause.Id, SocieteId = CartographieTestHelper.SocieteId });
        db.ProcessusControles.Add(new ProcessusControle { ProcessusId = processus.Id, ControleId = controle.Id, SocieteId = CartographieTestHelper.SocieteId });
        await db.SaveChangesAsync();
        var handler = new GetAllProcessusQueryHandler(new ProcessusRepository(db));

        var result = await handler.Handle(new GetAllProcessusQuery(CartographieTestHelper.SocieteId), CancellationToken.None);

        result.Should().ContainSingle();
        result[0].IsoReferences.Should().Contain("4.1 - Contexte");
        result[0].IsoReferences.Should().Contain("A.8.3 - Gestion des mots de passe");
        result[0].Documents.Should().ContainSingle(d => d.Id == doc.Id && d.AFichier);
    }

    [Fact]
    public async Task UpdateProcessus_ShouldUpdateFieldsSyncReferencesAndNotifyDocumentation()
    {
        await using var db = CartographieTestHelper.CreateDbContext();
        var clause = new IsoClause { Id = 61, Number = "6.1", Title = "Actions face aux risques" };
        var processus = CartographieTestHelper.CreateProcessus("Ancien nom");
        db.IsoClauses.Add(clause);
        db.Processus.Add(processus);
        await db.SaveChangesAsync();
        var sync = new Mock<ICartographieDocumentationSyncService>();
        sync.Setup(s => s.SyncOnProcessusRenamedAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new UpdateProcessusCommandHandler(new ProcessusRepository(db), db, sync.Object);

        await handler.Handle(
            new UpdateProcessusCommand(
                processus.Id,
                "real",
                "Nouveau nom",
                "DPO",
                "Nouvelle description",
                ["6.1 - Actions face aux risques"],
                CartographieTestHelper.SocieteId,
                CartographieTestHelper.UserId),
            CancellationToken.None);

        var updated = await db.Processus.SingleAsync(p => p.Id == processus.Id);
        updated.Nom.Should().Be("Nouveau nom");
        updated.Responsable.Should().Be("DPO");
        (await db.ProcessusClauses.SingleAsync()).ClauseId.Should().Be(61);
        sync.Verify(s => s.SyncOnProcessusRenamedAsync(
            "Ancien nom",
            "Nouveau nom",
            CartographieTestHelper.SocieteId,
            CartographieTestHelper.UserId,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AddDocument_ShouldAddDocumentAndNotifyDocumentationSync()
    {
        var processus = CartographieTestHelper.CreateProcessus();
        var repo = new Mock<IProcessusRepository>();
        repo.Setup(r => r.GetByIdAsync(processus.Id, CartographieTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(processus);
        repo.Setup(r => r.AddDocumentAsync(It.IsAny<Document>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var sync = new Mock<ICartographieDocumentationSyncService>();
        sync.Setup(s => s.SyncOnDocumentAddedAsync(
                processus,
                It.IsAny<Document>(),
                CartographieTestHelper.UserId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new AddDocumentCommandHandler(repo.Object, sync.Object);

        var result = await handler.Handle(
            new AddDocumentCommand(
                processus.Id,
                "Procedure",
                "procedure",
                "REF-1",
                "valide",
                "procedure.pdf",
                "application/pdf",
                [1, 2, 3],
                CartographieTestHelper.SocieteId,
                CartographieTestHelper.UserId),
            CancellationToken.None);

        result.Nom.Should().Be("Procedure");
        result.AFichier.Should().BeTrue();
        repo.Verify(r => r.AddDocumentAsync(It.Is<Document>(d => d.Nom == "Procedure"), It.IsAny<CancellationToken>()), Times.Once);
        sync.Verify(s => s.SyncOnDocumentAddedAsync(
            processus,
            It.Is<Document>(d => d.Id == result.Id),
            CartographieTestHelper.UserId,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteDocument_ShouldRemoveDocumentAndNotifyDocumentationSync()
    {
        var processus = CartographieTestHelper.CreateProcessus();
        var doc = processus.AddDocument("Procedure", "procedure", "REF-1", "valide");
        var repo = new Mock<IProcessusRepository>();
        repo.Setup(r => r.GetByIdAsync(processus.Id, CartographieTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(processus);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var sync = new Mock<ICartographieDocumentationSyncService>();
        sync.Setup(s => s.SyncOnDocumentRemovedAsync(
                processus,
                doc,
                CartographieTestHelper.UserId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new DeleteDocumentCommandHandler(repo.Object, sync.Object);

        await handler.Handle(
            new DeleteDocumentCommand(processus.Id, doc.Id, CartographieTestHelper.SocieteId, CartographieTestHelper.UserId),
            CancellationToken.None);

        processus.Documents.Should().BeEmpty();
        sync.Verify(s => s.SyncOnDocumentRemovedAsync(processus, doc, CartographieTestHelper.UserId, It.IsAny<CancellationToken>()), Times.Once);
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AddClause_ShouldRejectDuplicateAssociation()
    {
        await using var db = CartographieTestHelper.CreateDbContext();
        var processus = CartographieTestHelper.CreateProcessus();
        var clause = new IsoClause { Id = 41, Number = "4.1", Title = "Contexte" };
        db.Processus.Add(processus);
        db.IsoClauses.Add(clause);
        db.ProcessusClauses.Add(new ProcessusClause { ProcessusId = processus.Id, ClauseId = clause.Id, SocieteId = CartographieTestHelper.SocieteId });
        await db.SaveChangesAsync();
        var handler = new AddClauseToProcessusCommandHandler(db);

        var act = () => handler.Handle(
            new AddClauseToProcessusCommand(processus.Id, clause.Id, CartographieTestHelper.SocieteId),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*existe*");
    }

    [Fact]
    public async Task AddControle_ShouldCreateAssociation()
    {
        await using var db = CartographieTestHelper.CreateDbContext();
        var processus = CartographieTestHelper.CreateProcessus();
        var controle = Controle("A.5.1", "Politiques de securite");
        db.Processus.Add(processus);
        db.Controles.Add(controle);
        await db.SaveChangesAsync();
        var handler = new AddControleToProcessusCommandHandler(db);

        await handler.Handle(
            new AddControleToProcessusCommand(processus.Id, controle.Id, CartographieTestHelper.SocieteId, "Applicable"),
            CancellationToken.None);

        var association = await db.ProcessusControles.SingleAsync();
        association.ControleId.Should().Be(controle.Id);
        association.Justification.Should().Be("Applicable");
        association.SocieteId.Should().Be(CartographieTestHelper.SocieteId);
    }

    private static Controle Controle(string code, string titre) => new()
    {
        Id = Guid.NewGuid(),
        Code = code,
        Titre = titre,
        Domaine = DomaineControle.Organisationnel,
        SocieteId = CartographieTestHelper.SocieteId
    };
}
