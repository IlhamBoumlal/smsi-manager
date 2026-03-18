using backend.Application.DTOs.Controles;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Controles.Queries.GetControleById
{
    public class GetControleByIdHandler : IRequestHandler<GetControleByIdQuery, ControleDto?>
    {
        private readonly IControleRepository _repo;
        public GetControleByIdHandler(IControleRepository repo) => _repo = repo;

        public async Task<ControleDto?> Handle(GetControleByIdQuery request, CancellationToken ct)
        {
            var c = await _repo.GetByIdAsync(request.Id);
            if (c is null) return null;
            return new ControleDto(
                c.Id, c.Code, c.Titre, c.Description, c.Domaine,
                c.Applicable, c.JustificationApplicabilite, c.Statut,
                c.Preuves, c.Responsable, c.ReferenceDocument,
                c.DateMiseAJour
            );
        }
    }
}
