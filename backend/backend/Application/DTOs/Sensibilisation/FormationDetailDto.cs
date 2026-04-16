using Application.DTOs.Cartographie;

namespace backend.Application.DTOs;

public class FormationDetailDto : FormationListDto
{
    public string Description { get; set; } = string.Empty;
    public string Objectif { get; set; } = string.Empty;
    public List<ParticipantDto> ParticipantsList { get; set; } = [];
    public List<DocumentDto> Docs { get; set; } = [];
    public List<NotificationHistoryDto> NotifHistory { get; set; } = [];
}
