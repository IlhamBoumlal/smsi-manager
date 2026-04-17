namespace backend.Application.DTOs;

public class DashboardSensibilisationDto
{
    public int Total { get; set; }
    public int Terminees { get; set; }
    public int Planifiees { get; set; }
    public int EnCours { get; set; }
    public double TauxMoyen { get; set; } // participation % moyenne
}