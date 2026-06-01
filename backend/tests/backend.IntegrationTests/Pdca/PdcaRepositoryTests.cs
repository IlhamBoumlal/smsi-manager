using backend.Domain.Entities;
using backend.Infrastructure.Data;
using backend.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.IntegrationTests.Pdca;

public class PdcaRepositoryTests
{
    [Fact]
    public async Task Repository_ShouldReturnOnlyCyclesForRequestedSociete()
    {
        await using var context = CreateContext();
        var cycleSociete1 = CreateCycle("Cycle societe 1", 1);
        var cycleSociete2 = CreateCycle("Cycle societe 2", 2);
        context.PdcaCycles.AddRange(cycleSociete1, cycleSociete2);
        await context.SaveChangesAsync();

        var repository = new PdcaRepository(context);

        var cycles = await repository.GetAllAsync(1);
        var missingWithoutSociete = await repository.GetAllAsync();

        var cycle = Assert.Single(cycles);
        Assert.Equal("Cycle societe 1", cycle.Name);
        Assert.Empty(missingWithoutSociete);
    }

    [Fact]
    public async Task Repository_ShouldLoadCycleWithPhasesSectionsAndItems()
    {
        await using var context = CreateContext();
        var cycle = CreateCycle("Cycle complet", 5);
        var plan = cycle.Phases.Single(p => p.Key == "plan");
        var section = new Section { Id = Guid.NewGuid(), PhaseId = plan.Id, Title = "Contexte" };
        section.Items.Add(new PdcaItem { Id = Guid.NewGuid(), Text = "Identifier les parties interessees", Status = "todo" });
        plan.Sections.Add(section);
        context.PdcaCycles.Add(cycle);
        await context.SaveChangesAsync();

        var repository = new PdcaRepository(context);

        var loaded = await repository.GetByIdAsync(cycle.Id, 5);

        Assert.NotNull(loaded);
        Assert.Equal(4, loaded!.Phases.Count);
        var loadedSection = Assert.Single(loaded.Phases.Single(p => p.Key == "plan").Sections);
        var loadedItem = Assert.Single(loadedSection.Items);
        Assert.Equal("Identifier les parties interessees", loadedItem.Text);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static PdcaCycle CreateCycle(string name, int societeId)
    {
        var cycle = new PdcaCycle
        {
            Id = Guid.NewGuid(),
            Name = name,
            SocieteId = societeId
        };

        cycle.Phases.Add(new Phase { Id = Guid.NewGuid(), CycleId = cycle.Id, Key = "plan", Label = "PLAN", Order = 0 });
        cycle.Phases.Add(new Phase { Id = Guid.NewGuid(), CycleId = cycle.Id, Key = "do", Label = "DO", Order = 1 });
        cycle.Phases.Add(new Phase { Id = Guid.NewGuid(), CycleId = cycle.Id, Key = "check", Label = "CHECK", Order = 2 });
        cycle.Phases.Add(new Phase { Id = Guid.NewGuid(), CycleId = cycle.Id, Key = "act", Label = "ACT", Order = 3 });

        return cycle;
    }
}
