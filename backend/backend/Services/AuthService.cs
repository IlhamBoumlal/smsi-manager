using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Services
{
    public class AuthService
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(UserManager<IdentityUser> userManager,
                           SignInManager<IdentityUser> signInManager,
                           AppDbContext db,
                           IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _db = db;
            _config = config;
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Data)> Register(RegisterDto dto)
        {
            // Vérification mot de passe
            if (dto.Password != dto.ConfirmPassword)
                return (false, "Les mots de passe ne correspondent pas.", null);

            // Vérification société existe
            var societe = await _db.Societes.FindAsync(dto.SocieteId);
            if (societe == null)
                return (false, "Société introuvable.", null);

            var user = new IdentityUser
            {
                UserName = dto.Email,
                Email = dto.Email
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return (false, errors, null);
            }

            // Ajout des claims personnalisés
            await _userManager.AddClaimsAsync(user, new[]
            {
                new Claim("NomComplet", dto.NomComplet),
                new Claim("SocieteId", dto.SocieteId.ToString()),
                new Claim("HoldingId", dto.HoldingId?.ToString() ?? "")
            });

            var token = await GenerateToken(user);
            return (true, null, new AuthResponseDto(token, dto.NomComplet, user.Email!));
        }

        public async Task<(bool Success, string? Error, AuthResponseDto? Data)> Login(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return (false, "Identifiants incorrects.", null);

            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                    return (false, "Compte bloqué temporairement.", null);
                return (false, "Identifiants incorrects.", null);
            }

            var claims = await _userManager.GetClaimsAsync(user);
            var nomComplet = claims.FirstOrDefault(c => c.Type == "NomComplet")?.Value ?? "";

            var token = await GenerateToken(user);
            return (true, null, new AuthResponseDto(token, nomComplet, user.Email!));
        }

        private async Task<string> GenerateToken(IdentityUser user)
        {
            var userClaims = await _userManager.GetClaimsAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!)
            };
            claims.AddRange(userClaims);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(double.Parse(_config["Jwt:ExpireMinutes"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Pour les dropdowns
        public async Task<List<HoldingDto>> GetHoldings()
            => await _db.Holdings.Select(h => new HoldingDto(h.Id, h.Nom)).ToListAsync();

        public async Task<List<SocieteDto>> GetSocietes(int? holdingId = null)
            => await _db.Societes
                .Where(s => holdingId == null || s.HoldingId == holdingId)
                .Select(s => new SocieteDto(s.Id, s.Nom, s.HoldingId))
                .ToListAsync();
    }
}