import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Productos() {
  const { isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', descripcion: '', precio: '', stock_minimo: '', categoria_id: ''
  });

  // Cargar productos y categorías al montar
  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [filtroCategoria, busqueda]);

  async function cargarCategorias() {
    try {
      const res = await api.get('/categorias');
      setCategorias(res.data.data.filter(c => c.activo === 1));
    } catch (err) {
      console.error('Error cargando categorías', err);
    }
  }

  async function cargarProductos() {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      params.append('incluirInactivos', 'true');
      if (filtroCategoria) params.append('categoria_id', filtroCategoria);
      if (busqueda) params.append('busqueda', busqueda);

      const res = await api.get(`/productos?${params.toString()}`);
      setProductos(res.data.data);
      setError('');
    } catch (err) {
      setError('Error al cargar productos');
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setFormData({ codigo: '', nombre: '', descripcion: '', precio: '', stock_minimo: '', categoria_id: '' });
    setModalAbierto(true);
  }

  function abrirEditar(prod) {
    setEditando(prod);
    setFormData({
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: prod.precio,
      stock_minimo: prod.stock_minimo,
      categoria_id: prod.categoria_id
    });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      const payload = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock_minimo: parseInt(formData.stock_minimo),
        categoria_id: parseInt(formData.categoria_id)
      };

      if (editando) {
        await api.put(`/productos/${editando.id}`, payload);
        setExito('Producto actualizado');
      } else {
        await api.post('/productos', payload);
        setExito('Producto creado');
      }
      setModalAbierto(false);
      cargarProductos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function toggleActivo(prod) {

  async function eliminarProducto(prod) {
    // 1. Pedimos confirmación al usuario
    const confirmar = window.confirm(`¿Estás SEGURO de eliminar permanentemente el producto "${prod.nombre}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      // 2. Llamamos a nuestro nuevo endpoint
      await api.delete(`/productos/${prod.id}/eliminar`);
      setExito('Producto eliminado permanentemente');
      cargarProductos(); // Recargamos la tabla
    } catch (err) {
      // 3. Mostramos el error si tiene ventas asociadas
      setError(err.response?.data?.message || 'Error al eliminar el producto');
    }
  }
    try {
      if (prod.activo === 1) {
        await api.delete(`/productos/${prod.id}`);
        setExito('Producto desactivado');
      } else {
        await api.patch(`/productos/${prod.id}/activar`);
        setExito('Producto activado');
      }
      cargarProductos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  }

  useEffect(() => {
    if (exito || error) {
      const timer = setTimeout(() => { setExito(''); setError(''); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exito, error]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📦 Productos</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={abrirCrear}>
            ➕ Nuevo producto
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {/* Filtros */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
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
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th className="text-end">Precio</th>
                  <th className="text-end">Stock</th>
                  <th>Estado</th>
                  {isAdmin && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="text-center text-muted py-4">
                      No hay productos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  productos.map((prod) => (
                    <tr key={prod.id} className={prod.activo === 0 ? 'table-secondary' : ''}>
                      <td><code>{prod.codigo}</code></td>
                      <td>{prod.nombre}</td>
                      <td>{prod.categoria_nombre}</td>
                      <td className="text-end">RD$ {parseFloat(prod.precio).toFixed(2)}</td>
                      <td className="text-end">
                        <span className={`badge ${prod.stock <= prod.stock_minimo ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                          {prod.stock}
                        </span>
                      </td>
                      <td>
                        {prod.activo === 1 ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-secondary">Inactivo</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => abrirEditar(prod)}>
                            ✏️
                          </button>
                          <button
                            className="btn btn-sm btn-outline-dark ms-1"
                            onClick={() => eliminarProducto(prod)}
                            title="Eliminar permanentemente"
                          >
                            🗑️
                          </button>
                          <button
                            className={`btn btn-sm ${prod.activo === 1 ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => toggleActivo(prod)}
                          >
                            {prod.activo === 1 ? '🚫' : '✅'}
                          </button>
                        </td>
                      )}
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editando ? 'Editar producto' : 'Nuevo producto'}</h5>
                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Código *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        required
                        maxLength={50}
                        placeholder="Ej: LECHE-001"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categoría *</label>
                      <select
                        className="form-select"
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      minLength={2}
                      maxLength={150}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      maxLength={500}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Precio *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Stock mínimo</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.stock_minimo}
                        onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                      />
                    </div>
                    {!editando && (
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Stock inicial</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="Opcional (0)"
                          disabled
                          title="El stock inicial se maneja desde el módulo de Inventario"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;