import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasJwtRole } from '../utils/jwtRoles';

export default function PrivateAdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!hasJwtRole('Admin')) return <Navigate to="/" />;
  return children;
}
