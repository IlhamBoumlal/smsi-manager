namespace backend.Models
{
    public class Societe
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public int? HoldingId { get; set; }
        public Holding? Holding { get; set; }
    }
}