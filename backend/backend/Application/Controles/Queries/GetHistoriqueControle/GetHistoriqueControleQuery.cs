using backend.Application.DTOs.Controles;
using MediatR;

namespace backend.Application.Controles.Queries.GetHistoriqueControle
{
    public record GetHistoriqueControleQuery(Guid ControleId)
    : IRequest<List<ControleHistoriqueDto>>;
}
