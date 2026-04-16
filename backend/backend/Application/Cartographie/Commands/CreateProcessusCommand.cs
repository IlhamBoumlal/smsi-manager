using Application.DTOs.Cartographie;
using backend.Domain.Entities;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Repositories;
using MediatR;

namespace Application.Cartographie.Commands;

public record CreateProcessusCommand(
    string Categorie,
    string Nom,
    string Responsable,
    string Description
) : IRequest<ProcessusDto>;

public class CreateProcessusCommandHandler : IRequestHandler<CreateProcessusCommand, ProcessusDto>
{
    private readonly IProcessusRepository _repo;
    public CreateProcessusCommandHandler(IProcessusRepository repo) => _repo = repo;

    public async Task<ProcessusDto> Handle(CreateProcessusCommand cmd, CancellationToken ct)
    {
        var p = Processus.Create(cmd.Categorie, cmd.Nom, cmd.Responsable, cmd.Description);
        await _repo.AddAsync(p, ct);
        await _repo.SaveChangesAsync(ct);
        return new ProcessusDto(p.Id, p.Categorie, p.Nom, p.Responsable, p.Description, new());
    }
}