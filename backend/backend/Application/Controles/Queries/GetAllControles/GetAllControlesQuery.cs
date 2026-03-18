using backend.Application.DTOs.Controles;
using MediatR;

namespace backend.Application.Controles.Queries.GetAllControles
{
    public record GetAllControlesQuery() : IRequest<List<ControleDto>>;

}
