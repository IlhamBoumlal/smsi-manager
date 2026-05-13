import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEFAULT_FALLBACKS = [
  { moduleCode: "dashboard", path: "/tableau-bord" },
  { moduleCode: "cartographie", path: "/cartographie" },
  { moduleCode: "pdca", path: "/pdca" },
  { moduleCode: "clauses", path: "/clauses" },
  { moduleCode: "controles", path: "/controles" },
  { moduleCode: "documentation", path: "/documentation" },
  { moduleCode: "risques", path: "/risques" },
  { moduleCode: "audit", path: "/audits" },
  { moduleCode: "actifs", path: "/actifs" },
  { moduleCode: "incidents", path: "/incidents" },
  { moduleCode: "sensibilisation", path: "/sensibilisation" },
  { moduleCode: "users", path: "/admin/utilisateurs" },
  { moduleCode: "roles", path: "/admin/roles" },
];

export default function RequireModulePermission({ moduleCode, children }) {
  const { permissionsLoaded, canRead, isSuperAdmin, isAdminSociete } = useAuth();
  const location = useLocation();

  if (!permissionsLoaded) {
    return null;
  }

  if (!canRead(moduleCode)) {
    if (isSuperAdmin) {
      return <Navigate to="/super-admin" replace state={{ from: location.pathname }} />;
    }

    const adminFallbacks = isAdminSociete
      ? [
          { moduleCode: "users", path: "/admin/utilisateurs" },
          { moduleCode: "roles", path: "/admin/roles" },
        ]
      : [];

    const fallback = [...adminFallbacks, ...DEFAULT_FALLBACKS].find((item) => canRead(item.moduleCode));

    if (fallback?.path && fallback.path !== location.pathname) {
      return <Navigate to={fallback.path} replace state={{ from: location.pathname }} />;
    }

    return <Navigate to="/accueil" replace state={{ from: location.pathname }} />;
  }

  return children;
}
