using MediatR;

namespace backend.Application.Societes.Commands.CreateSociete
{
    public record CreateSocieteCommand(
    string Nom,
    int? HoldingId,
    IFormFile? Logo
) : IRequest<(bool Success, string? Error)>;
}
