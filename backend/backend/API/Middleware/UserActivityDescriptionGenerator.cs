using backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.API.Middleware
{
    internal sealed record ActivityDescriptionContext(
        string ActionCode,
        string ModuleCode,
        string? TargetType,
        string? TargetId,
        int StatusCode,
        int? SocieteId,
        string? RequestLabelHint);

    internal static class UserActivityDescriptionGenerator
    {
        public static async Task<string> BuildAsync(
            AppDbContext dbContext,
            ActivityDescriptionContext context,
            CancellationToken cancellationToken = default)
        {
            var actionLabel = ActionLabel(context.ActionCode);
            var moduleLabel = ModuleLabel(context.ModuleCode);
            var targetPhrase = TargetPhrase(context.ModuleCode, context.TargetType);
            var targetName = await ResolveTargetNameAsync(dbContext, context, cancellationToken);
            if (string.IsNullOrWhiteSpace(targetName))
            {
                targetName = context.RequestLabelHint;
            }
            var resultLabel = ResultLabel(context.StatusCode);

            var targetSuffix = BuildTargetSuffix(targetName, context.TargetId);
            return $"{actionLabel} {targetPhrase}{targetSuffix} dans {moduleLabel} ({resultLabel})";
        }

        internal static Task<string?> ResolveTargetNameForTraceAsync(
            AppDbContext dbContext,
            ActivityDescriptionContext context,
            CancellationToken cancellationToken = default)
            => ResolveTargetNameAsync(dbContext, context, cancellationToken);

        private static string ActionLabel(string actionCode)
        {
            return NormalizeKey(actionCode) switch
            {
                "create" => "Ajout",
                "edit" => "Modification",
                "delete" => "Suppression",
                "import" => "Import",
                "export" => "Export",
                "approve" => "Approbation",
                "administer" => "Administration",
                _ => "Action"
            };
        }

        private static string ModuleLabel(string moduleCode)
        {
            return NormalizeKey(moduleCode) switch
            {
                "dashboard" => "Tableau de bord",
                "cartographie" => "Cartographie",
                "pdca" => "PDCA",
                "clauses" => "Clauses",
                "controles" => "Controles",
                "risques" => "Risques",
                "documentation" => "Documentation",
                "actifs" => "Actifs",
                "incidents" => "Incidents",
                "sensibilisation" => "Sensibilisation",
                "audit" => "Audits",
                "users" => "Utilisateurs",
                "roles" => "Roles",
                "tracabilite" => "Tracabilite",
                "societes" => "Societes",
                "holdings" => "Holdings",
                "statistiques" => "Statistiques",
                _ => string.IsNullOrWhiteSpace(moduleCode) ? "module inconnu" : moduleCode
            };
        }

        private static string TargetPhrase(string moduleCode, string? targetType)
        {
            var key = $"{NormalizeKey(moduleCode)}:{NormalizeKey(targetType)}";
            return key switch
            {
                "pdca:pdcacycle" => "du cycle PDCA",
                "pdca:pdcasection" => "de la section PDCA",
                "pdca:pdcaitem" => "de la tâche PDCA",
                "risques:riskstudy" => "de l'étude de risque",
                "risques:riskworkshop" => "de l'atelier de risque",
                "cartographie:process" => "du processus",
                "cartographie:processus" => "du processus",
                "cartographie:cartographie" => "du processus",
                "cartographie:processdocument" => "du document de processus",
                "documentation:document" => "du document",
                "documentation:documentversion" => "de la version du document",
                "documentation:documentfile" => "du fichier du document",
                "controles:controle" => "du controle",
                "clauses:clause" => "de la clause",
                "actifs:asset" => "de l'actif",
                "incidents:incident" => "de l'incident",
                "audit:audit" => "de l'audit",
                "audit:auditnc" => "de la non-conformité",
                "audit:auditsimulation" => "de la simulation d'audit",
                "sensibilisation:formation" => "de la formation",
                "sensibilisation:formationparticipant" => "du participant",
                "sensibilisation:formationdocument" => "du document de formation",
                "users:user" => "de l'utilisateur",
                "roles:role" => "du role",
                "dashboard:dashboard" => "du tableau de bord",
                "dashboard:dashboardsnapshot" => "du snapshot du tableau de bord",
                _ => "de l'element"
            };
        }

        private static string ResultLabel(int statusCode)
        {
            return statusCode switch
            {
                >= 200 and < 300 => "succès",
                >= 300 and < 400 => "redirection",
                401 => "refusé",
                403 => "refusé",
                404 => "introuvable",
                >= 400 and < 500 => "échec",
                >= 500 => "erreur serveur",
                _ => "résultat inconnu"
            };
        }

        private static string BuildTargetSuffix(string? targetName, string? targetId)
        {
            if (!string.IsNullOrWhiteSpace(targetName))
            {
                return $" \"{SanitizeLabel(targetName)}\"";
            }

            if (!string.IsNullOrWhiteSpace(targetId))
            {
                return $" #{targetId}";
            }

            return string.Empty;
        }

        private static string SanitizeLabel(string value)
        {
            var compact = value
                .Replace('\r', ' ')
                .Replace('\n', ' ')
                .Replace('"', '\'')
                .Trim();

            return compact.Length <= 80 ? compact : $"{compact[..77]}...";
        }

        private static async Task<string?> ResolveTargetNameAsync(
            AppDbContext dbContext,
            ActivityDescriptionContext context,
            CancellationToken cancellationToken)
        {
            var targetType = NormalizeKey(context.TargetType);
            if (string.IsNullOrWhiteSpace(targetType))
            {
                targetType = InferDefaultTargetType(context.ModuleCode);
            }

            return targetType switch
            {
                "pdcacycle" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.PdcaCycles.AsNoTracking()
                        .Where(cycle => cycle.Id == id && cycle.SocieteId == context.SocieteId)
                        .Select(cycle => cycle.Name)
                        .FirstOrDefaultAsync(cancellationToken)),

                "pdcasection" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Sections.AsNoTracking()
                        .Where(section => section.Id == id
                            && (section.SocieteId == context.SocieteId
                                || section.Phase.Cycle.SocieteId == context.SocieteId))
                        .Select(section => section.Title)
                        .FirstOrDefaultAsync(cancellationToken)),

                "pdcaitem" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.PdcaItems.AsNoTracking()
                        .Where(item => item.Id == id
                            && (item.SocieteId == context.SocieteId
                                || item.Section.Phase.Cycle.SocieteId == context.SocieteId))
                        .Select(item => item.Text)
                        .FirstOrDefaultAsync(cancellationToken)),

                "riskstudy" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.RiskStudies.AsNoTracking()
                        .Where(study => study.Id == id && study.SocieteId == context.SocieteId)
                        .Select(study => study.Name)
                        .FirstOrDefaultAsync(cancellationToken)),

                "process" or "processus" or "cartographie" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Processus.AsNoTracking()
                        .Where(process => process.Id == id && process.SocieteId == context.SocieteId)
                        .Select(process => process.Nom)
                        .FirstOrDefaultAsync(cancellationToken)),

                "processdocument" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Documents.AsNoTracking()
                        .Where(document => document.Id == id && document.SocieteId == context.SocieteId)
                        .Select(document => document.Nom)
                        .FirstOrDefaultAsync(cancellationToken)),

                "document" or "documentversion" or "documentfile" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.DocumentationDocuments.AsNoTracking()
                        .Where(document => document.Id == id && document.SocieteId == context.SocieteId)
                        .Select(document => document.Name)
                        .FirstOrDefaultAsync(cancellationToken)),

                "controle" => await ResolveGuidNameAsync(context.TargetId, async id =>
                {
                    var payload = await dbContext.Controles.AsNoTracking()
                        .Where(control => control.Id == id && control.SocieteId == context.SocieteId)
                        .Select(control => new { control.Code, control.Titre })
                        .FirstOrDefaultAsync(cancellationToken);

                    if (payload is null) return null;
                    if (string.IsNullOrWhiteSpace(payload.Code)) return payload.Titre;
                    if (string.IsNullOrWhiteSpace(payload.Titre)) return payload.Code;
                    return $"{payload.Code} - {payload.Titre}";
                }),

                "clause" => await ResolveIntNameAsync(context.TargetId, id =>
                    dbContext.IsoClauses.AsNoTracking()
                        .Where(clause => clause.Id == id)
                        .Select(clause => string.IsNullOrWhiteSpace(clause.Number) ? clause.Title : $"{clause.Number} - {clause.Title}")
                        .FirstOrDefaultAsync(cancellationToken)),

                "asset" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Actifs.AsNoTracking()
                        .Where(asset => asset.Id == id && asset.SocieteId == context.SocieteId)
                        .Select(asset => asset.Nom)
                        .FirstOrDefaultAsync(cancellationToken)),

                "incident" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Incidents.AsNoTracking()
                        .Where(incident => incident.Id == id && incident.SocieteId == context.SocieteId)
                        .Select(incident => incident.Titre)
                        .FirstOrDefaultAsync(cancellationToken)),

                "audit" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Audits.AsNoTracking()
                        .Where(audit => audit.Id == id && audit.SocieteId == context.SocieteId)
                        .Select(audit => audit.Title)
                        .FirstOrDefaultAsync(cancellationToken)),

                "auditnc" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.NonConformites.AsNoTracking()
                        .Where(nc => nc.Id == id && nc.SocieteId == context.SocieteId)
                        .Select(nc => nc.Title)
                        .FirstOrDefaultAsync(cancellationToken)),

                "auditsimulation" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.SimulationAudits.AsNoTracking()
                        .Where(simulation => simulation.Id == id && simulation.SocieteId == context.SocieteId)
                        .Select(simulation => simulation.Name)
                        .FirstOrDefaultAsync(cancellationToken)),

                "formation" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.Formations.AsNoTracking()
                        .Where(formation => formation.Id == id && formation.SocieteId == context.SocieteId)
                        .Select(formation => formation.Title)
                        .FirstOrDefaultAsync(cancellationToken)),

                "formationparticipant" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.FormationParticipants.AsNoTracking()
                        .Where(participant => participant.Id == id && participant.SocieteId == context.SocieteId)
                        .Select(participant => participant.FullName)
                        .FirstOrDefaultAsync(cancellationToken)),

                "formationdocument" => await ResolveGuidNameAsync(context.TargetId, id =>
                    dbContext.FormationDocuments.AsNoTracking()
                        .Where(document => document.Id == id && document.SocieteId == context.SocieteId)
                        .Select(document => document.FileName)
                        .FirstOrDefaultAsync(cancellationToken)),

                "user" => await ResolveStringNameAsync(context.TargetId, async id =>
                {
                    var payload = await dbContext.Users.AsNoTracking()
                        .Where(user => user.Id == id && (user.SocieteId == context.SocieteId || user.SocieteId == null))
                        .Select(user => new { user.NomComplet, user.Email })
                        .FirstOrDefaultAsync(cancellationToken);

                    return !string.IsNullOrWhiteSpace(payload?.NomComplet)
                        ? payload!.NomComplet
                        : payload?.Email;
                }),

                "role" => await ResolveStringNameAsync(context.TargetId, id =>
                    dbContext.Roles.AsNoTracking()
                        .Where(role => role.Id == id)
                        .Select(role => role.Name)
                        .FirstOrDefaultAsync(cancellationToken)),

                "dashboardsnapshot" => await ResolveGuidNameAsync(context.TargetId, async id =>
                {
                    var monthStart = await dbContext.DashboardMonthlySnapshots.AsNoTracking()
                        .Where(snapshot => snapshot.Id == id && snapshot.SocieteId == context.SocieteId)
                        .Select(snapshot => (DateTime?)snapshot.MonthStartUtc)
                        .FirstOrDefaultAsync(cancellationToken);

                    return monthStart.HasValue ? monthStart.Value.ToString("MM/yyyy") : null;
                }),

                _ => null
            };
        }

        private static async Task<string?> ResolveGuidNameAsync(string? rawId, Func<Guid, Task<string?>> query)
        {
            if (!Guid.TryParse(rawId, out var id))
            {
                return null;
            }

            return await query(id);
        }

        private static async Task<string?> ResolveIntNameAsync(string? rawId, Func<int, Task<string?>> query)
        {
            if (!int.TryParse(rawId, out var id))
            {
                return null;
            }

            return await query(id);
        }

        private static async Task<string?> ResolveStringNameAsync(string? rawId, Func<string, Task<string?>> query)
        {
            if (string.IsNullOrWhiteSpace(rawId))
            {
                return null;
            }

            return await query(rawId.Trim());
        }

        private static string InferDefaultTargetType(string moduleCode)
        {
            return NormalizeKey(moduleCode) switch
            {
                "cartographie" => "process",
                "documentation" => "document",
                "risques" => "riskstudy",
                "pdca" => "pdcaitem",
                _ => string.Empty
            };
        }

        private static string NormalizeKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return value.Trim().ToLowerInvariant().Replace("-", string.Empty).Replace("_", string.Empty).Replace(" ", string.Empty);
        }
    }
}
