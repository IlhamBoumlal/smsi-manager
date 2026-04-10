using backend.Application.DTOs.Controles;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Controles.Queries.GetHistoriqueControle
{
    public class GetHistoriqueControleQueryHandler
    : IRequestHandler<GetHistoriqueControleQuery, List<ControleHistoriqueDto>>
    {
        private readonly AppDbContext _context;

        public GetHistoriqueControleQueryHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ControleHistoriqueDto>> Handle(
            GetHistoriqueControleQuery request,
            CancellationToken cancellationToken)
        {
            return await _context.ControleHistoriques
                .AsNoTracking()
                .Where(h => h.ControleId == request.ControleId)
                .OrderByDescending(h => h.DateModification)
                .Select(h => new ControleHistoriqueDto
                {
                    Id = h.Id,
                    ControleId = h.ControleId,
                    DateModification = h.DateModification,
                    ModificateurId = h.ModificateurId,
                    ModificateurNom = h.ModificateurNom,
                    ChampsModifies = h.ChampsModifies,
                    AvantJson = h.AvantJson,
                    ApresJson = h.ApresJson,
                })
                .ToListAsync(cancellationToken);
        }
    }

}
