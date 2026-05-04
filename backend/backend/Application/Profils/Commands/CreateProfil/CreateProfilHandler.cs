using backend.Domain.Entities;
using backend.Infrastructure.Data;
using MediatR;

namespace backend.Application.Profils.Commands.CreateProfil
{
    public class CreateProfilHandler : IRequestHandler<CreateProfilCommand, Guid>
    {
        private readonly AppDbContext _context;

        public CreateProfilHandler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateProfilCommand request, CancellationToken cancellationToken)
        {
            var profil = new Profil
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim()
            };

            _context.Profils.Add(profil);
            await _context.SaveChangesAsync(cancellationToken);

            return profil.Id;
        }
    }
}
