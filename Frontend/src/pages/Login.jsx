import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <div className="d-flex vh-100 w-100 overflow-hidden">
      
      {/* MITAD IZQUIERDA: Branding (Solo visible en pantallas grandes) */}
      <div 
        className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5 position-relative"
        style={{ backgroundColor: '#1a1d20' }} // Color oscuro elegante
      >
        {/* Botón de tema en la esquina superior izquierda */}
        <button 
          className="btn btn-outline-light btn-sm rounded-circle position-absolute top-0 start-0 m-4" 
          onClick={toggleTheme}
          title="Cambiar tema"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="text-center">
          <div className="display-1 mb-3">🏪</div>
          <h1 className="fw-bold mb-3">Sistema de Tienda</h1>
          <p className="lead text-white-50">
            Gestiona tu inventario, ventas y usuarios en un solo lugar de forma rápida y segura.
          </p>
        </div>
      </div>

      {/* MITAD DERECHA: Formulario */}
      <div className="col-md-6 d-flex align-items-center justify-content-center bg-body-tertiary position-relative">
        
        {/* En móviles, mostramos el botón de tema aquí */}
        <button 
          className="btn btn-outline-secondary btn-sm rounded-circle position-absolute top-0 end-0 m-4 d-md-none" 
          onClick={toggleTheme}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div className="w-100 px-4" style={{ maxWidth: '420px' }}>
          
          <div className="text-center mb-5 d-md-none">
            <h2 className="fw-bold">🏪 Tienda</h2>
          </div>

          <div className="mb-4">
            <h2 className="fw-bold text-body">Bienvenido de nuevo</h2>
            <p className="text-muted">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 border-0 shadow-sm" role="alert">
              <small>⚠️ {error}</small>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label small fw-bold text-muted">CORREO ELECTRÓNICO</label>
              <div className="input-group input-group-lg shadow-sm">
                <span className="input-group-text bg-body border-end-0 text-muted">📧</span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@tienda.com"
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="form-label small fw-bold text-muted">CONTRASEÑA</label>
              <div className="input-group input-group-lg shadow-sm">
                <span className="input-group-text bg-body border-end-0 text-muted">🔒</span>
                <input
                  type="password"
                  className="form-control border-start-0 ps-0"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-100 shadow-sm fw-bold"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Entrando...</>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="text-center mt-5 text-muted small">
            &copy; {new Date().getFullYear()} Sistema de Tienda. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;