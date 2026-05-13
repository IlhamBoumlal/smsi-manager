import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRoleKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function PrivateAdminRoute({ children, allowedRoles = ['Super Admin'] }) {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const userRole = normalizeRoleKey(user?.role || user?.roleName || '');
  const isAllowed = allowedRoles.some((role) => normalizeRoleKey(role) === userRole);
  if (!isAllowed) {
    return <Navigate to={isSuperAdmin ? "/super-admin" : "/tableau-bord"} replace />;
  }

  return children;
}
