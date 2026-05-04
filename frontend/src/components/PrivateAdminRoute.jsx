import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScopedRoles } from '../utils/roleScopes';

const DEFAULT_ADMIN_SCOPES = ['super_admin', 'admin_societe'];

export default function PrivateAdminRoute({ children, requiredScopes = DEFAULT_ADMIN_SCOPES }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const scopedRoles = getScopedRoles(user);
  const isAllowed = requiredScopes.some((scope) => scopedRoles.has(scope));
  if (!isAllowed) return <Navigate to="/" replace />;

  return children;
}
