using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Users.Commands.DeleteUser
{
    public class DeleteUserHandler : IRequestHandler<DeleteUserCommand, (bool, string?)>
    {
        private readonly IUserRepository _userRepo;
        public DeleteUserHandler(IUserRepository userRepo) => _userRepo = userRepo;

        public async Task<(bool, string?)> Handle(DeleteUserCommand req, CancellationToken ct)
        {
            var user = await _userRepo.GetByIdAsync(req.UserId);
            if (user == null) return (false, "Utilisateur introuvable.");

            var result = await _userRepo.DeleteAsync(user);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

            return (true, null);
        }
    }
}
