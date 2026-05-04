using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Commands.DeleteItem;

public class DeleteItemHandler : IRequestHandler<DeleteItemCommand>
{
    private readonly IPdcaRepository _repo;
    public DeleteItemHandler(IPdcaRepository repo) => _repo = repo;

    public async Task Handle(DeleteItemCommand cmd, CancellationToken ct)
    {
        var item = await _repo.GetItemByIdAsync(cmd.Id, cmd.SocieteId, ct)
            ?? throw new InvalidOperationException("Item introuvable.");
        _repo.RemoveItem(item);
        await _repo.SaveChangesAsync(ct);
    }
}
