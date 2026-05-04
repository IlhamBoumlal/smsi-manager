namespace backend.Application.DTOs.Controles
{
    public class ControleHistoriqueDto
    {
        public Guid Id { get; init; }
        public Guid ControleId { get; init; }
        public DateTime DateModification { get; init; }
        public string? ModificateurId { get; init; }
        public string? ModificateurNom { get; init; }
        public string? ChampsModifies { get; init; }
        public string? AvantJson { get; init; }
        public string? ApresJson { get; init; }
    }
}
