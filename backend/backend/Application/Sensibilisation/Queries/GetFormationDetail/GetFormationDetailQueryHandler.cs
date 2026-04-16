// Application/Sensibilisation/Queries/GetFormationDetail/GetFormationDetailQueryHandler.cs
using MediatR;
using backend.Application.DTOs;
using backend.Infrastructure.Repositories;

namespace backend.Application.Sensibilisation.Queries.GetFormationDetail;

public class GetFormationDetailQueryHandler(IFormationRepository repo)
    : IRequestHandler<GetFormationDetailQuery, FormationDetailDto?>
{
    public async Task<FormationDetailDto?> Handle(
        GetFormationDetailQuery request, CancellationToken ct)
    {
        var f = await repo.GetByIdAsync(request.Id, ct);
        return f?.ToDetailDto();
    }
}