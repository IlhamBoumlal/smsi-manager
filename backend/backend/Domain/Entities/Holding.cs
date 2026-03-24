namespace backend.Domain.Entities
{
    public class Holding
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public ICollection<Societe> Societes { get; set; } = new List<Societe>();
    }
}
