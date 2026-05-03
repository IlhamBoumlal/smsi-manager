using backend.Application.DTOs.User;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Users.Queries.GetAllUsers
{
    public class GetAllUsersHandler : IRequestHandler<GetAllUsersQuery, List<UserDisplayDto>>
    {
        private readonly IUserRepository _userRepo;
        public GetAllUsersHandler(IUserRepository userRepo) => _userRepo = userRepo;

        public async Task<List<UserDisplayDto>> Handle(GetAllUsersQuery request, CancellationToken ct)
        {
            var users = await _userRepo.GetAllWithSocieteAsync();
            var result = new List<UserDisplayDto>();

            foreach (var user in users)
            {
                var roles = await _userRepo.GetRolesAsync(user);
                var nomRole = roles.FirstOrDefault() ?? "Sans role";
                result.Add(new UserDisplayDto(
                    user.Id,
                    user.NomComplet,
                    user.Email!,
                    user.Societe?.Nom ?? "—",
                    nomRole,
                    user.CreatedAt.ToString("dd/MM/yyyy"),
                    user.IsActive ? "Actif" : "Inactif",
                    user.IsActive
                ));
            }
            return result;
        }
    }
}
