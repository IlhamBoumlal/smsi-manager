using backend.Application.DTOs.Authentification;
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

            var societe = await _societeRepo.GetByIdAsync(req.SocieteId);
            if (societe == null) return (false, "Société introuvable.", null);

            var role = await _roleRepo.GetByIdAsync(req.RoleId.ToString());
            if (role == null) return (false, "Rôle introuvable.", null);

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                NomComplet = req.NomComplet,
                SocieteId = req.SocieteId,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userRepo.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

            await _userRepo.AddToRoleAsync(user, role.Name!);
            await _userRepo.AddClaimsAsync(user, new[]
            {
            new Claim("NomComplet", req.NomComplet),
            new Claim("SocieteId", req.SocieteId.ToString()),
            new Claim("SocieteNom", societe.Nom)
        });

            var token = await _jwtService.GenerateTokenAsync(user);
            var societeInfo = new SocieteInfoDto(societe.Id, societe.Nom, societe.Logo);
            return (true, null, new AuthResponseDto(token, req.NomComplet, user.Email!, societeInfo));
        }
    }
}
