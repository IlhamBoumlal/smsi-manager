using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Commands.RenameSection;

public class RenameSectionHandler : IRequestHandler<RenameSectionCommand>
{
    private readonly IPdcaRepository _repo;
    public RenameSectionHandler(IPdcaRepository repo) => _repo = repo;

    public async Task Handle(RenameSectionCommand cmd, CancellationToken ct)
    {
        var section = await _repo.GetSectionByIdAsync(cmd.SectionId, ct)
            ?? throw new InvalidOperationException("Section introuvable.");
        section.Title     = cmd.NewTitle;
        section.UpdatedAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync(ct);
    }
}
