// ============================================
// client/src/components/Navbar.jsx
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <-- Importamos el tema

function Navbar() {
  const navigate = useNavigate();
  const { usuario, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        
        {/* LOGO */}
        <Link className="navbar-brand fw-bold" to="/">
          🏪 Tienda
        </Link>

        {/* BOTÓN HAMBURGUESA (Para móviles) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {/* ENLACES DE LA IZQUIERDA */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/productos">Productos</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/categorias">Categorías</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/inventario">Inventario</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/ventas">Ventas</Link>
                </li>
                {isAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link fw-bold text-warning" to="/usuarios">
                      👥 Usuarios
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* CONTROLES DE LA DERECHA (Tema, Usuario, Salir) */}
          <div className="d-flex align-items-center gap-3">
            
            {/* Botón Modo Oscuro/Claro */}
            <button 
              className="btn btn-outline-light btn-sm rounded-circle" 
              onClick={toggleTheme}
              title="Cambiar tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {isAuthenticated && (
              <>
                {/* Info del Usuario */}
                <div className="text-light text-end d-none d-lg-block">
                  <span className="d-block small lh-1">
                    👤 {usuario.nombre}
                  </span>
                  <span className="d-block small text-muted" style={{ fontSize: '0.75rem' }}>
                    ({usuario.rol_nombre})
                  </span>
                </div>

                {/* Botón Salir */}
                <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                  Salir
                </button>
              </>
            )}
            
            {!isAuthenticated && (
              <Link className="btn btn-primary btn-sm" to="/login">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;