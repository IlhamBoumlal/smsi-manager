namespace backend.Domain.Entities
{
    public class Action
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // view, create, edit, delete, manage, export
        public string Name { get; set; } = string.Empty; // Lecture, Écriture, Modification, etc.
    }
}
