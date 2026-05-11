namespace backend.Domain.Entities
{
    //Sera géré par l'admin
    public class Profil
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public String Name { get; set; } = string.Empty;
    }
}
