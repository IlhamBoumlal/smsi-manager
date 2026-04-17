using backend.Domain.Interfaces;
using MediatR;
namespace Application.PDCA.Commands.UpdateItem;

public class UpdateItemHandler : IRequestHandler<UpdateItemCommand>
{
    private readonly IPdcaRepository _repo;
    public UpdateItemHandler(IPdcaRepository repo) => _repo = repo;

    public async Task Handle(UpdateItemCommand cmd, CancellationToken ct)
    {
        var item = await _repo.GetItemByIdAsync(cmd.Id, ct)
            ?? throw new InvalidOperationException("Item introuvable.");
        if (cmd.Status is not null) item.Status = cmd.Status;
        if (cmd.Text   is not null) item.Text   = cmd.Text;
        item.UpdatedAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync(ct);
    }
}
