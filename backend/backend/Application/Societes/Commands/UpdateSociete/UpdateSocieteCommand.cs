using MediatR;

namespace backend.Application.Societes.Commands.UpdateSociete
{
    public record UpdateSocieteCommand(
    int Id,
    string Nom,
    int? HoldingId,
    IFormFile? Logo
) : IRequest<(bool Success, string? Error)>;
}
