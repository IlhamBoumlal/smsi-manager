namespace backend.Application.DTOs;

public class FormationListDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // label affichable
    public string Date { get; set; } = string.Empty; // ISO
    public string Heure { get; set; } = string.Empty;
    public string Duree { get; set; } = string.Empty;
    public string Formateur { get; set; } = string.Empty;
    public string FormateurType { get; set; } = string.Empty;
    public string Departement { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // label affichable
    public int Participants { get; set; }
    public int Presents { get; set; }
    public string? LmsLink { get; set; }
}