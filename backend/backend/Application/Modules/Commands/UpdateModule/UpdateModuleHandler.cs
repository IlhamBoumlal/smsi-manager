using backend.Domain.Entities;
using backend.Domain.Interfaces;
using MediatR;

namespace backend.Application.Modules.Commands.UpdateModule
{
    public class UpdateModuleHandler : IRequestHandler<UpdateModuleCommand, Module>
    {
        private readonly IModuleRepository _repo;

        public UpdateModuleHandler(IModuleRepository repo)
        {
            _repo = repo;
        }

        public async Task<Module> Handle(UpdateModuleCommand request, CancellationToken ct)
        {
            var module = await _repo.GetModuleByIdAsync(request.Id);
            if (module == null)
                throw new InvalidOperationException($"Module avec l'ID '{request.Id}' non trouvé");

            // Vérifier si le nouveau code n'est pas déjà utilisé par un autre module
            var existingModule = await _repo.GetModuleByCodeAsync(request.Code);
            if (existingModule != null && existingModule.Id != request.Id)
                throw new InvalidOperationException($"Un module avec le code '{request.Code}' existe déjà");

            module.Code = request.Code;
            module.Name = request.Name;
            module.UpdatedAt = DateTime.UtcNow;

            return await _repo.UpdateModuleAsync(module);
        }
    }
}
