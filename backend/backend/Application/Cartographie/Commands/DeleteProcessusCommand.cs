using Domain.Interfaces;
using Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record DeleteProcessusCommand(Guid Id) : IRequest;

public class DeleteProcessusCommandHandler : IRequestHandler<DeleteProcessusCommand>
{
    private readonly IProcessusRepository _repo;
    public DeleteProcessusCommandHandler(IProcessusRepository repo) => _repo = repo;

    public async Task Handle(DeleteProcessusCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.Id, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.Id} introuvable.");
        _repo.Remove(p);
        await _repo.SaveChangesAsync(ct);
    }
}