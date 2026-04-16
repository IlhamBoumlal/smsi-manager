namespace Domain.Entities;

public class PlanStep
{
    public int     Id           { get; set; }
    public int     ActionPlanId { get; set; }
    public string   Title        { get; set; } = default!;
    public string?  Description  { get; set; }
    public string   Status       { get; set; } = "todo";
    public DateTime Echeance     { get; set; }
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt    { get; set; } = DateTime.UtcNow;

    public ActionPlan ActionPlan { get; set; } = default!;
}
