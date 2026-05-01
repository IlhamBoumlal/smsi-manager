using Application.DTOs;
using MediatR;
namespace Application.PDCA.Queries.GetCycles;
public record GetCyclesQuery(int? SocieteId = null) : IRequest<List<CycleSummaryDto>>;
