using backend.Application.DTOs.Authentification;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Auth.Queries
{
    public class CheckUserStatusHandler : IRequestHandler<CheckUserStatusQuery, UserStatusDto>
    {
        private readonly IUserRepository _userRepo;

        public CheckUserStatusHandler(IUserRepository userRepo)
        {
            _userRepo = userRepo;
        }

        public async Task<UserStatusDto> Handle(CheckUserStatusQuery request, CancellationToken cancellationToken)
        {
            var user = await _userRepo.GetByIdAsync(request.UserId);
            return new UserStatusDto
            {
                IsActive = user?.IsActive ?? false,
                Email = user?.Email ?? ""
            };
        }
    }
}
