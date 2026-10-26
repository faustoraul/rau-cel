import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({ totalProductos: 0, existencias: 0, ventasHoy: 0, bajoStock: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const [rProd, rVentas] = await Promise.all([
          api.get('/productos'),
          api.get(`/ventas?desde=${hoy} 00:00:00&hasta=${hoy} 23:59:59&estado=COMPLETADA`)
        ]);
        
        const prods = rProd.data.data.filter(p => p.activo === 1);
        const ventas = rVentas.data.data;
        
        setStats({
          totalProductos: prods.length,
          existencias: prods.reduce((acc, p) => acc + p.stock, 0),
          ventasHoy: ventas.reduce((acc, v) => acc + parseFloat(v.total), 0),
          bajoStock: prods.filter(p => p.stock <= p.stock_minimo).sort((a,b) => a.stock - b.stock)
        });
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

  return (
    <div>
      <h1>👋 Bienvenido, {usuario?.nombre}</h1>
      <div className="row g-3 mb-4 mt-2">
        <div className="col-md-4">
          <div className="card border-primary shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="text-muted">Productos activos</h6><h2>{stats.totalProductos}</h2></div>
              <div className="fs-1">🛍️</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-success shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="text-muted">Existencias totales</h6><h2>{stats.existencias}</h2></div>
              <div className="fs-1">📦</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-warning shadow-sm">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="text-muted">Ventas de hoy</h6><h2>RD$ {stats.ventasHoy.toFixed(2)}</h2></div>
              <div className="fs-1">💰</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-header bg-warning text-dark"><h5 className="mb-0">⚠️ Bajo Stock</h5></div>
        <div className="card-body p-0">
          {stats.bajoStock.length === 0 ? (
            <p className="text-center text-muted py-4 mb-0">Todo en orden 🎉</p>
          ) : (
            <table className="table mb-0">
              <thead><tr><th>Código</th><th>Producto</th><th>Stock</th></tr></thead>
              <tbody>
                {stats.bajoStock.map(p => (
                  <tr key={p.id}><td>{p.codigo}</td><td>{p.nombre}</td><td><span className="badge bg-danger">{p.stock}</span></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;