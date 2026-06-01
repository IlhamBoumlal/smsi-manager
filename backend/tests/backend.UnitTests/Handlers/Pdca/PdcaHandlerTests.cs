using Application.PDCA.Commands.AddItem;
using Application.PDCA.Commands.AddSection;
using Application.PDCA.Commands.CreateCycle;
using Application.PDCA.Commands.DeleteItem;
using Application.PDCA.Commands.DeleteSection;
using Application.PDCA.Commands.RenameSection;
using Application.PDCA.Commands.UpdateItem;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace backend.UnitTests.Handlers.Pdca;

public class PdcaHandlerTests
{
    [Fact]
    public async Task CreateCycle_ShouldCreateFourOrderedPdcaPhases()
    {
        PdcaCycle? createdCycle = null;
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.Add(It.IsAny<PdcaCycle>()))
            .Callback<PdcaCycle>(cycle => createdCycle = cycle);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new CreateCycleHandler(repo.Object);
        var cycleId = await handler.Handle(new CreateCycleCommand("Cycle SMSI 2026", SocieteId: 42), CancellationToken.None);

        cycleId.Should().NotBeEmpty();
        createdCycle.Should().NotBeNull();
        createdCycle!.Name.Should().Be("Cycle SMSI 2026");
        createdCycle.SocieteId.Should().Be(42);
        createdCycle.Phases.Select(p => new { p.Key, p.Label, p.Order })
            .Should()
            .Equal(
                new { Key = "plan", Label = "PLAN", Order = 0 },
                new { Key = "do", Label = "DO", Order = 1 },
                new { Key = "check", Label = "CHECK", Order = 2 },
                new { Key = "act", Label = "ACT", Order = 3 });
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateCycle_ShouldRejectMissingSociete()
    {
        var handler = new CreateCycleHandler(Mock.Of<IPdcaRepository>());

        var act = () => handler.Handle(new CreateCycleCommand("Cycle sans societe"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Soci*t* introuvable*");
    }

    [Fact]
    public async Task AddSection_ShouldCreateSection_WhenPhaseExists()
    {
        var phaseId = Guid.NewGuid();
        Section? createdSection = null;
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetPhaseByIdAsync(phaseId, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Phase { Id = phaseId, Label = "PLAN", Key = "plan" });
        repo.Setup(r => r.AddSection(It.IsAny<Section>()))
            .Callback<Section>(section => createdSection = section);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new AddSectionHandler(repo.Object);
        var sectionId = await handler.Handle(new AddSectionCommand(phaseId, "Analyse du contexte", 7), CancellationToken.None);

        sectionId.Should().NotBeEmpty();
        createdSection.Should().BeEquivalentTo(new
        {
            Id = sectionId,
            PhaseId = phaseId,
            Title = "Analyse du contexte"
        });
    }

    [Fact]
    public async Task RenameSection_ShouldUpdateTitle()
    {
        var section = new Section { Id = Guid.NewGuid(), Title = "Ancien titre" };
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetSectionByIdAsync(section.Id, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(section);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new RenameSectionHandler(repo.Object);
        await handler.Handle(new RenameSectionCommand(section.Id, "Nouveau titre", 7), CancellationToken.None);

        section.Title.Should().Be("Nouveau titre");
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteSection_ShouldRemoveSection()
    {
        var section = new Section { Id = Guid.NewGuid(), Title = "A supprimer" };
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetSectionByIdAsync(section.Id, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(section);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new DeleteSectionHandler(repo.Object);
        await handler.Handle(new DeleteSectionCommand(section.Id, 7), CancellationToken.None);

        repo.Verify(r => r.RemoveSection(section), Times.Once);
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AddItem_ShouldCreateTodoItem_WhenSectionExists()
    {
        var sectionId = Guid.NewGuid();
        PdcaItem? createdItem = null;
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetSectionByIdAsync(sectionId, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section { Id = sectionId, Title = "Actions" });
        repo.Setup(r => r.AddItem(It.IsAny<PdcaItem>()))
            .Callback<PdcaItem>(item => createdItem = item);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new AddItemHandler(repo.Object);
        var itemId = await handler.Handle(new AddItemCommand(sectionId, "Definir les objectifs", 7), CancellationToken.None);

        itemId.Should().NotBeEmpty();
        createdItem.Should().BeEquivalentTo(new
        {
            Id = itemId,
            SectionId = sectionId,
            Text = "Definir les objectifs",
            Status = "todo"
        });
    }

    [Fact]
    public async Task UpdateItem_ShouldUpdateProvidedFieldsOnly()
    {
        var item = new PdcaItem { Id = Guid.NewGuid(), Text = "Action initiale", Status = "todo" };
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetItemByIdAsync(item.Id, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(item);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new UpdateItemHandler(repo.Object);
        await handler.Handle(new UpdateItemCommand(item.Id, Status: "done", SocieteId: 7), CancellationToken.None);

        item.Status.Should().Be("done");
        item.Text.Should().Be("Action initiale");
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteItem_ShouldRemoveItem()
    {
        var item = new PdcaItem { Id = Guid.NewGuid(), Text = "A supprimer" };
        var repo = new Mock<IPdcaRepository>();
        repo.Setup(r => r.GetItemByIdAsync(item.Id, 7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(item);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = new DeleteItemHandler(repo.Object);
        await handler.Handle(new DeleteItemCommand(item.Id, 7), CancellationToken.None);

        repo.Verify(r => r.RemoveItem(item), Times.Once);
        repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
