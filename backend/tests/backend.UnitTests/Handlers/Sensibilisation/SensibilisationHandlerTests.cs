using backend.Application.Sensibilisation.Commands.CreateFormation;
using backend.Application.Sensibilisation.Commands.DeleteFormation;
using backend.Application.Sensibilisation.Commands.NotifyParticipants;
using backend.Application.Sensibilisation.Commands.UpdateFormation;
using backend.Application.Sensibilisation.Commands.UpdateParticipantStatus;
using backend.Application.Sensibilisation.Queries.GetDashboard;
using backend.Application.Sensibilisation.Queries.GetFormationDetail;
using backend.Application.Sensibilisation.Queries.GetFormations;
using backend.Domain.Entities;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using backend.UnitTests.Helpers;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Sensibilisation;

public class SensibilisationHandlerTests
{
    [Fact]
    public async Task CreateFormation_ShouldCreateFormationParticipantsAndSendInvitations()
    {
        Formation? created = null;
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.AddAsync(It.IsAny<Formation>(), It.IsAny<CancellationToken>()))
            .Callback<Formation, CancellationToken>((formation, _) => created = formation)
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var email = new Mock<IEmailServiceSens>();
        email.Setup(e => e.SendInvitationAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new CreateFormationCommandHandler(repo.Object, email.Object);
        var id = await handler.Handle(CreateCommand(notifInvit: true), CancellationToken.None);

        id.Should().NotBeEmpty();
        created.Should().NotBeNull();
        created!.SocieteId.Should().Be(SensibilisationTestHelper.SocieteId);
        created.Participants.Should().HaveCount(2);
        created.Notifications.Should().ContainSingle(n => n.Title == "Invitation envoyée" && n.RecipientCount == 2);
        email.Verify(e => e.SendInvitationAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            created.Title,
            created.DateDebut,
            created.Duree,
            created.Formateur,
            created.LmsLink,
            It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task UpdateFormation_ShouldReturnFalse_WhenFormationMissing()
    {
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Formation?)null);
        var handler = new UpdateFormationCommandHandler(repo.Object);

        var result = await handler.Handle(UpdateCommand(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeFalse();
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateFormation_ShouldUpdateFields()
    {
        var formation = SensibilisationTestHelper.CreateFormation();
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(formation.Id, SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(formation);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new UpdateFormationCommandHandler(repo.Object);

        var result = await handler.Handle(UpdateCommand(formation.Id), CancellationToken.None);

        result.Should().BeTrue();
        formation.Title.Should().Be("Formation mise a jour");
        formation.Mode.Should().Be(FormationMode.Distanciel);
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateParticipantStatus_ShouldMarkPresentAndMoveFormationInProgress()
    {
        var formation = SensibilisationTestHelper.CreateFormation();
        var participant = FormationParticipant.Create(formation.Id, formation.SocieteId, "Alice Martin", "alice@example.com", "IT");
        formation.Participants.Add(participant);
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(formation.Id, SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(formation);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new UpdateParticipantStatusCommandHandler(repo.Object);

        var result = await handler.Handle(
            new UpdateParticipantStatusCommand(formation.Id, participant.Id, "Présent", SensibilisationTestHelper.SocieteId),
            CancellationToken.None);

        result.Should().BeTrue();
        participant.Status.Should().Be(ParticipantStatus.Present);
        formation.Status.Should().Be(FormationStatus.EnCours);
    }

    [Fact]
    public async Task NotifyParticipants_ShouldSendRappelAndAppendHistory()
    {
        var formation = SensibilisationTestHelper.CreateFormation();
        formation.Participants.Add(FormationParticipant.Create(formation.Id, formation.SocieteId, "Alice Martin", "alice@example.com", "IT"));
        formation.Participants.Add(FormationParticipant.Create(formation.Id, formation.SocieteId, "Bob Karim", "bob@example.com", "Risk"));
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(formation.Id, SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(formation);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var email = new Mock<IEmailServiceSens>();
        email.Setup(e => e.SendRappelAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new NotifyParticipantsCommandHandler(repo.Object, email.Object);

        var result = await handler.Handle(
            new NotifyParticipantsCommand(formation.Id, "Rappel 48h avant", SensibilisationTestHelper.SocieteId),
            CancellationToken.None);

        result.Should().BeTrue();
        formation.Notifications.Should().ContainSingle(n => n.Title == "Rappel 48h avant" && n.RecipientCount == 2);
        email.Verify(e => e.SendRappelAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            formation.Title,
            formation.DateDebut,
            It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetDashboard_ShouldComputeCountersAndAveragePresenceRate()
    {
        var completed = SensibilisationTestHelper.CreateFormation("Terminee");
        var p1 = FormationParticipant.Create(completed.Id, completed.SocieteId, "Alice Martin", "alice@example.com", "IT");
        var p2 = FormationParticipant.Create(completed.Id, completed.SocieteId, "Bob Karim", "bob@example.com", "IT");
        p1.Status = ParticipantStatus.Present;
        completed.Participants.Add(p1);
        completed.Participants.Add(p2);
        completed.SetStatus(FormationStatus.Terminee);

        var inProgress = SensibilisationTestHelper.CreateFormation("En cours");
        inProgress.SetStatus(FormationStatus.EnCours);

        var planned = SensibilisationTestHelper.CreateFormation("Planifiee");

        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetAllAsync(SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { completed, inProgress, planned });
        var handler = new GetSensibilisationDashboardQueryHandler(repo.Object);

        var result = await handler.Handle(
            new GetSensibilisationDashboardQuery(SensibilisationTestHelper.SocieteId),
            CancellationToken.None);

        result.Total.Should().Be(3);
        result.Terminees.Should().Be(1);
        result.EnCours.Should().Be(1);
        result.Planifiees.Should().Be(1);
        result.TauxMoyen.Should().Be(50);
    }

    [Fact]
    public async Task GetFormations_ShouldMapListDtos()
    {
        var formation = SensibilisationTestHelper.CreateFormation();
        formation.Participants.Add(FormationParticipant.Create(formation.Id, formation.SocieteId, "Alice Martin", "alice@example.com", "IT"));
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetAllAsync(SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { formation });
        var handler = new GetFormationsQueryHandler(repo.Object);

        var result = await handler.Handle(new GetFormationsQuery(SensibilisationTestHelper.SocieteId), CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Title.Should().Be(formation.Title);
        result[0].Participants.Should().Be(1);
    }

    [Fact]
    public async Task GetFormationDetail_ShouldReturnNull_WhenFormationMissing()
    {
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Formation?)null);
        var handler = new GetFormationDetailQueryHandler(repo.Object);

        var result = await handler.Handle(new GetFormationDetailQuery(Guid.NewGuid(), SensibilisationTestHelper.SocieteId), CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteFormation_ShouldRemoveFormation_WhenFound()
    {
        var formation = SensibilisationTestHelper.CreateFormation();
        var repo = new Mock<IFormationRepository>();
        repo.Setup(r => r.GetByIdAsync(formation.Id, SensibilisationTestHelper.SocieteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(formation);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var handler = new DeleteFormationCommandHandler(repo.Object);

        var result = await handler.Handle(new DeleteFormationCommand(formation.Id, SensibilisationTestHelper.SocieteId), CancellationToken.None);

        result.Should().BeTrue();
        repo.Verify(r => r.Remove(formation), Times.Once);
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static CreateFormationCommand CreateCommand(bool notifInvit = false) => new(
        "Sensibilisation phishing",
        "Description",
        "Objectif",
        "Présentiel",
        "2026-06-01",
        "09:00",
        "2h",
        "RSSI",
        "Interne",
        "IT",
        "Collaborateur",
        null,
        notifInvit,
        false,
        new List<ParticipantInput>
        {
            new("Alice Martin", "alice@example.com", "IT"),
            new("Bob Karim", "bob@example.com", "Risk")
        },
        SensibilisationTestHelper.SocieteId);

    private static UpdateFormationCommand UpdateCommand(Guid id) => new(
        id,
        "Formation mise a jour",
        "Description maj",
        "Objectif maj",
        "Distanciel",
        "2026-06-02",
        "10:00",
        "3h",
        "RSSI",
        "Interne",
        "IT",
        "Collaborateur",
        null,
        SensibilisationTestHelper.SocieteId);
}
