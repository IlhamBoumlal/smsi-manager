using backend.Application.DTOs.ActifDTOs;
using MediatR;

namespace backend.Application.Actifs.Queries.GetAllActifs
{
    
    public record GetAllActifsQuery() : IRequest<IEnumerable<ActifResponseDto>>;
}
