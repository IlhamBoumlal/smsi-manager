using System.Text.Json;
using backend.Application.Controles.Commands.UpdateControle;
using backend.Application.Controles.Queries.GetAllControles;
using backend.Application.Controles.Queries.GetControleById;
using backend.Application.Controles.Queries.GetHistoriqueControle;
using backend.Domain.Enumerations;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace backend.UnitTests.Handlers.Controles;

public class ControleHandlerTests
{
    [Fact]
    public async Task GetAllControles_ShouldCloneGlobalTemplatesForSociete()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        db.Controles.AddRange(
            ControleTestHelper.Controle("A.5.1", "Politique", null),
            ControleTestHelper.Controle("A.8.3", "Mots de passe", null));
        await db.SaveChangesAsync();
        var handler = new GetAllControlesQueryHandler(db);

        var result = await handler.Handle(new GetAllControlesQuery(ControleTestHelper.SocieteId), CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().OnlyContain(c => c.Id != Guid.Empty);
        (await db.Controles.CountAsync(c => c.SocieteId == ControleTestHelper.SocieteId)).Should().Be(2);
        (await db.Controles.CountAsync(c => c.SocieteId == null)).Should().Be(2);
    }

    [Fact]
    public async Task GetAllControles_ShouldReturnOnlyRequestedSocieteWhenAlreadyInitialized()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        db.Controles.AddRange(
            ControleTestHelper.Controle("A.5.1", "Societe courante", ControleTestHelper.SocieteId),
            ControleTestHelper.Controle("A.5.1", "Autre societe", ControleTestHelper.OtherSocieteId));
        await db.SaveChangesAsync();
        var handler = new GetAllControlesQueryHandler(db);

        var result = await handler.Handle(new GetAllControlesQuery(ControleTestHelper.SocieteId), CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Titre.Should().Be("Societe courante");
    }

    [Fact]
    public async Task GetControleById_ShouldResolveSocieteCloneFromGlobalId()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        var global = ControleTestHelper.Controle("A.5.1", "Template", null);
        var clone = ControleTestHelper.Controle("A.5.1", "Clone societe", ControleTestHelper.SocieteId);
        db.Controles.AddRange(global, clone);
        await db.SaveChangesAsync();
        var handler = new GetControleByIdHandler(db);

        var result = await handler.Handle(new GetControleByIdQuery(global.Id, ControleTestHelper.SocieteId), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Id.Should().Be(clone.Id);
        result.Titre.Should().Be("Clone societe");
    }

    [Fact]
    public async Task UpdateControle_ShouldRejectMissingSociete()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        var handler = new UpdateControleCommandHandler(db);

        var result = await handler.Handle(UpdateCommand(Guid.NewGuid()) with { SocieteId = null }, CancellationToken.None);

        result.Success.Should().BeFalse();
        result.Error.Should().Contain("Société");
    }

    [Fact]
    public async Task UpdateControle_ShouldUpdateConformeFieldsResetPlanAndCreateHistory()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        var controle = ControleTestHelper.Controle();
        controle.Statut = Statut.NCMajeure;
        controle.Steps = JsonSerializer.Serialize(new[] { new { title = "Ancienne action" } });
        controle.Priorite = "Haute";
        db.Controles.Add(controle);
        await db.SaveChangesAsync();
        var handler = new UpdateControleCommandHandler(db);

        var result = await handler.Handle(
            UpdateCommand(controle.Id) with
            {
                Statut = Statut.Conforme,
                JustificationConformite = "Conforme preuves OK",
                RaisonsApplicabilite = ["legale", "risque"]
            },
            CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Statut.Should().Be(Statut.Conforme);
        result.Data.JustificationConformite.Should().Be("Conforme preuves OK");
        result.Data.Priorite.Should().BeNull();
        result.Data.Steps.Should().BeNull();
        result.Data.RaisonsApplicabilite.Should().BeEquivalentTo("legale", "risque");

        var saved = await db.Controles.SingleAsync(c => c.Id == controle.Id);
        saved.DernierModificateurId.Should().Be(ControleTestHelper.UserId);
        saved.DernierModificateurNom.Should().Be(ControleTestHelper.UserName);
        (await db.ControleHistoriques.CountAsync(h => h.ControleId == controle.Id)).Should().Be(1);
    }

    [Fact]
    public async Task UpdateControle_ShouldSetNotApplicableAndClearApplicabilityReasons()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        var controle = ControleTestHelper.Controle();
        controle.RaisonsApplicabilite = JsonSerializer.Serialize(new[] { "legale" });
        db.Controles.Add(controle);
        await db.SaveChangesAsync();
        var handler = new UpdateControleCommandHandler(db);

        var result = await handler.Handle(
            UpdateCommand(controle.Id) with
            {
                Applicable = false,
                RaisonExclusion = "Hors perimetre"
            },
            CancellationToken.None);

        result.Success.Should().BeTrue();
        result.Data!.Applicable.Should().BeFalse();
        result.Data.Statut.Should().Be(Statut.NonEvalue);
        result.Data.RaisonExclusion.Should().Be("Hors perimetre");
        result.Data.RaisonsApplicabilite.Should().BeEmpty();
    }

    [Fact]
    public async Task GetHistoriqueControle_ShouldReturnHistoryOrderedDescending()
    {
        await using var db = ControleTestHelper.CreateDbContext();
        var controleId = Guid.NewGuid();
        db.ControleHistoriques.AddRange(
            new() { ControleId = controleId, DateModification = new DateTime(2026, 1, 1), ChampsModifies = "Ancien" },
            new() { ControleId = controleId, DateModification = new DateTime(2026, 2, 1), ChampsModifies = "Recent" });
        await db.SaveChangesAsync();
        var handler = new GetHistoriqueControleQueryHandler(db);

        var result = await handler.Handle(new GetHistoriqueControleQuery(controleId), CancellationToken.None);

        result.Should().HaveCount(2);
        result[0].ChampsModifies.Should().Be("Recent");
        result[1].ChampsModifies.Should().Be("Ancien");
    }

    private static UpdateControleCommand UpdateCommand(Guid id) => new(
        id,
        "Titre maj",
        "Description maj",
        DomaineControle.Organisationnel,
        true,
        Statut.Conforme,
        ["legale"],
        null,
        "Justification",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        ControleTestHelper.UserId,
        ControleTestHelper.UserName,
        ControleTestHelper.SocieteId);
}
