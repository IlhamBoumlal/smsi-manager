using backend.Application.DTOs.ActifDTOs;

namespace backend.Domain.Interfaces
{
    public interface IActifService
    {
        Task<IEnumerable<ActifResponseDto>> GetAllAsync();
        Task<ActifResponseDto?> GetByIdAsync(Guid id);
        Task<ActifResponseDto> CreateAsync(CreateActifDto dto);
        Task<ActifResponseDto?> UpdateAsync(Guid id, UpdateActifDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
