import { getJwtRoles } from "./jwtRoles";

function normalizeRole(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toRoleScope(normalizedRole) {
  switch (normalizedRole) {
    case "super admin":
      return "super_admin";
    case "admin societe":
      return "admin_societe";
    case "auditeur":
      return "auditeur";
    case "consultant":
      return "consultant";
    case "rssi":
      return "rssi";
    default:
      return null;
  }
}

export function getScopedRoles(user) {
  return new Set(
    [
      ...getJwtRoles(),
      user?.role,
      user?.Role,
      user?.roleName,
      user?.RoleName,
    ]
      .filter(Boolean)
      .map(normalizeRole)
      .map(toRoleScope)
      .filter(Boolean)
  );
}
