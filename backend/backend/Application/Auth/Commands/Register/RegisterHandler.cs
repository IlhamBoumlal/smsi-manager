using backend.Application.DTOs.Authentification;
using backend.Application.Security;
using backend.Domain.Interfaces;
using MediatR;
using System.Security.Claims;

namespace backend.Application.Auth.Commands.Register
{
    public class RegisterHandler : IRequestHandler<RegisterCommand, (bool, string?, AuthResponseDto?)>
    {
        private readonly IUserRepository _userRepo;
        private readonly IRoleRepository _roleRepo;
        private readonly ISocieteRepository _societeRepo;
        private readonly IJwtTokenService _jwtService;

        public RegisterHandler(
            IUserRepository userRepo, IRoleRepository roleRepo,
            ISocieteRepository societeRepo, IJwtTokenService jwtService)
        {
            _userRepo = userRepo;
            _roleRepo = roleRepo;
            _societeRepo = societeRepo;
            _jwtService = jwtService;
        }

        public async Task<(bool, string?, AuthResponseDto?)> Handle(RegisterCommand req, CancellationToken ct)
        {
            if (req.Password != req.ConfirmPassword)
                return (false, "Les mots de passe ne correspondent pas.", null);

            var role = await _roleRepo.GetByIdAsync(req.RoleId.ToString());
            if (role == null) return (false, "Role introuvable.", null);

            var isSuperAdmin = AppRoles.IsSuperAdminRole(role.Name);
            int? assignedSocieteId = null;
            backend.Domain.Entities.Societe? societe = null;

            if (isSuperAdmin)
            {
                var existingSuperAdmins = await _userRepo.GetUsersByRoleAsync(AppRoles.SuperAdmin);
                var hasAnotherSuperAdmin = existingSuperAdmins.Any(u =>
                    !string.Equals(u.Email, req.Email, StringComparison.OrdinalIgnoreCase));

                if (hasAnotherSuperAdmin)
                {
                    return (false, "Un Super Admin existe déjà. Création refusée.", null);
                }
            }
            else
            {
                if (!req.SocieteId.HasValue)
                    return (false, "Societe requise.", null);

                societe = await _societeRepo.GetByIdAsync(req.SocieteId.Value);
                if (societe == null) return (false, "Societe introuvable.", null);

                assignedSocieteId = req.SocieteId.Value;
            }

            var primaryRoleKey = AppRoles.ToPrimaryRoleKey(role.Name, assignedSocieteId);
            if (AppRoles.IsSuperAdminRoleKey(primaryRoleKey))
            {
                assignedSocieteId = null;
            }

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                NomComplet = req.NomComplet,
                SocieteId = assignedSocieteId,
                PrimaryRoleKey = primaryRoleKey,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userRepo.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

            await _userRepo.AddToRoleAsync(user, role.Name!);
            var claims = new List<Claim>
            {
                new Claim("NomComplet", req.NomComplet)
            };

            if (assignedSocieteId.HasValue && societe is not null)
            {
                claims.Add(new Claim("SocieteId", assignedSocieteId.Value.ToString()));
                claims.Add(new Claim("SocieteNom", societe.Nom ?? string.Empty));
            }

            await _userRepo.AddClaimsAsync(user, claims);

            var token = await _jwtService.GenerateTokenAsync(user);
            var societeInfo = societe is null
                ? null
                : new SocieteInfoDto(societe.Id, societe.Nom ?? string.Empty, societe.Logo);

            return (true, null, new AuthResponseDto(token, req.NomComplet, user.Email!, societeInfo));
        }
    }
}
