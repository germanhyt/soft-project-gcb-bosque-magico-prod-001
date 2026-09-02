import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../ui/Skeleton';

export function RequireAuth() {
  const { loading, authRequired, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="w-44 space-y-3" aria-busy>
          <span className="sr-only">Cargando sesión…</span>
          <Skeleton className="mx-auto h-11 w-11 rounded-2xl" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="mx-auto h-2 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  if (!authRequired) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
