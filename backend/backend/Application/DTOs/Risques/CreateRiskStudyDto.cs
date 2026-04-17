namespace backend.Application.DTOs.Risques
{
    public class CreateRiskStudyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Perimeter { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = "{}";
    }
}
