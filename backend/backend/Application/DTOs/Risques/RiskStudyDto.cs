namespace backend.Application.DTOs.Risques
{
    public record RiskStudyDto(
        Guid Id,
        string Name,
        string Organization,
        string Description,
        string Perimeter,
        string Author,
        string PayloadJson,
        int? SocieteId,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
