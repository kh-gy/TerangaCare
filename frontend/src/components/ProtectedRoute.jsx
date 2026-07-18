import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function ProtectedRoute() {
  const { initialized, authenticated } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-600 font-semibold">
        Chargement de la session…
      </div>
    );
  }

  if (!authenticated) {
    // Mémorise la page demandée pour y revenir après connexion.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
