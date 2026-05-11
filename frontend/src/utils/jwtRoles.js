const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const getJwtRoles = () => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const payload = decodeToken(token);
  if (!payload || typeof payload !== "object") return [];

  const raw = payload[ROLE_CLAIM] ?? payload.role ?? payload.roles;
  if (Array.isArray(raw)) return raw.map((r) => String(r));
  if (typeof raw === "string") return [raw];
  return [];
};

export const hasJwtRole = (roleName) =>
  getJwtRoles().some((role) => role.toLowerCase() === roleName.toLowerCase());
