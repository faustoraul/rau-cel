// ============================================
// client/src/context/AuthContext.jsx
// Manejo global de la sesión del usuario
// ============================================

import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, recuperar sesión de localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');
    
    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setCargando(false);
  }, []);

  // Función de login
  async function login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: nuevoToken, usuario: nuevoUsuario } = response.data.data;

      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));

      setToken(nuevoToken);
      setUsuario(nuevoUsuario);
      return { ok: true };
    } catch (error) {
      return { 
        ok: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  }

  // Función de logout
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  // Verificaciones de roles
  const isAdmin = usuario?.rol_nombre === 'administrador';
  const isVendedor = usuario?.rol_nombre === 'vendedor';
  const isAuthenticated = !!usuario && !!token;

  return (
    <AuthContext.Provider 
      value={{ usuario, token, cargando, login, logout, isAdmin, isVendedor, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}