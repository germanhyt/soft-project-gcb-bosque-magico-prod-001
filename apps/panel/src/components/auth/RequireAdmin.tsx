import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RequireAdmin() {
  const { user, authRequired, loading } = useAuth();

  if (loading) {
    return <p className="p-8 text-outline">Cargando…</p>;
  }

  if (!authRequired) {
    return <Outlet />;
  }

  if (!user?.permisos.includes('bosque_magico:admin')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
