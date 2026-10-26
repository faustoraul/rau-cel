import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home'; // ← ahora es Dashboard
import Login from './pages/Login';
import Categorias from './pages/Categorias';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';
import NotFound from './pages/NotFound';
import Usuarios from './pages/Usuarios';

function App() {
  return (
    <BrowserRouter>
      <Routes>
                {/* Login va FUERA del Layout para que no tenga Navbar */}
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          {/* ... rutas protegidas ... */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<Home />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="productos" element={<Productos />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;