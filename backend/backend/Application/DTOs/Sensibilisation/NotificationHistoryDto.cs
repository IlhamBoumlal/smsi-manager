namespace backend.Application.DTOs;

public class NotificationHistoryDto
{
    public string Title { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Type { get; set; } = "sent";
}