using Microsoft.AspNetCore.Identity;
using System.Data;

namespace backend.Domain.Entities
{
    public class Permission
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string RoleId { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string ActionId { get; set; } = string.Empty;

        // Navigation
        public virtual Module Module { get; set; } = null!;
        public virtual Action Action { get; set; } = null!;

    }
}
