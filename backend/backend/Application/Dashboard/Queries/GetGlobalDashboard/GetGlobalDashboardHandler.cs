using backend.Application.DTOs.Dashboard;
using backend.Domain.Enumerations;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Dashboard.Queries.GetGlobalDashboard
{
    public class GetGlobalDashboardHandler : IRequestHandler<GetGlobalDashboardQuery, GlobalDashboardDto>
    {
        private readonly IUserRepository _userRepository;
        private readonly ISocieteRepository _societeRepository;
        private readonly IHoldingRepository _holdingRepository;
        private readonly IActifRepository _actifRepository;
        private readonly IControleRepository _controleRepository;

        public GetGlobalDashboardHandler(
            IUserRepository userRepository,
            ISocieteRepository societeRepository,
            IHoldingRepository holdingRepository,
            IActifRepository actifRepository,
            IControleRepository controleRepository)
        {
            _userRepository = userRepository;
            _societeRepository = societeRepository;
            _holdingRepository = holdingRepository;
            _actifRepository = actifRepository;
            _controleRepository = controleRepository;
        }

        public async Task<GlobalDashboardDto> Handle(GetGlobalDashboardQuery request, CancellationToken ct)
        {
            var users = (await _userRepository.GetAllWithSocieteAsync())
                .Where(u => request.CurrentSocieteId.HasValue && u.SocieteId == request.CurrentSocieteId.Value)
                .ToList();
            var societes = (await _societeRepository.GetAllAsync())
                .Where(s => request.CurrentSocieteId.HasValue && s.Id == request.CurrentSocieteId.Value)
                .ToList();
            var holdings = (await _holdingRepository.GetAllAsync())
                .Where(h => request.CurrentSocieteId.HasValue && h.Societes.Any(s => s.Id == request.CurrentSocieteId.Value))
                .ToList();
            var actifs = (await _actifRepository.GetAllAsync())
                .Where(a => request.CurrentSocieteId.HasValue && a.SocieteId == request.CurrentSocieteId.Value)
                .ToList();
            var controles = (await _controleRepository.GetAllAsync())
                .Where(c => request.CurrentSocieteId.HasValue && c.SocieteId == request.CurrentSocieteId.Value)
                .ToList();

            var totalControles = controles.Count;
            var controlesConformes = controles.Count(c => c.Statut == Statut.Conforme);
            var tauxGlobalConformite = totalControles == 0
                ? 0
                : (int)Math.Round((double)controlesConformes * 100 / totalControles);

            var controlesParStatut = Enum.GetValues<Statut>()
                .Select(statut => new DashboardCountDto(
                    statut.ToString(),
                    controles.Count(c => c.Statut == statut)))
                .ToList();

            var controlesParDomaine = Enum.GetValues<DomaineControle>()
                .Select(domaine => new DashboardCountDto(
                    domaine.ToString(),
                    controles.Count(c => c.Domaine == domaine)))
                .ToList();

            var recentUsers = users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new RecentDashboardUserDto(
                    u.Id,
                    u.NomComplet,
                    u.Email ?? string.Empty,
                    u.Societe?.Nom ?? "—",
                    u.CreatedAt))
                .ToList();

            var recentControles = controles
                .OrderByDescending(c => c.DateMiseAJour)
                .Take(5)
                .Select(c => new RecentDashboardControleDto(
                    c.Id,
                    c.Code,
                    c.Titre,
                    c.Statut.ToString(),
                    c.DateMiseAJour))
                .ToList();

            return new GlobalDashboardDto(
                users.Count,
                societes.Count,
                holdings.Count,
                actifs.Count,
                totalControles,
                tauxGlobalConformite,
                controlesParStatut,
                controlesParDomaine,
                recentUsers,
                recentControles
            );
        }
    }
}
