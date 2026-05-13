using backend.Domain.Entities;

namespace backend.Domain.Interfaces
{
    public interface ICartographieDocumentationSyncService
    {
        Task SyncOnDocumentAddedAsync(
            Processus processus,
            Document document,
            string currentUserId,
            CancellationToken cancellationToken = default);

        Task SyncOnDocumentRemovedAsync(
            Processus processus,
            Document document,
            string currentUserId,
            CancellationToken cancellationToken = default);

        Task SyncOnProcessusRenamedAsync(
            string oldProcessusName,
            string newProcessusName,
            int? societeId,
            string currentUserId,
            CancellationToken cancellationToken = default);
    }
}
