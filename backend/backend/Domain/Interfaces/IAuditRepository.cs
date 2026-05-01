namespace backend.Domain.Interfaces
{
    using backend.Domain.Entities;
    public interface IAuditRepository
    {
        Task<IEnumerable<Audit>> GetAllAsync();
        Task<Audit?> GetByIdAsync(string id);
        Task<Audit> CreateAsync(Audit audit);
        Task<Audit> UpdateAsync(Audit audit);
        Task DeleteAsync(string id);
    }
}
