using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Profils.Queries.GetAllProfils
{
    public class GetAllProfilsHandler : IRequestHandler<GetAllProfilsQuery, List<Profil>>
    {
        private readonly AppDbContext _context;

        public GetAllProfilsHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Profil>> Handle(GetAllProfilsQuery request, CancellationToken cancellationToken)
        {
            return await _context.Profils
                .AsNoTracking()
                .OrderBy(p => p.Name)
                .ToListAsync(cancellationToken);
        }
    }
}
