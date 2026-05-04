using backend.Application.DTOs.ActifDTOs;
using MediatR;

namespace backend.Application.Actifs.Queries.GetActifById
{
    public record GetActifByIdQuery(Guid Id, int? SocieteId) : IRequest<ActifResponseDto?>;
}
