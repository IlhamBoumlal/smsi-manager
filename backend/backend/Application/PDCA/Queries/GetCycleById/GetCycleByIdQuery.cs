using Application.DTOs;
using MediatR;
namespace Application.PDCA.Queries.GetCycleById;
public record GetCycleByIdQuery(Guid Id, int? SocieteId = null) : IRequest<CycleDetailDto?>;
