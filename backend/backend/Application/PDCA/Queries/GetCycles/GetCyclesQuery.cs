using Application.DTOs;
using MediatR;
namespace Application.PDCA.Queries.GetCycles;
public record GetCyclesQuery : IRequest<List<CycleSummaryDto>>;
