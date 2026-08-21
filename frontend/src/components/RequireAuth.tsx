import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RequireAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};