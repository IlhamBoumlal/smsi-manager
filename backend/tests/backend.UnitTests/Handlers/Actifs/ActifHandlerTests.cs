using backend.Application.Actifs.Commands.CreateActif;
using backend.Application.Actifs.Commands.DeleteActif;
using backend.Application.Actifs.Commands.UpdateActif;
using backend.Application.Actifs.Queries.GetActifById;
using backend.Application.Actifs.Queries.GetAllActifs;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Actifs;

public class ActifHandlerTests
{
    [Fact]
    public async Task GetAllActifs_ShouldMapRepositoryResults()
    {
        var actifs = new[]
        {
            ActifTestHelper.Actif(nom: "Serveur applicatif"),
            ActifTestHelper.Actif(nom: "Application SMSI")
        };
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.GetAllAsync(ActifTestHelper.SocieteId)).ReturnsAsync(actifs);
        var handler = new GetAllActifsHandler(repository.Object);

        var result = (await handler.Handle(new GetAllActifsQuery(ActifTestHelper.SocieteId), CancellationToken.None)).ToList();

        result.Should().HaveCount(2);
        result.Select(a => a.Nom).Should().BeEquivalentTo("Serveur applicatif", "Application SMSI");
    }

    [Fact]
    public async Task GetActifById_ShouldReturnNull_WhenMissing()
    {
        var id = Guid.NewGuid();
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.GetByIdAsync(id, ActifTestHelper.SocieteId)).ReturnsAsync((Actif?)null);
        var handler = new GetActifByIdHandler(repository.Object);

        var result = await handler.Handle(new GetActifByIdQuery(id, ActifTestHelper.SocieteId), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetActifById_ShouldMapRepositoryResult()
    {
        var actif = ActifTestHelper.Actif();
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.GetByIdAsync(actif.Id, ActifTestHelper.SocieteId)).ReturnsAsync(actif);
        var handler = new GetActifByIdHandler(repository.Object);

        var result = await handler.Handle(new GetActifByIdQuery(actif.Id, ActifTestHelper.SocieteId), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Id.Should().Be(actif.Id);
        result.Nom.Should().Be(actif.Nom);
        result.ProprietaireNom.Should().Be(actif.ProprietaireNom);
    }

    [Fact]
    public async Task CreateActif_ShouldPassSocieteToRepositoryAndMapCreatedActif()
    {
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.CreateAsync(It.IsAny<Actif>()))
            .ReturnsAsync((Actif a) =>
            {
                a.Id = Guid.NewGuid();
                return a;
            });
        var handler = new CreateActifHandler(repository.Object);
        var command = new CreateActifCommand(
            "Poste RSSI",
            "Poste de travail",
            TypeActif.Support,
            CategorieActif.EquipementInformatique,
            ClassificationActif.Confidentiel,
            "RSSI",
            ActifTestHelper.SocieteId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Id.Should().NotBeEmpty();
        result.Nom.Should().Be(command.Nom);
        repository.Verify(r => r.CreateAsync(It.Is<Actif>(a =>
            a.Nom == command.Nom &&
            a.SocieteId == ActifTestHelper.SocieteId &&
            a.Classification == ClassificationActif.Confidentiel)), Times.Once);
    }

    [Fact]
    public async Task UpdateActif_ShouldReturnNull_WhenRepositoryRejectsUpdate()
    {
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.UpdateAsync(It.IsAny<Actif>())).ReturnsAsync((Actif?)null);
        var handler = new UpdateActifHandler(repository.Object);

        var result = await handler.Handle(UpdateCommand(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateActif_ShouldMapUpdatedActif()
    {
        var id = Guid.NewGuid();
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.UpdateAsync(It.IsAny<Actif>()))
            .ReturnsAsync((Actif a) => a);
        var handler = new UpdateActifHandler(repository.Object);

        var result = await handler.Handle(UpdateCommand(id), CancellationToken.None);

        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
        result.Nom.Should().Be("Application SMSI");
        result.Classification.Should().Be(ClassificationActif.Secret);
        repository.Verify(r => r.UpdateAsync(It.Is<Actif>(a =>
            a.Id == id &&
            a.SocieteId == ActifTestHelper.SocieteId)), Times.Once);
    }

    [Fact]
    public async Task DeleteActif_ShouldDelegateToRepositoryWithSociete()
    {
        var id = Guid.NewGuid();
        var repository = new Mock<IActifRepository>();
        repository.Setup(r => r.DeleteAsync(id, ActifTestHelper.SocieteId)).ReturnsAsync(true);
        var handler = new DeleteActifHandler(repository.Object);

        var result = await handler.Handle(new DeleteActifCommand(id, ActifTestHelper.SocieteId), CancellationToken.None);

        result.Should().BeTrue();
    }

    private static UpdateActifCommand UpdateCommand(Guid id) => new(
        id,
        "Application SMSI",
        "Application critique",
        TypeActif.Primaire,
        CategorieActif.Application,
        ClassificationActif.Secret,
        "Metier",
        ActifTestHelper.SocieteId);
}
