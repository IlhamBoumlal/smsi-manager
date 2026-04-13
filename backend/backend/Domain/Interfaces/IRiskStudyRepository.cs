using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface IRiskStudyRepository
    {
        Task<IEnumerable<RiskStudy>> GetAllBySocieteAsync(int societeId);
        Task<RiskStudy?> GetByIdAsync(Guid id);
        Task<RiskStudy> CreateAsync(RiskStudy study);
        Task<RiskStudy?> UpdateAsync(RiskStudy study);
        Task<bool> DeleteAsync(Guid id);
    }
}
