import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // Super Admin always uses the dedicated interface.
  if (isSuperAdmin && location.pathname !== "/super-admin" && location.pathname !== "/superadmin") {
    return <Navigate to="/super-admin" replace />;
  }

  return children;
}
