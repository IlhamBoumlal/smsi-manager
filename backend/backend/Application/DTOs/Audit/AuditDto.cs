namespace Application.DTOs;

// ─── Audit ────────────────────────────────────────────────────────────────────

public class AuditDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty; // "yyyy-MM-dd"
    public string? EndDate { get; set; }
    public string Auditor { get; set; } = string.Empty;
    public string Org { get; set; } = string.Empty;
    public string? Rssi { get; set; }
    public string? Approver { get; set; }
    public string? Scope { get; set; }
    public string? Objectives { get; set; }
    public DateTime CreatedAt { get; set; }

    // Post-audit fields
    public string? Author { get; set; }
    public string? Date { get; set; } // date de l'audit post-audit "yyyy-MM-dd"
    public Dictionary<string, string> ControlStatuses { get; set; } = new();
    public Dictionary<string, string> ControlComments { get; set; } = new();
}

public class CreateAuditDto
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "external_cert";
    public string Status { get; set; } = "planned";
    public string StartDate { get; set; } = string.Empty;
    public string? EndDate { get; set; }
    public string Auditor { get; set; } = string.Empty;
    public string Org { get; set; } = string.Empty;
    public string? Rssi { get; set; }
    public string? Approver { get; set; }
    public string? Scope { get; set; }
    public string? Objectives { get; set; }
    public string? Author { get; set; }
    public string? Date { get; set; }
    public Dictionary<string, string> ControlStatuses { get; set; } = new();
    public Dictionary<string, string> ControlComments { get; set; } = new();
}

public class UpdateAuditDto : CreateAuditDto { }

// ─── NonConformité ────────────────────────────────────────────────────────────

public class NonConformiteDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ControlId { get; set; } = string.Empty;
    public string? Actor { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? Responsible { get; set; }
    public string? Deadline { get; set; } // "yyyy-MM-dd"
    public string Status { get; set; } = "open";
    public string? AuditName { get; set; }
    public Guid? AuditId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ActionCorrectiveDto> CorrectiveActions { get; set; } = new();
}

public class CreateNonConformiteDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ControlId { get; set; } = string.Empty;
    public string? Actor { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? Responsible { get; set; }
    public string? Deadline { get; set; }
    public string Status { get; set; } = "open";
    public string? AuditName { get; set; }
    public Guid? AuditId { get; set; }
    public List<CreateActionCorrectiveDto> CorrectiveActions { get; set; } = new();
}

public class UpdateNonConformiteDto : CreateNonConformiteDto { }

// ─── ActionCorrective ─────────────────────────────────────────────────────────

public class ActionCorrectiveDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Responsible { get; set; }
    public string? Deadline { get; set; } // "yyyy-MM-dd"
    public string Status { get; set; } = "pending";
}

public class CreateActionCorrectiveDto
{
    public string? Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Responsible { get; set; }
    public string? Deadline { get; set; }
    public string Status { get; set; } = "pending";
}

// ─── SimulationAudit ─────────────────────────────────────────────────────────

public class SimulationAuditDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string Date { get; set; } = string.Empty; // "yyyy-MM-dd"
    public int Score { get; set; }
    public int TotalAnswered { get; set; }
    public int Oui { get; set; }
    public int Non { get; set; }
    public Dictionary<string, string> Answers { get; set; } = new();
    public Dictionary<string, string> Comments { get; set; } = new();
}

public class CreateSimulationAuditDto
{
    public string Name { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string Date { get; set; } = string.Empty;
    public int Score { get; set; }
    public int TotalAnswered { get; set; }
    public int Oui { get; set; }
    public int Non { get; set; }
    public Dictionary<string, string> Answers { get; set; } = new();
    public Dictionary<string, string> Comments { get; set; } = new();
}