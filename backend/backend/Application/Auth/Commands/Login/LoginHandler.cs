using backend.Application.DTOs.Authentification;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Auth.Commands.Login
{
    public class LoginHandler : IRequestHandler<LoginCommand, (bool, string?, AuthResponseDto?)>
    {
        private readonly IUserRepository _userRepo;
        private readonly IJwtTokenService _jwtService;

        public LoginHandler(IUserRepository userRepo, IJwtTokenService jwtService)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
        }

        public async Task<(bool, string?, AuthResponseDto?)> Handle(LoginCommand req, CancellationToken ct)
        {
            var normalizedEmail = req.Email?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(req.Password))
            {
                return (false, "Identifiants incorrects.", null);
            }

            var user = await _userRepo.GetByEmailAsync(normalizedEmail);
            if (user == null) return (false, "Identifiants incorrects.", null);

            // Vérifier si le compte est actif
            if (!user.IsActive)
            {
                return (false, "Votre compte a été désactivé. Veuillez contacter un administrateur.", null);
            }

            var result = await _userRepo.CheckPasswordAsync(user, req.Password);
            if (result.IsLockedOut)
            {
                return (false, "Compte temporairement verrouille apres plusieurs tentatives. Reessayez dans quelques minutes.", null);
            }

            if (result.IsNotAllowed)
            {
                return (false, "Connexion non autorisee pour ce compte.", null);
            }

            if (!result.Succeeded) return (false, "Identifiants incorrects.", null);

            var token = await _jwtService.GenerateTokenAsync(user);
            var societeInfo = user.Societe != null
                ? new SocieteInfoDto(user.Societe.Id, user.Societe.Nom, user.Societe.Logo)
                : null;

            return (true, null, new AuthResponseDto(token, user.NomComplet, user.Email!, societeInfo));
        }
    }
}
