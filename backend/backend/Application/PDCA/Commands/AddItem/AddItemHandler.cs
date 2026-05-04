using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace Application.PDCA.Commands.AddItem;

public class AddItemHandler : IRequestHandler<AddItemCommand, Guid>
{
    private readonly IPdcaRepository _repo;

    public AddItemHandler(IPdcaRepository repo) => _repo = repo;

    public async Task<Guid> Handle(AddItemCommand cmd, CancellationToken ct)
    {
        // Vérifier que la section existe
        var section = await _repo.GetSectionByIdAsync(cmd.SectionId, cmd.SocieteId, ct);
        if (section == null)
        {
            throw new InvalidOperationException($"Section introuvable avec l'ID: {cmd.SectionId}");
        }

        var item = new PdcaItem
        {
            Id = Guid.NewGuid(),
            SectionId = cmd.SectionId,
            Text = cmd.Text,
            Status = "todo",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _repo.AddItem(item);

        var success = await _repo.SaveChangesAsync(ct);
        if (!success)
        {
            throw new InvalidOperationException("Échec de la sauvegarde de l'item");
        }

        return item.Id;
    }
}