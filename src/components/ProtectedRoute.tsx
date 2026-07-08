import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { Role } from '../store/auth.store';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/cashier'} replace />;
  }

  return <Outlet />;
}
