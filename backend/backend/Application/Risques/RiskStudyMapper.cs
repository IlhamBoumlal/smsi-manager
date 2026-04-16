using System.Text.Json;
using backend.Application.DTOs.Risques;
using backend.Domain.Entities;

namespace backend.Application.Risques
{
    internal static class RiskStudyMapper
    {
        public static RiskStudyDto ToDto(RiskStudy study)
        {
            return new RiskStudyDto(
                study.Id,
                study.Name,
                study.Organization,
                study.Description,
                study.Perimeter,
                study.Author,
                NormalizePayload(study.PayloadJson),
                study.SocieteId,
                study.CreatedAt,
                study.UpdatedAt
            );
        }

        public static string NormalizePayload(string? payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
                return "{}";

            try
            {
                using var _ = JsonDocument.Parse(payloadJson);
                return payloadJson;
            }
            catch
            {
                return "{}";
            }
        }
    }
}
