using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Profils.Commands.UpdateProfil
{
    public class UpdateProfilHandler : IRequestHandler<UpdateProfilCommand, bool>
    {
        private readonly AppDbContext _context;

        public UpdateProfilHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(UpdateProfilCommand request, CancellationToken cancellationToken)
        {
            var profil = await _context.Profils
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (profil is null) return false;

            profil.Name = request.Name.Trim();

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
