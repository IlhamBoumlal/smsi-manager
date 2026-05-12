namespace Application.DTOs.Cartographie;

/// <summary>DTO pour les clauses associées à un processus</summary>
public record ClauseAssocieeDto(
    int Id,
    string Number,
    string Title,
    string? Description,
    string? Justification,
    DateTime AssociatedAt
);
