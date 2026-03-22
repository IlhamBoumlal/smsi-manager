namespace Application.DTOs;

public record CycleSummaryDto(Guid Id, string Name, bool IsActive, DateTime CreatedAt);

public record CycleDetailDto(
    Guid           Id,
    string         Name,
    bool           IsActive,
    List<PhaseDto> Phases
);

public record PhaseDto(
    Guid             Id,
    string           Key,
    string           Label,
    int              Order,
    List<SectionDto> Sections
);

public record SectionDto(Guid Id, string Title, List<ItemDto> Items);

public record ItemDto(Guid Id, string Text, string Status);
