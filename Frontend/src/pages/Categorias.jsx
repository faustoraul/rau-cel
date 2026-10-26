import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Categorias() {
  const { isAdmin } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Estado del formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = crear, objeto = editar
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  // Cargar categorías al montar
  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      setCargando(true);
      const res = await api.get('/categorias?incluirInactivas=true');
      setCategorias(res.data.data);
      setError('');
    } catch (err) {
      setError('Error al cargar categorías');
    } finally {
      setCargando(false);
    }
  }

  // Abrir modal para crear
  function abrirCrear() {
    setEditando(null);
    setFormData({ nombre: '', descripcion: '' });
    setModalAbierto(true);
  }

  // Abrir modal para editar
  function abrirEditar(cat) {
    setEditando(cat);
    setFormData({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setModalAbierto(true);
  }

  // Guardar (crear o editar)
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      if (editando) {
        await api.put(`/categorias/${editando.id}`, formData);
        setExito('Categoría actualizada');
      } else {
        await api.post('/categorias', formData);
        setExito('Categoría creada');
      }
      setModalAbierto(false);
      cargarCategorias();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  // Desactivar / Activar
  async function toggleActivo(cat) {
    try {
      if (cat.activo === 1) {
        await api.delete(`/categorias/${cat.id}`);
        setExito('Categoría desactivada');
      } else {
        await api.patch(`/categorias/${cat.id}/activar`);
        setExito('Categoría activada');
      }
      cargarCategorias();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  }

  // Auto-ocultar mensajes
  useEffect(() => {
    if (exito || error) {
      const timer = setTimeout(() => { setExito(''); setError(''); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exito, error]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📂 Categorías</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={abrirCrear}>
            ➕ Nueva categoría
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

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
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  {isAdmin && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center text-muted py-4">
                      No hay categorías registradas.
                    </td>
                  </tr>
                ) : (
                  categorias.map((cat) => (
                    <tr key={cat.id} className={cat.activo === 0 ? 'table-secondary' : ''}>
                      <td>{cat.id}</td>
                      <td>{cat.nombre}</td>
                      <td className="text-muted">{cat.descripcion || '—'}</td>
                      <td>
                        {cat.activo === 1 ? (
                          <span className="badge bg-success">Activa</span>
                        ) : (
                          <span className="badge bg-secondary">Inactiva</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => abrirEditar(cat)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className={`btn btn-sm ${cat.activo === 1 ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => toggleActivo(cat)}
                          >
                            {cat.activo === 1 ? '🚫 Desactivar' : '✅ Activar'}
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

      {/* Modal de creación/edición */}
      {modalAbierto && (
        <>
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editando ? 'Editar categoría' : 'Nueva categoría'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        minLength={2}
                        maxLength={100}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        maxLength={255}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editando ? 'Guardar cambios' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Categorias;