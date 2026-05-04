using backend.Application.DTOs.Authentification;
using backend.Application.Security;
using backend.Domain.Entities;
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
            if (role == null || string.IsNullOrWhiteSpace(role.Name))
                return (false, "Rôle introuvable.", null);

            var targetRole = AppRoles.ResolveCanonicalRoleName(role.Name, req.SocieteId);
            if (!AppRoles.IsFinalRole(targetRole))
                return (false, "Rôle non autorisé.", null);

            Societe? societe = null;
            if (AppRoles.IsSocieteRequiredRole(targetRole))
            {
                if (!req.SocieteId.HasValue)
                    return (false, "Societe obligatoire pour ce rôle.", null);

                societe = await _societeRepo.GetByIdAsync(req.SocieteId.Value);
                if (societe == null) return (false, "Société introuvable.", null);
            }

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                NomComplet = req.NomComplet,
                SocieteId = societe?.Id,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userRepo.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

            await _userRepo.AddToRoleAsync(user, targetRole);

            var claims = new List<Claim>
            {
                new("NomComplet", req.NomComplet)
            };

            if (societe != null)
            {
                claims.Add(new Claim("SocieteId", societe.Id.ToString()));
                claims.Add(new Claim("SocieteNom", societe.Nom));
            }

            await _userRepo.AddClaimsAsync(user, claims);

            var token = await _jwtService.GenerateTokenAsync(user);
            var societeInfo = societe != null
                ? new SocieteInfoDto(societe.Id, societe.Nom, societe.Logo)
                : null;

            return (true, null, new AuthResponseDto(token, req.NomComplet, user.Email!, societeInfo));
        }
    }
}
