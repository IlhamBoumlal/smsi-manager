using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using backend.Infrastructure.Data;
using Application.DTOs.Clause;
using backend.Domain.Entities;

namespace backend.Infrastructure.Services
{
    public class ClauseService : IClauseService
    {
        private readonly AppDbContext _db;

        private static readonly JsonSerializerOptions _json = new()
        {
            PropertyNameCaseInsensitive = true
        };
        public ClauseService(AppDbContext db) => _db = db;

        private static List<ConformityStatus> ResolveEffectiveConformities(IEnumerable<ConformityStatus> source, int? societeId)
        {
            return source
                .GroupBy(cs => cs.IsoClauseId)
                .Select(group =>
                {
                    if (societeId.HasValue)
                    {
                        // Priorite au statut de la societe active, sinon fallback global (SocieteId null).
                        return group
                            .OrderByDescending(cs => cs.SocieteId == societeId.Value)
                            .ThenByDescending(cs => cs.UpdatedAt)
                            .First();
                    }

                    return group
                        .OrderByDescending(cs => cs.UpdatedAt)
                        .First();
                })
                .ToList();
        }

        // ── MAPPERS ───────────────────────────────────────────────────────────

        private static IsoClauseDto MapClause(IsoClause c) => new()
        {
            Id = c.Id,
            Number = c.Number,
            Title = c.Title,
            Description = c.Description,
            ParentId = c.ParentId,
            SubClauses = c.SubClauses.OrderBy(s => s.Number).Select(MapClause).ToList()
        };

        private static ConformityStatusDto MapConformity(ConformityStatus cs) => new()
        {
            Id = cs.Id,
            IsoClauseId = cs.IsoClauseId,
            Status = cs.Status,
            Score = cs.Score,
            LastAudit = cs.LastAudit?.ToString("yyyy-MM-dd"),
            NextAudit = cs.NextAudit?.ToString("yyyy-MM-dd"),
            Comments = cs.Comments,
            UpdatedAt = cs.UpdatedAt.ToString("yyyy-MM-dd"),
        };

        private static ActionPlanDto MapActionPlan(ActionPlan ap) => new()
        {
            // Id (int hashcode) conservé pour les routes :int existantes (update, delete, get).
            // GuidId expose le vrai Guid — OBLIGATOIRE pour les routes fichiers.
            Id = ap.Id.GetHashCode(),
            GuidId = ap.GuidId,
            IsoClauseId = ap.IsoClauseId,
            SubClauseId = ap.SubClauseId,
            Reference = ap.Reference,
            Version = ap.Version,
            DateDetection = ap.DateDetection.ToString("yyyy-MM-dd"),
            SourceDetection = ap.SourceDetection,
            ClauseIso = ap.ClauseIso,
            Gravite = ap.Gravite,
            DescriptionNc = ap.DescriptionNc,
            SpecificFields = ap.SpecificFieldsJson is null ? null
                : JsonSerializer.Deserialize<Dictionary<string, string>>(ap.SpecificFieldsJson, _json),
            ResponsableImmediat = ap.ResponsableImmediat,
            MesureImmediate = ap.MesureImmediate,
            PreuvesImmediates = JsonSerializer.Deserialize<List<string>>(ap.PreuvesImmediatesJson, _json) ?? new(),
            AnalyseCausesRacines = ap.AnalyseCausesRacines,
            CausePrincipale = ap.CausePrincipale,
            CausesSecondaires = JsonSerializer.Deserialize<List<string>>(ap.CausesSecondairesJson, _json) ?? new(),
            DocumentAProduire = ap.DocumentAProduire,
            PeriodiciteRevision = ap.PeriodiciteRevision,
            EnjeuxInternes = JsonSerializer.Deserialize<List<EnjeuxDto>>(ap.EnjeuxInternesJson, _json) ?? new(),
            EnjeuxExternes = JsonSerializer.Deserialize<List<EnjeuxDto>>(ap.EnjeuxExternesJson, _json) ?? new(),
            EtapesPlanAction = JsonSerializer.Deserialize<List<EtapeDto>>(ap.EtapesPlanActionJson, _json) ?? new(),
            DateEcheanceGlobale = ap.DateEcheanceGlobale?.ToString("yyyy-MM-dd"),
            ResponsablePlan = ap.ResponsablePlan,
            RessourcesNecessaires = ap.RessourcesNecessaires,
            MethodesVerification = JsonSerializer.Deserialize<List<string>>(ap.MethodesVerificationJson, _json) ?? new(),
            DateVerification = ap.DateVerification?.ToString("yyyy-MM-dd"),
            ResultatsObtenus = ap.ResultatsObtenus,
            PiecesJointes = JsonSerializer.Deserialize<List<PieceJointeDto>>(ap.PiecesJointesJson, _json) ?? new(),
            Statut = ap.Statut,
            PlanCloture = ap.PlanCloture,
            DateCloture = ap.DateCloture?.ToString("yyyy-MM-dd"),
            Validateur = ap.Validateur,
            CreatedAt = ap.CreatedAt.ToString("yyyy-MM-dd"),
            UpdatedAt = ap.UpdatedAt.ToString("yyyy-MM-dd"),
        };

        private static void ApplyDto(ActionPlan ap, CreateActionPlanDto dto)
        {
            ap.IsoClauseId = dto.IsoClauseId;
            ap.SubClauseId = dto.SubClauseId;
            ap.Reference = dto.Reference;
            ap.Version = dto.Version;
            if (DateTime.TryParse(dto.DateDetection, out var dd)) ap.DateDetection = dd;
            ap.SourceDetection = dto.SourceDetection;
            ap.ClauseIso = dto.ClauseIso;
            ap.Gravite = dto.Gravite;
            ap.DescriptionNc = dto.DescriptionNc;
            ap.SpecificFieldsJson = dto.SpecificFields is null ? null
                : JsonSerializer.Serialize(dto.SpecificFields);
            ap.ResponsableImmediat = dto.ResponsableImmediat;
            ap.MesureImmediate = dto.MesureImmediate;
            ap.PreuvesImmediatesJson = JsonSerializer.Serialize(dto.PreuvesImmediates);
            ap.AnalyseCausesRacines = dto.AnalyseCausesRacines;
            ap.CausePrincipale = dto.CausePrincipale;
            ap.CausesSecondairesJson = JsonSerializer.Serialize(dto.CausesSecondaires);
            ap.DocumentAProduire = dto.DocumentAProduire;
            ap.PeriodiciteRevision = dto.PeriodiciteRevision;
            ap.EnjeuxInternesJson = JsonSerializer.Serialize(dto.EnjeuxInternes);
            ap.EnjeuxExternesJson = JsonSerializer.Serialize(dto.EnjeuxExternes);
            ap.EtapesPlanActionJson = JsonSerializer.Serialize(dto.EtapesPlanAction);
            ap.DateEcheanceGlobale = DateTime.TryParse(dto.DateEcheanceGlobale, out var deg) ? deg : null;
            ap.ResponsablePlan = dto.ResponsablePlan;
            ap.RessourcesNecessaires = dto.RessourcesNecessaires;
            ap.MethodesVerificationJson = JsonSerializer.Serialize(dto.MethodesVerification);
            ap.DateVerification = DateTime.TryParse(dto.DateVerification, out var dv) ? dv : null;
            ap.ResultatsObtenus = dto.ResultatsObtenus;
            ap.PiecesJointesJson = JsonSerializer.Serialize(dto.PiecesJointes);
            ap.Statut = dto.Statut;
            ap.PlanCloture = dto.PlanCloture;
            ap.DateCloture = DateTime.TryParse(dto.DateCloture, out var dc) ? dc : null;
            ap.Validateur = dto.Validateur;
        }

        // ── CLAUSES ───────────────────────────────────────────────────────────

        public async Task<List<IsoClauseDto>> GetClausesAsync()
        {
            var clauses = await _db.IsoClauses
                .Include(c => c.SubClauses)
                .Where(c => c.ParentId == null)
                .OrderBy(c => c.Number)
                .ToListAsync();
            return clauses.Select(MapClause).ToList();
        }

        public async Task<IsoClauseDto?> GetClauseAsync(int id)
        {
            var clause = await _db.IsoClauses
                .Include(c => c.SubClauses)
                .FirstOrDefaultAsync(c => c.Id == id);
            return clause is null ? null : MapClause(clause);
        }

        public async Task SeedClausesAsync()
        {
            if (await _db.IsoClauses.AnyAsync()) return;

            var data = new[]
            {
                ("4",  "Contexte de l'organisation",         "Comprendre le contexte organisationnel et définir le périmètre du SMSI", new[]
                {
                    ("4.1","Compréhension de l'organisation et de son contexte","Identifier les enjeux internes et externes pertinents pour le SMSI"),
                    ("4.2","Compréhension des besoins et attentes des parties intéressées","Déterminer les parties intéressées et leurs exigences"),
                    ("4.3","Détermination du périmètre du SMSI","Définir les limites et l'applicabilité du SMSI"),
                    ("4.4","Système de management de la sécurité de l'information","Établir, mettre en œuvre et améliorer continuellement le SMSI"),
                }),
                ("5",  "Leadership",                         "Engagement de la direction et définition des rôles", new[]
                {
                    ("5.1","Leadership et engagement","La direction doit démontrer son leadership et son engagement envers le SMSI"),
                    ("5.2","Politique de sécurité de l'information","Établir une politique de sécurité alignée avec les objectifs stratégiques"),
                    ("5.3","Rôles, responsabilités et autorités organisationnelles","Attribuer et communiquer les responsabilités pour le SMSI"),
                }),
                ("6",  "Planification",                      "Gestion des risques et définition des objectifs de sécurité", new[]
                {
                    ("6.1","Actions face aux risques et opportunités","Planifier les actions pour traiter les risques et opportunités"),
                    ("6.1.2","Appréciation des risques liés à la sécurité","Processus d'identification et d'évaluation des risques"),
                    ("6.1.3","Traitement des risques liés à la sécurité","Sélection et application des options de traitement des risques"),
                    ("6.2","Objectifs de sécurité de l'information","Établir des objectifs mesurables et planifier leur atteinte"),
                }),
                ("7",  "Support",                            "Ressources, compétences et communication", new[]
                {
                    ("7.1","Ressources","Déterminer et fournir les ressources nécessaires au SMSI"),
                    ("7.2","Compétences","Assurer les compétences des personnes impliquées dans le SMSI"),
                    ("7.3","Sensibilisation","Assurer la sensibilisation du personnel aux politiques de sécurité"),
                    ("7.4","Communication","Établir les processus de communication interne et externe"),
                    ("7.5","Informations documentées","Maîtriser les documents et enregistrements requis par le SMSI"),
                }),
                ("8",  "Fonctionnement",                     "Planification et contrôle des processus opérationnels", new[]
                {
                    ("8.1","Planification et contrôle opérationnels","Planifier, mettre en œuvre et contrôler les processus SMSI"),
                    ("8.2","Appréciation des risques","Réaliser l'appréciation des risques selon les périodicités définies"),
                    ("8.3","Traitement des risques","Mettre en œuvre le plan de traitement des risques"),
                }),
                ("9",  "Évaluation des performances",        "Surveillance, audit et revue de direction", new[]
                {
                    ("9.1","Surveillance, mesure, analyse et évaluation","Surveiller et mesurer les performances du SMSI"),
                    ("9.2","Audit interne","Réaliser des audits internes planifiés du SMSI"),
                    ("9.3","Revue de direction","La direction doit revoir le SMSI à intervalles planifiés"),
                }),
                ("10", "Amélioration",                       "Non-conformités, actions correctives et amélioration continue", new[]
                {
                    ("10.1","Non-conformité et action corrective","Traiter les non-conformités et mettre en place des actions correctives"),
                    ("10.2","Amélioration continue","Améliorer en continu la pertinence, l'adéquation et l'efficacité du SMSI"),
                }),
            };

            foreach (var (num, title, desc, subs) in data)
            {
                var parent = new IsoClause { Number = num, Title = title, Description = desc };
                _db.IsoClauses.Add(parent);
                await _db.SaveChangesAsync();

                foreach (var (sNum, sTitle, sDesc) in subs)
                    _db.IsoClauses.Add(new IsoClause
                    {
                        Number = sNum,
                        Title = sTitle,
                        Description = sDesc,
                        ParentId = parent.Id
                    });
            }

            await _db.SaveChangesAsync();
        }

        // ── CONFORMITY ────────────────────────────────────────────────────────

        public async Task<ConformityStatusDto?> GetConformityAsync(int clauseId, string userId, int? societeId)
        {
            var cs = await _db.ConformityStatuses
                .Where(c => c.IsoClauseId == clauseId && c.UserId == userId)
                .Where(c => societeId.HasValue ? c.SocieteId == societeId.Value || c.SocieteId == null : c.SocieteId == null)
                .FirstOrDefaultAsync();
            return cs is null ? null : MapConformity(cs);
        }

        public async Task<ConformityStatusDto> UpsertConformityAsync(int clauseId, string userId, int? societeId, UpsertConformityDto dto)
        {
            var cs = await _db.ConformityStatuses
                .Where(c => c.IsoClauseId == clauseId && c.UserId == userId)
                .Where(c => societeId.HasValue ? c.SocieteId == societeId.Value || c.SocieteId == null : c.SocieteId == null)
                .FirstOrDefaultAsync();

            if (cs is null)
            {
                cs = new ConformityStatus { IsoClauseId = clauseId, UserId = userId, SocieteId = societeId };
                _db.ConformityStatuses.Add(cs);
            }
            else if (!cs.SocieteId.HasValue && societeId.HasValue)
            {
                cs.SocieteId = societeId;
            }

            cs.Status = dto.Status;
            cs.Score = dto.Score;
            cs.LastAudit = DateTime.TryParse(dto.LastAudit, out var la) ? la : null;
            cs.NextAudit = DateTime.TryParse(dto.NextAudit, out var na) ? na : null;
            cs.Comments = dto.Comments;
            cs.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return MapConformity(cs);
        }

        // ── ACTION PLANS ──────────────────────────────────────────────────────

        public async Task<List<ActionPlanDto>> GetActionPlansAsync(int clauseId, string userId, int? societeId)
        {
            var plans = await _db.ActionPlans
                .Where(ap => ap.IsoClauseId == clauseId && ap.UserId == userId)
                .Where(ap => societeId.HasValue ? ap.SocieteId == societeId.Value || ap.SocieteId == null : ap.SocieteId == null)
                .OrderByDescending(ap => ap.CreatedAt)
                .ToListAsync();
            return plans.Select(MapActionPlan).ToList();
        }

        // Helper interne — lookup par Guid réel (efficace, pas de scan complet)
        private async Task<ActionPlan?> FindPlanByGuidAsync(Guid guidId, string userId, int? societeId)
        {
            return await _db.ActionPlans
                .Where(a => a.GuidId == guidId && a.UserId == userId)
                .Where(a => societeId.HasValue ? a.SocieteId == societeId.Value || a.SocieteId == null : a.SocieteId == null)
                .FirstOrDefaultAsync();
        }

        // Helper interne — lookup par hashcode int (pour les routes :int héritées)
        private async Task<ActionPlan?> FindPlanByHashcodeAsync(int id, string userId, int? societeId)
        {
            // EF ne peut pas traduire GetHashCode() en SQL → on charge les plans en mémoire.
            // Pour limiter l'impact, on filtre déjà par userId/societeId en base.
            var plans = await _db.ActionPlans
                .Where(a => a.UserId == userId)
                .Where(a => societeId.HasValue ? a.SocieteId == societeId.Value || a.SocieteId == null : a.SocieteId == null)
                .ToListAsync();
            return plans.FirstOrDefault(a => a.Id.GetHashCode() == id);
        }

        public async Task<ActionPlanDto?> GetActionPlanAsync(int id, string userId, int? societeId)
        {
            var ap = await FindPlanByHashcodeAsync(id, userId, societeId);
            return ap is null ? null : MapActionPlan(ap);
        }

        public async Task<ActionPlanDto> CreateActionPlanAsync(string userId, int? societeId, CreateActionPlanDto dto)
        {
            var ap = new ActionPlan { UserId = userId, SocieteId = societeId };
            ApplyDto(ap, dto);
            _db.ActionPlans.Add(ap);
            await _db.SaveChangesAsync();
            return MapActionPlan(ap);
        }

        public async Task<ActionPlanDto?> UpdateActionPlanAsync(int id, string userId, int? societeId, UpdateActionPlanDto dto)
        {
            var ap = await FindPlanByHashcodeAsync(id, userId, societeId);
            if (ap is null) return null;
            ApplyDto(ap, dto);
            if (!ap.SocieteId.HasValue && societeId.HasValue)
                ap.SocieteId = societeId;
            ap.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return MapActionPlan(ap);
        }

        public async Task<bool> DeleteActionPlanAsync(int id, string userId, int? societeId)
        {
            var ap = await FindPlanByHashcodeAsync(id, userId, societeId);
            if (ap is null) return false;
            _db.ActionPlans.Remove(ap);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── DASHBOARD ─────────────────────────────────────────────────────────

        public async Task<List<ClauseDashboardDto>> GetDashboardAsync(string userId, int? societeId)
        {
            var clauses = await _db.IsoClauses
                .Include(c => c.SubClauses)
                .Where(c => c.ParentId == null)
                .OrderBy(c => c.Number)
                .ToListAsync();

            var rawConformities = await _db.ConformityStatuses
                .Where(cs => cs.UserId == userId)
                .Where(cs => societeId.HasValue ? cs.SocieteId == societeId.Value || cs.SocieteId == null : cs.SocieteId == null)
                .ToListAsync();
            var conformities = ResolveEffectiveConformities(rawConformities, societeId);

            var actionPlans = await _db.ActionPlans
                .Where(ap => ap.UserId == userId)
                .Where(ap => societeId.HasValue ? ap.SocieteId == societeId.Value || ap.SocieteId == null : ap.SocieteId == null)
                .ToListAsync();

            return clauses.Select(c =>
            {
                var subClauses = c.SubClauses ?? new List<IsoClause>();
                var subConformityDict = new Dictionary<int, ConformityStatusDto>();

                foreach (var sub in subClauses)
                {
                    var conf = conformities.FirstOrDefault(cs => cs.IsoClauseId == sub.Id);
                    if (conf != null)
                        subConformityDict[sub.Id] = MapConformity(conf);
                }

                var totalSubs = subClauses.Count;
                var conformeSubs = subConformityDict.Count(x => x.Value.Status == "conforme");
                var computedScore = totalSubs > 0 ? (int)Math.Round((double)conformeSubs / totalSubs * 100) : 0;
                var isFullyCompliant = totalSubs > 0 && conformeSubs == totalSubs;
                var plans = actionPlans.Where(ap => ap.IsoClauseId == c.Id).ToList();

                return new ClauseDashboardDto
                {
                    Clause = MapClause(c),
                    ComputedScore = computedScore,
                    IsFullyCompliant = isFullyCompliant,
                    SubConformities = subConformityDict,
                    ActionCount = plans.Count,
                    DoneCount = plans.Count(p => p.Statut == "terminee"),
                    InProgress = plans.Count(p => p.Statut == "en-cours"),
                };
            }).ToList();
        }

        // ── GLOBAL STATS ──────────────────────────────────────────────────────

        public async Task<GlobalStatsDto> GetGlobalStatsAsync(string userId, int? societeId)
        {
            var rawConformities = await _db.ConformityStatuses
                .Where(cs => cs.UserId == userId)
                .Where(cs => societeId.HasValue ? cs.SocieteId == societeId.Value || cs.SocieteId == null : cs.SocieteId == null)
                .ToListAsync();
            var conformities = ResolveEffectiveConformities(rawConformities, societeId);

            var plans = await _db.ActionPlans
                .Where(ap => ap.UserId == userId)
                .Where(ap => societeId.HasValue ? ap.SocieteId == societeId.Value || ap.SocieteId == null : ap.SocieteId == null)
                .ToListAsync();

            var totalClauses = await _db.IsoClauses.CountAsync(c => c.ParentId == null);
            var subClauseIds = await _db.IsoClauses
                .Where(c => c.ParentId != null)
                .Select(c => c.Id)
                .ToListAsync();
            var subClauseIdSet = subClauseIds.ToHashSet();
            var totalSubClauses = subClauseIdSet.Count;
            var scopedConformities = conformities
                .Where(c => subClauseIdSet.Contains(c.IsoClauseId))
                .ToList();
            var conformeSubClauses = scopedConformities.Count(c => string.Equals(c.Status, "conforme", StringComparison.OrdinalIgnoreCase));
            var averageConformity = totalSubClauses > 0
                ? Math.Round((double)conformeSubClauses / totalSubClauses * 100, 1)
                : 0;
            var now = DateTime.UtcNow;

            return new GlobalStatsDto
            {
                TotalClauses = totalClauses,
                AverageConformity = averageConformity,
                ConformeClauses = conformeSubClauses,
                PartialClauses = 0,
                NonConformeClauses = scopedConformities.Count(c => string.Equals(c.Status, "non-conforme", StringComparison.OrdinalIgnoreCase)),
                TotalActions = plans.Count,
                CompletedActions = plans.Count(p => p.Statut == "terminee"),
                InProgressActions = plans.Count(p => p.Statut == "en-cours"),
                DelayedActions = plans.Count(p => p.Statut != "terminee"
                                        && p.DateEcheanceGlobale.HasValue
                                        && p.DateEcheanceGlobale < now),
            };
        }

        // ── CONFIGURATION ─────────────────────────────────────────────────────
        private const long MaxFileBytes = 20 * 1024 * 1024; // 20 Mo

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",
            ".ppt", ".pptx", ".txt", ".csv",
            ".png", ".jpg", ".jpeg", ".gif", ".webp",
            ".zip", ".rar", ".7z",
        };

        // ── MAPPER FICHIER ────────────────────────────────────────────────────

        private static FileAttachmentDto MapFile(FileAttachment f) => new()
        {
            Id = f.Id,
            OriginalName = f.OriginalName,
            ContentType = f.ContentType,
            FileSize = f.FileSize,
            Description = f.Description,
            UploadedAt = f.UploadedAt.ToString("yyyy-MM-dd HH:mm"),
            DownloadUrl = $"/api/clauses/files/{f.Id}/download",
        };

        private static ConformityProofDto MapProof(ConformityProof p) => new()
        {
            Id = p.Id,
            IsoClauseId = p.IsoClauseId,
            Description = p.Description,
            CreatedAt = p.CreatedAt.ToString("yyyy-MM-dd"),
            UpdatedAt = p.UpdatedAt.ToString("yyyy-MM-dd"),
            Files = p.Files.Select(MapFile).ToList(),
        };

        // ── HELPER : lecture + validation du fichier entrant ──────────────────

        private static async Task<byte[]> ReadAndValidateAsync(IFormFile file)
        {
            if (file is null || file.Length == 0)
                throw new InvalidOperationException("Fichier vide ou manquant.");
            if (file.Length > MaxFileBytes)
                throw new InvalidOperationException("Fichier trop volumineux (max 20 Mo).");
            var ext = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(ext))
                throw new InvalidOperationException($"Extension non autorisée : {ext}");
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }

        // ── CONFORMITY PROOFS ─────────────────────────────────────────────────

        public async Task<List<ConformityProofDto>> GetConformityProofsAsync(int subClauseId, string userId, int? societeId)
        {
            var proofs = await _db.ConformityProofs
                .Include(p => p.Files)
                .Where(p => p.IsoClauseId == subClauseId && p.UserId == userId)
                .Where(p => societeId.HasValue ? p.SocieteId == societeId.Value || p.SocieteId == null : p.SocieteId == null)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return proofs.Select(MapProof).ToList();
        }

        public async Task<ConformityProofDto> UpsertConformityProofAsync(
            int subClauseId, string userId, int? societeId, UpsertConformityProofDto dto)
        {
            var proof = await _db.ConformityProofs
                .Include(p => p.Files)
                .Where(p => p.IsoClauseId == subClauseId && p.UserId == userId)
                .Where(p => societeId.HasValue ? p.SocieteId == societeId.Value || p.SocieteId == null : p.SocieteId == null)
                .FirstOrDefaultAsync();

            if (proof is null)
            {
                proof = new ConformityProof { IsoClauseId = subClauseId, UserId = userId, SocieteId = societeId };
                _db.ConformityProofs.Add(proof);
            }
            else if (!proof.SocieteId.HasValue && societeId.HasValue)
            {
                proof.SocieteId = societeId;
            }

            proof.Description = dto.Description;
            proof.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return MapProof(proof);
        }

        public async Task<FileAttachmentDto> UploadConformityProofFileAsync(
            int proofId, string userId, int? societeId, IFormFile file, string? description)
        {
            var proof = await _db.ConformityProofs
                .Where(p => p.Id == proofId && p.UserId == userId)
                .Where(p => societeId.HasValue ? p.SocieteId == societeId.Value || p.SocieteId == null : p.SocieteId == null)
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Preuve introuvable.");

            var content = await ReadAndValidateAsync(file);

            var attachment = new FileAttachment
            {
                UserId = userId,
                SocieteId = proof.SocieteId,
                ConformityProofId = proofId,
                OriginalName = Path.GetFileName(file.FileName),
                ContentType = file.ContentType,
                FileSize = file.Length,
                Description = description,
                Content = content,
                UploadedAt = DateTime.UtcNow,
            };

            _db.FileAttachments.Add(attachment);
            await _db.SaveChangesAsync();
            return MapFile(attachment);
        }

        public async Task<bool> DeleteConformityProofFileAsync(int fileId, string userId, int? societeId)
        {
            var f = await _db.FileAttachments
                .Where(x => x.Id == fileId && x.UserId == userId && x.ConformityProofId != null)
                .Where(x => societeId.HasValue ? x.SocieteId == societeId.Value || x.SocieteId == null : x.SocieteId == null)
                .FirstOrDefaultAsync();
            if (f is null) return false;
            _db.FileAttachments.Remove(f);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── ACTION PLAN DOCUMENTS ─────────────────────────────────────────────
        // Ces méthodes reçoivent le vrai Guid du plan (ActionPlanDto.GuidId),
        // ce qui garantit la correspondance avec ActionPlan.Id en base.

        public async Task<List<FileAttachmentDto>> GetActionPlanFilesAsync(Guid planGuidId, string userId, int? societeId)
        {
            var plan = await FindPlanByGuidAsync(planGuidId, userId, societeId);
            if (plan is null) return new();

            var files = await _db.FileAttachments
                .Where(f => f.ActionPlanId == plan.Id && f.UserId == userId)
                .Where(f => societeId.HasValue ? f.SocieteId == societeId.Value || f.SocieteId == null : f.SocieteId == null)
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new FileAttachment
                {
                    Id = f.Id,
                    UserId = f.UserId,
                    ActionPlanId = f.ActionPlanId,
                    OriginalName = f.OriginalName,
                    ContentType = f.ContentType,
                    FileSize = f.FileSize,
                    Description = f.Description,
                    UploadedAt = f.UploadedAt,
                    Content = Array.Empty<byte>(),
                })
                .ToListAsync();

            return files.Select(MapFile).ToList();
        }

        public async Task<FileAttachmentDto> UploadActionPlanFileAsync(
            Guid planGuidId, string userId, int? societeId, IFormFile file, string? description)
        {
            var plan = await FindPlanByGuidAsync(planGuidId, userId, societeId)
                ?? throw new KeyNotFoundException("Plan d'action introuvable.");

            var content = await ReadAndValidateAsync(file);

            var attachment = new FileAttachment
            {
                UserId = userId,
                SocieteId = plan.SocieteId,
                ActionPlanId = plan.Id,
                OriginalName = Path.GetFileName(file.FileName),
                ContentType = file.ContentType,
                FileSize = file.Length,
                Description = description,
                Content = content,
                UploadedAt = DateTime.UtcNow,
            };

            _db.FileAttachments.Add(attachment);
            await _db.SaveChangesAsync();
            return MapFile(attachment);
        }

        public async Task<bool> DeleteActionPlanFileAsync(int fileId, string userId, int? societeId)
        {
            var f = await _db.FileAttachments
                .Where(x => x.Id == fileId && x.UserId == userId && x.ActionPlanId != null)
                .Where(x => societeId.HasValue ? x.SocieteId == societeId.Value || x.SocieteId == null : x.SocieteId == null)
                .FirstOrDefaultAsync();
            if (f is null) return false;
            _db.FileAttachments.Remove(f);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── DOWNLOAD ─────────────────────────────────────────────────────────

        public async Task<(byte[] content, string contentType, string fileName)?> DownloadFileAsync(
            int fileId, string userId, int? societeId)
        {
            var f = await _db.FileAttachments
                .Where(x => x.Id == fileId && x.UserId == userId)
                .Where(x => societeId.HasValue ? x.SocieteId == societeId.Value || x.SocieteId == null : x.SocieteId == null)
                .FirstOrDefaultAsync();

            if (f is null || f.Content.Length == 0) return null;
            return (f.Content, f.ContentType, f.OriginalName);
        }
    }
}
