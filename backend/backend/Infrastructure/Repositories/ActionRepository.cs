using backend.Domain.Entities;
using backend.Domain.Interfaces;
using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Action = backend.Domain.Entities.Action;

namespace backend.Infrastructure.Repositories
{
    public class ActionRepository : IActionRepository
    {
        private readonly AppDbContext _context;

        public ActionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Action>> GetAllActionsAsync()
        {
            return await _context.Actions
                .ToListAsync();
        }

        public async Task<Action?> GetActionByIdAsync(string id)
        {
            return await _context.Actions.FindAsync(id);
        }

        public async Task<Action?> GetActionByCodeAsync(string code)
        {
            return await _context.Actions
                .FirstOrDefaultAsync(a => a.Code == code);
        }

        public async Task<Action> CreateActionAsync(Action action)
        {
            action.Id = Guid.NewGuid().ToString();
            _context.Actions.Add(action);
            await _context.SaveChangesAsync();
            return action;
        }

        public async Task<Action> UpdateActionAsync(Action action)
        {
            _context.Entry(action).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return action;
        }

        public async Task<bool> DeleteActionAsync(string id)
        {
            var action = await GetActionByIdAsync(id);
            if (action == null) return false;

            _context.Actions.Remove(action);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActionExistsAsync(string code)
        {
            return await _context.Actions.AnyAsync(a => a.Code == code);
        }
    }
}