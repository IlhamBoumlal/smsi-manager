using backend.Domain.Interfaces;
using backend.Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record UpdateProcessusCommand(
    Guid Id,
    string Categorie,
    string Nom,
    string Responsable,
    string Description,
    int? SocieteId
) : IRequest;

public class UpdateProcessusCommandHandler : IRequestHandler<UpdateProcessusCommand>
{
    private readonly IProcessusRepository _repo;
    public UpdateProcessusCommandHandler(IProcessusRepository repo) => _repo = repo;

    public async Task Handle(UpdateProcessusCommand cmd, CancellationToken ct)
    {
        var p = await _repo.GetByIdAsync(cmd.Id, cmd.SocieteId, ct)
                ?? throw new KeyNotFoundException($"Processus {cmd.Id} introuvable.");
        p.Update(cmd.Categorie, cmd.Nom, cmd.Responsable, cmd.Description);
        await _repo.SaveChangesAsync(ct);
    }
}