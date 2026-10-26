import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Inventario() {
  const { isAdmin } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '', tipo: 'ENTRADA', cantidad: '', motivo: ''
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [filtroProducto, filtroTipo]);

  async function cargarProductos() {
    try {
      const res = await api.get('/productos');
      setProductos(res.data.data.filter(p => p.activo === 1));
    } catch (err) {
      console.error('Error cargando productos', err);
    }
  }

  async function cargarMovimientos() {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroProducto) params.append('producto_id', filtroProducto);
      if (filtroTipo) params.append('tipo', filtroTipo);

      const res = await api.get(`/inventario?${params.toString()}`);
      setMovimientos(res.data.data);
      setError('');
    } catch (err) {
      setError('Error al cargar movimientos');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setFormData({ producto_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      await api.post('/inventario', {
        producto_id: parseInt(formData.producto_id),
        tipo: formData.tipo,
        cantidad: parseInt(formData.cantidad),
        motivo: formData.motivo || null
      });
      setExito('Movimiento registrado');
      setModalAbierto(false);
      cargarMovimientos();
      cargarProductos(); // por si cambió el stock
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar movimiento');
    }
  }

  useEffect(() => {
    if (exito || error) {
      const timer = setTimeout(() => { setExito(''); setError(''); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exito, error]);

  // Color por tipo
  const badgeTipo = (tipo) => {
    if (tipo === 'ENTRADA') return 'bg-success';
    if (tipo === 'SALIDA') return 'bg-danger';
    return 'bg-warning text-dark'; // AJUSTE
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📊 Inventario</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={abrirModal}>
            ➕ Nuevo movimiento
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-4">
          <select
            className="form-select"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th className="text-end">Cantidad</th>
                  <th className="text-end">Antes</th>
                  <th className="text-end">Después</th>
                  <th>Motivo</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>
                        <code>{m.producto_codigo}</code>
                        <br />
                        <small className="text-muted">{m.producto_nombre}</small>
                      </td>
                      <td>
                        <span className={`badge ${badgeTipo(m.tipo)}`}>{m.tipo}</span>
                      </td>
                      <td className="text-end">{m.cantidad}</td>
                      <td className="text-end">{m.stock_anterior}</td>
                      <td className="text-end"><strong>{m.stock_nuevo}</strong></td>
                      <td className="text-muted small">{m.motivo || '—'}</td>
                      <td className="small">{m.usuario_nombre}</td>
                      <td className="small text-muted">
                        {new Date(m.created_at).toLocaleString('es-DO')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo movimiento de inventario</h5>
                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Producto *</label>
                    <select
                      className="form-select"
                      value={formData.producto_id}
                      onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.codigo} - {p.nombre} (stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-select"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      required
                    >
                      <option value="ENTRADA">Entrada (suma al stock)</option>
                      <option value="SALIDA">Salida (resta del stock)</option>
                      <option value="AJUSTE">Ajuste (fija el stock al valor)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {formData.tipo === 'AJUSTE' ? 'Nuevo stock *' : 'Cantidad *'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Motivo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      maxLength={255}
                      placeholder="Ej: Compra de proveedor, Merma, Conteo físico..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;