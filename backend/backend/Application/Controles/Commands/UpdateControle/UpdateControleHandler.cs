using backend.Application.DTOs.Controles;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Controles.Commands.UpdateControle
{
    public class UpdateControleHandler
    : IRequestHandler<UpdateControleCommand, (bool, string?, ControleDto?)>
    {
        private readonly IControleRepository _repo;
        public UpdateControleHandler(IControleRepository repo) => _repo = repo;

        public async Task<(bool, string?, ControleDto?)> Handle(
            UpdateControleCommand req, CancellationToken ct)
        {
            var updated = await _repo.UpdateAsync(new Controle
            {
                Id = req.Id,
                Titre = req.Titre,
                Description = req.Description,
                Domaine = req.Domaine,
                Applicable = req.Applicable,
                JustificationApplicabilite = req.JustificationApplicabilite,
                Statut = req.Statut,
                Preuves = req.Preuves,
                Responsable = req.Responsable,
                ReferenceDocument = req.ReferenceDocument
                
            });

            if (updated is null) return (false, "Contrôle introuvable.", null);

            var dto = new ControleDto(
                updated.Id, updated.Code, updated.Titre, updated.Description,
                updated.Domaine, updated.Applicable, updated.JustificationApplicabilite,
                updated.Statut, updated.Preuves, updated.Responsable,
                updated.ReferenceDocument, updated.DateMiseAJour
            );
            return (true, null, dto);
        }
    }
}
