namespace backend.Application.DTOs.Dashboard
{
    public record DashboardCountDto(string Label, int Count);

    public record RecentDashboardUserDto(
        string Id,
        string NomComplet,
        string Email,
        string Societe,
        DateTime CreatedAt
    );

    public record RecentDashboardControleDto(
        Guid Id,
        string Code,
        string Titre,
        string Statut,
        DateTime? DateMiseAJour
    );

    public record GlobalDashboardDto(
        int TotalUsers,
        int TotalSocietes,
        int TotalHoldings,
        int TotalActifs,
        int TotalControles,
        int TauxGlobalConformite,
        List<DashboardCountDto> ControlesParStatut,
        List<DashboardCountDto> ControlesParDomaine,
        List<RecentDashboardUserDto> RecentUsers,
        List<RecentDashboardControleDto> RecentControles
    );
}
