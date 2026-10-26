// ============================================
// client/src/components/ProtectedRoute.jsx
// Bloquea el acceso a rutas privadas si no hay sesión
// ============================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated, cargando } = useAuth();

  // Mientras revisa localStorage, muestra "Cargando..."
  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando sesión...</p>
      </div>
    );
  }

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, permite el paso
  return <Outlet />;
}

export default ProtectedRoute;