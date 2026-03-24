using backend.Application.DTOs.Controles;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Controles.Queries.GetAllControles
{
    public class GetAllControlesHandler : IRequestHandler<GetAllControlesQuery, List<ControleDto>>
    {
        private readonly IControleRepository _repo;
        public GetAllControlesHandler(IControleRepository repo) => _repo = repo;

        public async Task<List<ControleDto>> Handle(GetAllControlesQuery request, CancellationToken ct)
        {
            var controles = await _repo.GetAllAsync();
            return controles.Select(ToDto).ToList();
        }

        private static ControleDto ToDto(Domain.Entities.Controle c) => new(
            c.Id, c.Code, c.Titre, c.Description, c.Domaine,
            c.Applicable, c.JustificationApplicabilite, c.Statut,
            c.Preuves, c.Responsable, c.ReferenceDocument,
             c.DateMiseAJour
        );
    }
}
