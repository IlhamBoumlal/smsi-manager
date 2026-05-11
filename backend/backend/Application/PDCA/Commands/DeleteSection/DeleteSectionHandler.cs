using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Commands.DeleteSection;

public class DeleteSectionHandler : IRequestHandler<DeleteSectionCommand>
{
    private readonly IPdcaRepository _repo;
    public DeleteSectionHandler(IPdcaRepository repo) => _repo = repo;

    public async Task Handle(DeleteSectionCommand cmd, CancellationToken ct)
    {
        var section = await _repo.GetSectionByIdAsync(cmd.SectionId, cmd.SocieteId, ct)
            ?? throw new InvalidOperationException("Section introuvable.");
        _repo.RemoveSection(section);
        await _repo.SaveChangesAsync(ct);
    }
}
