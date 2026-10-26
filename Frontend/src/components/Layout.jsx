// ============================================
// client/src/components/Layout.jsx
// Layout común con navbar y footer
// ============================================

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      {/* El main crece para empujar el footer hacia abajo si hay poco contenido */}
      <main className="container py-4 flex-grow-1">
        <Outlet />
      </main>

      {/* bg-body-tertiary se adapta al modo claro/oscuro automáticamente */}
      <footer className="bg-body-tertiary text-center py-3 border-top">
        <small className="text-muted">
          Sistema de Tienda — {new Date().getFullYear()}
        </small>
      </footer>
    </div>
  );
}

export default Layout;