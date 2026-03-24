import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateAdminRoute({ children }) {
  const { user } = useAuth();
  const email = user?.email || user?.Email;
  if (!user) return <Navigate to="/login" />;
  if (email !== 'admin@alexsys.com') return <Navigate to="/" />;
  return children;
}