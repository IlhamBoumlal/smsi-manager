using backend.Application.Dashboard.Queries.GetGlobalDashboard;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Dashboard;

public class GetGlobalDashboardHandlerTests
{
    [Fact]
    public async Task Handle_ShouldFilterData_ByCurrentSocieteId()
    {
        var userRepository = new Mock<IUserRepository>();
        var societeRepository = new Mock<ISocieteRepository>();
        var holdingRepository = new Mock<IHoldingRepository>();
        var actifRepository = new Mock<IActifRepository>();
        var controleRepository = new Mock<IControleRepository>();

        userRepository.Setup(r => r.GetAllWithSocieteAsync()).ReturnsAsync(
        [
            new ApplicationUser { Id = "u-1", NomComplet = "User 1", SocieteId = 1, CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new ApplicationUser { Id = "u-2", NomComplet = "User 2", SocieteId = 2, CreatedAt = DateTime.UtcNow }
        ]);

        societeRepository.Setup(r => r.GetAllAsync(It.IsAny<int?>())).ReturnsAsync(
        [
            new Societe { Id = 1, Nom = "S1" },
            new Societe { Id = 2, Nom = "S2" }
        ]);

        holdingRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(
        [
            new Holding
            {
                Id = 10,
                Nom = "H1",
                Societes = [ new Societe { Id = 1, Nom = "S1" } ]
            }
        ]);

        actifRepository.Setup(r => r.GetAllAsync(It.IsAny<int?>())).ReturnsAsync(
        [
            new Actif { Id = Guid.NewGuid(), Nom = "A1", SocieteId = 1 },
            new Actif { Id = Guid.NewGuid(), Nom = "A2", SocieteId = 2 }
        ]);

        controleRepository.Setup(r => r.GetAllAsync(It.IsAny<int?>(), It.IsAny<CancellationToken>())).ReturnsAsync(
        [
            new Controle { Code = "C1", Titre = "Controle 1", SocieteId = 1, Domaine = DomaineControle.Organisationnel, Statut = Statut.Conforme },
            new Controle { Code = "C2", Titre = "Controle 2", SocieteId = 1, Domaine = DomaineControle.Technologique, Statut = Statut.NCMajeure },
            new Controle { Code = "C3", Titre = "Controle 3", SocieteId = 2, Domaine = DomaineControle.Physique, Statut = Statut.Conforme }
        ]);

        var handler = new GetGlobalDashboardHandler(
            userRepository.Object,
            societeRepository.Object,
            holdingRepository.Object,
            actifRepository.Object,
            controleRepository.Object);

        var result = await handler.Handle(new GetGlobalDashboardQuery(CurrentSocieteId: 1), CancellationToken.None);

        result.TotalUsers.Should().Be(1);
        result.TotalSocietes.Should().Be(1);
        result.TotalHoldings.Should().Be(1);
        result.TotalActifs.Should().Be(1);
        result.TotalControles.Should().Be(2);
        result.TauxGlobalConformite.Should().Be(50);
    }
}
