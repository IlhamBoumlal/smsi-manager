using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace Application.PDCA.Commands.AddSection;

public class AddSectionHandler : IRequestHandler<AddSectionCommand, Guid>
{
    private readonly IPdcaRepository _repo;

    public AddSectionHandler(IPdcaRepository repo) => _repo = repo;

    public async Task<Guid> Handle(AddSectionCommand cmd, CancellationToken ct)
    {
        // Vérifier que la phase existe directement
        var phase = await _repo.GetPhaseByIdAsync(cmd.PhaseId, ct);
        if (phase == null)
        {
            throw new InvalidOperationException($"Phase introuvable avec l'ID: {cmd.PhaseId}");
        }

        var section = new Section
        {
            Id = Guid.NewGuid(),
            PhaseId = cmd.PhaseId,
            Title = cmd.Title,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repo.AddSection(section);

        var success = await _repo.SaveChangesAsync(ct);
        if (!success)
        {
            throw new InvalidOperationException("Échec de la sauvegarde de la section");
        }

        return section.Id;
    }
}