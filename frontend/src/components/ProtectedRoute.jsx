import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function ProtectedRoute() {
  const { initialized, authenticated } = useAuth();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#eef3fa] flex items-center justify-center text-[#1a3c6e] font-semibold">
        Chargement de la session…
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
