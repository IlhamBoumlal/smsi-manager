using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Profils.Queries.GetProfilById
{
    public class GetProfilByIdHandler : IRequestHandler<GetProfilByIdQuery, Profil?>
    {
        private readonly AppDbContext _context;

        public GetProfilByIdHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Profil?> Handle(GetProfilByIdQuery request, CancellationToken cancellationToken)
        {
            return await _context.Profils
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        }
    }
}
