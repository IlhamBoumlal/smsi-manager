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
            var user = await _userRepo.GetByEmailAsync(req.Email);
            if (user == null) return (false, "Identifiants incorrects.", null);

            var result = await _userRepo.CheckPasswordAsync(user, req.Password);
            if (!result.Succeeded) return (false, "Identifiants incorrects.", null);

            var token = await _jwtService.GenerateTokenAsync(user);
            var societeInfo = user.Societe != null
                ? new SocieteInfoDto(user.Societe.Id, user.Societe.Nom, user.Societe.Logo)
                : null;

            return (true, null, new AuthResponseDto(token, user.NomComplet, user.Email!, societeInfo));
        }
    }
}
