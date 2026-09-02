import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FormSkeleton } from '../ui/Skeleton';

export function RequireAdmin() {
  const { user, authRequired, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-lg p-8">
        <FormSkeleton fields={4} columns={1} />
      </div>
    );
  }

  if (!authRequired) {
    return <Outlet />;
  }

  if (!user?.permisos.includes('bosque_magico:admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
