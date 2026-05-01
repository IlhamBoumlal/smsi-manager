namespace backend.Domain.Entities;

public class Document
{
    public Guid Id { get; private set; }
    public Guid ProcessusId { get; private set; }
    public string Nom { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public string Reference { get; private set; } = string.Empty;
    public string Statut { get; private set; } = string.Empty;
    public string? FichierNom { get; private set; }  // nom original ex: "procedure.pdf"
    public string? FichierType { get; private set; }  // MIME ex: "application/pdf"
    public byte[]? FichierData { get; private set; }  // contenu binaire

    private Document() { }

    public static Document Create(Guid processusId, string nom, string type,
                                  string reference, string statut,
                                  string? fichierNom = null,
                                  string? fichierType = null,
                                  byte[]? fichierData = null)
    {
        return new Document
        {
            Id = Guid.NewGuid(),
            ProcessusId = processusId,
            Nom = nom,
            Type = type,
            Reference = reference,
            Statut = statut,
            FichierNom = fichierNom,
            FichierType = fichierType,
            FichierData = fichierData,
        };
    }
}
