using backend.Domain.Enumerations;

namespace backend.Domain.Entities
{
    public class Actif
    {
        public Guid Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TypeActif Type { get; set; }
        public CategorieActif Categorie { get; set; }
        public ClassificationActif Classification { get; set; }
        //A changer après
        public Guid ProprietaireId { get; set; }

    }
}
