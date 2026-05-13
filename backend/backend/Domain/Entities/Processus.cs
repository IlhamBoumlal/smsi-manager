namespace backend.Domain.Entities;

public class Processus
{
    public Guid Id { get; private set; }
    public string Categorie { get; private set; } = string.Empty;   // "mgmt" | "real" | "supp"
    public string Nom { get; private set; } = string.Empty;
    public string Responsable { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int? SocieteId { get; private set; }
    public Societe? Societe { get; private set; }
    public IReadOnlyCollection<Document> Documents => _documents.AsReadOnly();
    public IReadOnlyCollection<ProcessusClause> ProcessusClauses => _processusClauses.AsReadOnly();
    public IReadOnlyCollection<ProcessusControle> ProcessusControles => _processusControles.AsReadOnly();

    private readonly List<Document> _documents = new();
    private readonly List<ProcessusClause> _processusClauses = new();
    private readonly List<ProcessusControle> _processusControles = new();

    private Processus() { }  // EF Core

    public static Processus Create(string categorie, string nom, string responsable, string description, int? societeId = null)
    {
        return new Processus
        {
            Id = Guid.NewGuid(),
            Categorie = categorie,
            Nom = nom,
            Responsable = responsable,
            Description = description,
            SocieteId = societeId,
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
                                  fichierNom, fichierType, fichierData, SocieteId);
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
