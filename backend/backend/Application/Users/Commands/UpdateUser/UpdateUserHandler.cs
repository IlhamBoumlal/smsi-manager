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

            if (!req.SocieteId.HasValue)
                return (false, "Societe requise.");

            var societe = await _societeRepo.GetByIdAsync(req.SocieteId.Value);
            if (societe == null) return (false, "Societe introuvable.");

            user.NomComplet = req.NomComplet;
            user.Email = req.Email;
            user.UserName = req.Email;
            user.SocieteId = req.SocieteId.Value;
            user.IsActive = req.IsActive;

            var updateResult = await _userRepo.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return (false, string.Join(", ", updateResult.Errors.Select(e => e.Description)));

            var currentRoles = await _userRepo.GetRolesAsync(user);
            await _userRepo.RemoveFromRolesAsync(user, currentRoles);

            var role = await _roleRepo.GetByIdAsync(req.RoleId);
            if (role != null)
                await _userRepo.AddToRoleAsync(user, role.Name!);

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
