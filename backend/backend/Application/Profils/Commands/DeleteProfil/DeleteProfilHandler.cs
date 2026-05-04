using backend.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Application.Profils.Commands.DeleteProfil
{
    public class DeleteProfilHandler : IRequestHandler<DeleteProfilCommand, bool>
    {
        private readonly AppDbContext _context;

        public DeleteProfilHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteProfilCommand request, CancellationToken cancellationToken)
        {
            var profil = await _context.Profils
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

            if (profil is null) return false;

            _context.Profils.Remove(profil);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
