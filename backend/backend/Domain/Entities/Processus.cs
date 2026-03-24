namespace Domain.Entities;

public class Processus
{
    public Guid Id { get; private set; }
    public string Categorie { get; private set; }   // "mgmt" | "real" | "supp"
    public string Nom { get; private set; }
    public string Responsable { get; private set; }
    public string Description { get; private set; }
    public IReadOnlyCollection<Document> Documents => _documents.AsReadOnly();

    private readonly List<Document> _documents = new();

    private Processus() { }  // EF Core

    public static Processus Create(string categorie, string nom, string responsable, string description)
    {
        return new Processus
        {
            Id = Guid.NewGuid(),
            Categorie = categorie,
            Nom = nom,
            Responsable = responsable,
            Description = description,
        };
    }

    public void Update(string categorie, string nom, string responsable, string description)
    {
        Categorie = categorie;
        Nom = nom;
        Responsable = responsable;
        Description = description;
    }

    public Document AddDocument(string nom, string type, string reference, string statut,
                              string? fichierNom = null,
                              string? fichierType = null,
                              byte[]? fichierData = null)
    {
        var doc = Document.Create(Id, nom, type, reference, statut,
                                  fichierNom, fichierType, fichierData);
        _documents.Add(doc);
        return doc;
    }

    public void RemoveDocument(Guid documentId)
    {
        var doc = _documents.FirstOrDefault(d => d.Id == documentId)
                  ?? throw new KeyNotFoundException($"Document {documentId} introuvable.");
        _documents.Remove(doc);
    }
}