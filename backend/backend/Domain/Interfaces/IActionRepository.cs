// backend.Domain/Interfaces/IActionRepository.cs
using backend.Domain.Entities;
using Action = backend.Domain.Entities.Action;

namespace backend.Domain.Interfaces
{
    public interface IActionRepository
    {
        Task<List<Action>> GetAllActionsAsync();
        Task<Action?> GetActionByIdAsync(string id);
        Task<Action?> GetActionByCodeAsync(string code);
        Task<Action> CreateActionAsync(Action action);
        Task<Action> UpdateActionAsync(Action action);
        Task<bool> DeleteActionAsync(string id);
        Task<bool> ActionExistsAsync(string code);
    }
}