using backend.Application.DTOs.Controles;
using MediatR;

namespace backend.Application.Controles.Queries.GetControleById
{
    public record GetControleByIdQuery(Guid Id) : IRequest<ControleDto?>;

}
