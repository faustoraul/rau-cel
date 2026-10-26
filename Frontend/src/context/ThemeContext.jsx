// ============================================
// client/src/context/ThemeContext.jsx
// Manejo global del tema claro/oscuro
// ============================================

import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Leer el tema guardado, o usar 'light' por defecto
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Cada vez que el tema cambie, actualizamos el HTML y guardamos
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}