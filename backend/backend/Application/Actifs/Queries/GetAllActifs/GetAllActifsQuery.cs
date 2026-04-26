using backend.Application.DTOs.ActifDTOs;
using MediatR;

namespace backend.Application.Actifs.Queries.GetAllActifs
{
    
    public record GetAllActifsQuery(int? SocieteId) : IRequest<IEnumerable<ActifResponseDto>>;
}
