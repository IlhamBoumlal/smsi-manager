namespace backend.Application.DTOs;

public class ParticipantDto
{
    public Guid Id { get; set; }
    public string Initials { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Dept { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "Invité" | "Présent"
    public string Color { get; set; } = "blue";
}