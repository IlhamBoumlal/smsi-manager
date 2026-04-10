using Application.DTOs;
using MediatR;
namespace Application.PDCA.Queries.GetCycleById;
public record GetCycleByIdQuery(Guid Id) : IRequest<CycleDetailDto?>;
