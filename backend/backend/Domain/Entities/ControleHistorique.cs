using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace backend.Domain.Entities
{
    public class ControleHistorique
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ControleId { get; set; }
        public int? SocieteId { get; set; }

        [ForeignKey(nameof(ControleId))]
        public Controle Controle { get; set; } = null!;
        public Societe? Societe { get; set; }

        public DateTime DateModification { get; set; } = DateTime.UtcNow;
        public string? ModificateurId { get; set; }
        public string? ModificateurNom { get; set; }

        // Snapshot de l'état AVANT modification (JSON complet)
        public string? AvantJson { get; set; }

        // Snapshot de l'état APRÈS modification (JSON complet)
        public string? ApresJson { get; set; }

        // Résumé lisible des champs modifiés
        public string? ChampsModifies { get; set; }
    }
}
