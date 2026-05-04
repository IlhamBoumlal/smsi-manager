using backend.Application.Security;
using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Users.Commands.UpdateUser
{
    public class UpdateUserHandler : IRequestHandler<UpdateUserCommand, (bool, string?)>
    {
        private readonly IUserRepository _userRepo;
        private readonly IRoleRepository _roleRepo;
        private readonly ISocieteRepository _societeRepo;

        public UpdateUserHandler(
            IUserRepository userRepo,
            IRoleRepository roleRepo,
            ISocieteRepository societeRepo)
        {
            _userRepo = userRepo;
            _roleRepo = roleRepo;
            _societeRepo = societeRepo;
        }

        public async Task<(bool, string?)> Handle(UpdateUserCommand req, CancellationToken ct)
        {
            var user = await _userRepo.GetByIdAsync(req.UserId);
            if (user == null) return (false, "Utilisateur introuvable.");

            var role = await _roleRepo.GetByIdAsync(req.RoleId);
            if (role == null || string.IsNullOrWhiteSpace(role.Name))
                return (false, "Rôle introuvable.");

            var targetRole = AppRoles.ResolveCanonicalRoleName(role.Name, req.SocieteId);
            if (!AppRoles.IsFinalRole(targetRole))
                return (false, "Rôle non autorisé.");

            Societe? societe = null;
            if (AppRoles.IsSocieteRequiredRole(targetRole))
            {
                if (!req.SocieteId.HasValue)
                    return (false, "Societe obligatoire pour ce rôle.");

                societe = await _societeRepo.GetByIdAsync(req.SocieteId.Value);
                if (societe == null) return (false, "Société introuvable.");
            }

            user.NomComplet = req.NomComplet;
            user.Email = req.Email;
            user.UserName = req.Email;
            user.SocieteId = societe?.Id;
            user.IsActive = req.IsActive;

            var updateResult = await _userRepo.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));

            var currentRoles = await _userRepo.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                await _userRepo.RemoveFromRolesAsync(user, currentRoles);
            }

            await _userRepo.AddToRoleAsync(user, targetRole);

            if (!string.IsNullOrEmpty(req.Password))
            {
                if (req.Password != req.ConfirmPassword)
                    return (false, "Les mots de passe ne correspondent pas.");

                var token = await _userRepo.GeneratePasswordResetTokenAsync(user);
                var passResult = await _userRepo.ResetPasswordAsync(user, token, req.Password);
                if (!passResult.Succeeded)
                    return (false, string.Join(", ", passResult.Errors.Select(e => e.Description)));
            }

            return (true, null);
        }
    }
}
