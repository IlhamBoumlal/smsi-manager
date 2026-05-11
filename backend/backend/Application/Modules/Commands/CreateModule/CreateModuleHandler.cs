using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Modules.Commands.CreateModule
{
    public class CreateModuleHandler : IRequestHandler<CreateModuleCommand, Module>
    {
        private readonly IModuleRepository _repo;

        public CreateModuleHandler(IModuleRepository repo)
        {
            _repo = repo;
        }

        public async Task<Module> Handle(CreateModuleCommand request, CancellationToken ct)
        {
            // Vérifier si le code existe déjà
            if (await _repo.ModuleExistsAsync(request.Code))
                throw new InvalidOperationException($"Un module avec le code '{request.Code}' existe déjà");

            var module = new Module
            {
                Code = request.Code,
                Name = request.Name,
                
                CreatedAt = DateTime.UtcNow
            };

            return await _repo.CreateModuleAsync(module);
        }
    }
}
